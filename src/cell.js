import { types, getType, clone, destroy, detach } from "mobx-state-tree";

import { setupContext } from "./context";
import {
  Val,
  Op,
  OpEnum,
  ops,
  LinkRef,
  InputRef,
  DepRef,
  Link,
  Input,
  Dependency,
  ContextRepo
} from "./core";
import * as Color from "./color";

const optionalBoolean = types.optional(types.boolean, false);

// placeholder prop for localizable labels
const presetText = text => types.optional(types.string, text);

const Cell = types
  .model("Cell", {
    // key: presetText("CURSOR"),
    // forCellKey: types.maybe(types.string),
    value: types.maybe(types.string),
    x: types.number,
    y: types.number,
    width: types.optional(types.number, 2),
    height: types.optional(types.number, 1),
    gotoCellKey: types.maybe(types.string),
    forLink: types.maybe(types.reference(Link)),
    nodeIndex: types.maybe(types.number)
  })
  .actions(self => ({
    setValue(value) {
      self.value = value;
    }
  }));
// .views(self => ({
//   get cursor() {
//     return true;
//   },
//   get key() {
//     return "CURSOR";
//   }
// }));

// const NodeRef = types.model("NodeRef", {
//   link: types.reference(Link),
//   index: types.maybe(types.number)
// });

const User = types
  .model("User", {
    selectedCell: types.maybe(Cell),
    // settingNode: types.maybe(NodeRef),
    inputMode: optionalBoolean,
    changeCellMode: optionalBoolean,
    changeOpMode: optionalBoolean
  })
  .actions(self => ({
    setSelectedCell(cell) {
      self.selectedCell = cell;
    },
    toggleInputMode() {
      self.selectedCell.value = "";
      self.inputMode = !self.inputMode;
    },
    // beginSettingNode(nodeRef) {
    //   self.settingNode = nodeRef;
    // },
    // endSettingNode() {
    //   self.settingNode = null;
    // },
    toggleChangeCellMode() {
      self.changeCellMode = !self.changeCellMode;
    },
    toggleChangeOpMode() {
      self.changeOpMode = !self.changeOpMode;
    }
  }));

export const ContextUser = setupContext(types.optional(User, {}));

export const CellList = types
  .model("CellList", {
    repo: ContextRepo.Ref
  })
  .views(self => ({
    cells(x = 0, y = 0) {
      const cells = [];

      let currentX = x;
      let currentY = y - 1;

      const { repo, user } = self;

      repo.links.forEach(link => {
        const { linkId, nodes, val, label } = link;

        currentX = x;
        currentY++;

        const key = `CL-${linkId}`;

        cells.push({
          key,
          x: currentX,
          y: currentY,
          width: 2,
          selectable: true,
          text: label
        });

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          const key = `CL-${linkId}-${i}`;

          currentX += 2;

          const newCell = {
            key,
            x: currentX,
            y: currentY,
            width: 2,
            selectable: true,
            forLink: link,
            nodeIndex: i,
            text: node.label,
            fill: node.color
          };

          if (node.ref) {
            newCell.gotoCellKey = `CL-${node.ref.linkId}-0`;
          }

          cells.push(newCell);
        }

        currentX += 2;

        const valType = typeof val;

        cells.push({
          key: `${key}-V`,
          x: currentX,
          y: currentY,
          width: 2,
          selectable: false,
          text:
            valType === "function" ? "func" : valType === "object" ? "obj" : val
        });
      });

      return cells;
    }
  }));

