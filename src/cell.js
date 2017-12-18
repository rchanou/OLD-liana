import { types, getType, clone } from "mobx-state-tree";

import { setupContext } from "./context";
import { Val, Op, InputRef, DepRef, LinkRef, Link, ContextRepo } from "./core";

let idCounter = 0;
const optionalId = types.optional(types.identifier(types.number), () => idCounter++);

const cellId = optionalId;

export const ContextUser = setupContext(
  types.optional(
    types.model("User", {
      selectedCell: types.maybe(types.reference(types.late(() => Cell)))
    }),
    {}
  )
);

export const LinkCell = types
  .model("LinkCell", {
    user: ContextUser.Ref,
    cellId,
    link: types.reference(Link),
    subCells: types.maybe(types.array(types.late(() => Cell))),
    opened: types.optional(types.boolean, true)
    // root: types.optional(types.boolean, true)
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
            const boxSize = typeof val === "string" ? Math.ceil(val.length / 6) : 1;
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
        ? Math.max(...allBoxes.map(n => n.x)) - x + (immediateNextIsRef ? 2 : allBoxes[allBoxes.length - 1].size + 1)
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
          node => (node.ref ? { opened: false, link: node.ref } : { node: clone(node) })
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

const LeafCell = types
  .model("LeafCell", {
    user: ContextUser.Ref,
    cellId,
    node: types.union(Val, Op, InputRef, DepRef)
  })
  .views(self => ({
    get selected() {
      return self === self.user.selectedCell;
    }
  }));

const PosCell = types // TODO: rename all cells
  .model("PosCell", {
    user: ContextUser.Ref,
    cellId,
    node: types.union(Val, Op, InputRef, DepRef, LinkRef, Link),
    x: types.number,
    y: types.number,
    selectable: types.optional(types.boolean, true),
    width: types.optional(types.number, 2)
  })
  .views(self => ({
    get selected() {
      return self === self.user.selectedCell;
    },
    get text() {
      return self.node.label;
    },
    get color() {
      return self.node.color;
    },
    setPos(x, y) {
      self.x = x;
      self.y = y;
    }
  }));

const LabelCell = types
  .model("LabelCell", {
    cellId,
    x: types.number,
    y: types.number,
    width: types.optional(types.number, 2),
    text: types.string,
    color: types.optional(types.string, "#eee") // TODO: remove hard-code
  })
  .views(self => ({
    get selected() {
      return false;
    },
    get selectable() {
      return false;
    },
    setPos(x, y) {
      self.x = x;
      self.y = y;
    }
  }));

export const CellList = types
  .model("CellList", {
    repo: ContextRepo.Ref,
    cells: types.optional(types.array(types.union(PosCell, LabelCell)), [])
  })
  .actions(self => ({
    setPos(x, y) {
      let currentX = x - 1;
      let currentY = y - 1;

      self.cells.forEach(cell => {
        if (!cell.selectable) {
          currentX = x;
          currentY++;
        }

        cell.setPos(currentX, currentY);
        currentX += cell.width;
      });
    },
    afterCreate() {
      const cells = [];

      self.repo.links.forEach(link => {
        const { nodes, label } = link;

        cells.push({
          x: 0,
          y: 0,
          text: label
          // node: clone(link)
        });

        for (const node of nodes) {
          cells.push({
            x: 0,
            y: 0,
            node: clone(node)
          });
        }
      });

      self.cells = cells;
      self.setPos(0, 0);
    }
  }));

export const Cell = types.union(LinkCell, LeafCell);