export const LinkCell = types
  .model("LinkCell", {
    user: ContextUser.Ref,
    link: types.reference(Link),
    subCells: types.maybe(types.array(types.late(() => Cell))),
    opened: types.optional(types.boolean, true)
  })
  .views(self => ({
    get selected() {
      return self === self.user.selectedCell;
    },
    get rootBoxes() {
      return self.display({ root: true });
    },
    get rootBox() {
      const { rootBoxes } = self;

      return rootBoxes[rootBoxes.length - 1];
    },
    display(opts = {}) {
      const { link, subCells, selected } = self;
      const { linkId, nodes, color } = link;

      const {
        x = 0,
        y = 0,
        root = false,
        immediateNextIsRef = false,
        nextIsRef = false,
        isLast = true,
        siblingCount = 1
      } = opts;

      const allBoxes = [];

      let currentX = x;

      const siblings = subCells.length;

      for (let i = 0; i < siblings; i++) {
        const subCell = subCells[i];
        const { cellId, node, selected, link, opened } = subCell;
        const category = link ? (opened ? Link : LinkCell) : getType(node); // (HACK) TODO: try to remove this

        const defaultBox = {
          cellRef: subCell,
          text: link ? link.label : node.label,
          color: link ? link.color : node.color,
          key: cellId,
          x: currentX,
          y: y + 1,
          size: 1,
          root: false,
          selected,
          category,
          siblings
        };

        const makeRefCells = linkCell => {
          const innerLink = linkCell.link;
          const { color } = innerLink;

          if (!linkCell.opened) {
            const { label } = innerLink;
            allBoxes.push({
              ...defaultBox,
              text: label,
              color,
              size: 2
            });
            currentX += 2;
            return;
          }

          const isLast = i === subCells.length - 1;

          let immediateNextIsRef = false;
          let nextIsRef = false; // rename to "followedByRef" or something
          for (let k = i; k < siblings; k++) {
            // TODO: don't do this in loop, precompute instead
            const siblingIsLinkCell = Boolean(subCells[k].link);
            if (siblingIsLinkCell) {
              if (k === i + 1) {
                immediateNextIsRef = true;
              }
              nextIsRef = true;
              break;
            }
          }

          const refChildBoxes = linkCell.display({
            x: currentX,
            y: y + 1,
            color,
            immediateNextIsRef,
            nextIsRef,
            isLast,
            selected: linkCell.selected,
            siblingCount: siblings
          });
          allBoxes.push(...refChildBoxes);

          const { size } = refChildBoxes[refChildBoxes.length - 1];
          currentX += size;
        };

        switch (category) {
          case Link:
          case LinkCell:
            makeRefCells(subCell);
            break;
          case Op:
          case InputRef:
            allBoxes.push(defaultBox);
            currentX++;
            break;
          case Val:
            const { val } = subCell;
            const boxSize =
              typeof val === "string" ? Math.ceil(val.length / 6) : 1;
            allBoxes.push({
              ...defaultBox,
              size: boxSize
            });
            currentX += boxSize;
            break;
          case DepRef:
            allBoxes.push({
              ...defaultBox,
              size: 2
            });
            currentX += 2;
            break;
          default:
            throw new Error("A wild node type appeared!");
            allBoxes.push(defaultBox);
            currentX++;
        }
      }

      const { label } = link;
      // TODO: we need some crazy logic to make this more adaptable
      // or perhaps there's a much more elegant way of doing this that I'm not seeing currently
      const thisSize = nextIsRef
        ? Math.max(...allBoxes.map(n => n.x)) -
          x +
          (immediateNextIsRef ? 2 : allBoxes[allBoxes.length - 1].size + 1)
        : Math.max(...allBoxes.map(n => n.x + n.size)) - x;

      const thisNode = {
        cellRef: self,
        key: self.cellId,
        x,
        y,
        size: thisSize,
        color,
        text: label,
        category: Link,
        selected,
        siblings: siblingCount
      };
      allBoxes.push(thisNode);

      return allBoxes;
    }
  }))
  .actions(self => ({
    open() {
      if (!self.subCells) {
        // TODO: rename all ref props to "link"?
        self.subCells = self.link.nodes.map(
          node =>
            node.ref ? { opened: false, link: node.ref } : { node: clone(node) }
        );
      }

      self.opened = true;
    },
    close() {
      self.opened = false;
    },
    afterCreate() {
      if (self.opened) {
        self.open();
      }
    }
  }));
