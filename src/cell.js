import { types, getType, clone } from "mobx-state-tree";

import { setupContext } from "./context";
import { Val, Op, InputRef, DepRef, Link } from "./core";

let idCounter = 0;
const optionalId = types.optional(types.identifier(types.number), () => idCounter++);

const cellId = optionalId;

export const LinkCell = types
  .model("LinkCell", {
    cellId,
    link: types.reference(Link),
    subCells: types.maybe(types.array(types.late(() => Cell))),
    opened: types.optional(types.boolean, false),
    root: types.optional(types.boolean, true)
  })
  .views(self => ({
    // get x() {},
    // get y() {},
    // get width() {},
    // get display() {
    //   const me = {
    //     x: 0,
    //     y: 0,
    //     width: 0
    //   };

    //   return [...self.subCells.map(sC => sC.display), me];
    // },
    get selected() {
      return false; // TODO: IMPLEMENT
    },
    get displayCells() {
      return self.display();
    },
    display(opts = {}) {
      // const { rootLink, openPaths, selectedPath, selectedIndex } = self;
      const { link, subCells, root, selected } = self;
      const { linkId, nodes, color } = link;
      const {
        x = 0,
        y = 0,
        // color = link.color,
        immediateNextIsRef = false,
        nextIsRef = false,
        isLast = true,
        // path = [linkId],
        // linkPath = [linkId],
        // root = true,
        // selected = false,
        siblingCount = 1
        // opened = true
      } = opts;

      const allBoxes = [];

      // const sameAsSelectedPath =
      //   selectedPath.length === linkPath.length && selectedPath.every((token, j) => token === linkPath[j]);

      let currentX = x;

      const siblings = subCells.length;

      for (let i = 0; i < siblings; i++) {
        // const childPath = [...linkPath, i];

        const subCell = subCells[i];
        const { cellId, node, selected, link } = subCell;
        const category = link ? Link : getType(node); // TODO: try to remove this

        const defaultBox = {
          text: link ? link.label : node.label,
          color: link ? link.color : node.color,
          key: cellId,
          // path: childPath,
          x: currentX,
          y: y + 1,
          size: 1,
          root: false,
          selected,
          // selected: sameAsSelectedPath && selectedIndex === i,
          category,
          siblings
          // downPath: linkPath.length < 2 ? linkPath : linkPath.slice(0, -1)
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
            // root: false,
            // path: childPath,
            // linkPath: [...linkPath, innerLink.linkId],
            x: currentX,
            y: y + 1,
            color,
            immediateNextIsRef,
            nextIsRef,
            isLast,
            selected: linkCell.selected, //sameAsSelectedPath && selectedIndex === i,
            siblingCount: siblings
            //open: openPaths.get(linkPath.join("/"))
          });
          allBoxes.push(...refChildBoxes);

          const { size } = refChildBoxes[refChildBoxes.length - 1];
          currentX += size;
        };

        switch (category) {
          case Link:
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
        // path,
        // upPath: linkPath,
        // ...(root
        //   ? {}
        //   : {
        //       downPath: linkPath.length < 3 ? linkPath.slice(0, -1) : linkPath.slice(0, -2)
        //     }),
        key: self.cellId,
        x,
        y,
        size: thisSize,
        color,
        text: label,
        category: Link,
        selected, // || (sameAsSelectedPath && selectedIndex === null),
        siblings: siblingCount
      };
      allBoxes.push(thisNode);

      // if (root) {
      //   const existingKeys = {};
      //   let i = allBoxes.length;
      //   while (i--) {
      //     const box = allBoxes[i];
      //     const { path } = box;
      //     let j = path.length - 1;
      //     let currentKey = "" + (j in path ? (box.link ? path[j] : `I${path[j]}`) : "");
      //     if (!box.link) {
      //       j--;
      //       currentKey += "/" + (j in path ? path[j] : "");
      //     }
      //     while (existingKeys[currentKey]) {
      //       j--;
      //       currentKey += "/" + (j in path ? path[j] : "");
      //     }
      //     existingKeys[currentKey] = true;
      //     box.key = currentKey;
      //   }
      // }

      return allBoxes;
    }
  }))
  .actions(self => ({
    open() {
      if (!self.subCells) {
        // TODO: rename all ref props to "link"
        self.subCells = self.link.nodes.map(
          node => (node.ref ? { root: false, link: node.ref } : { node: clone(node) })
        );
      }

      self.opened = true;
    },
    close() {
      self.opened = false;
    },
    afterCreate() {
      if (1 || self.root) {
        self.open();
      }
    }
  }));

const LeafCell = types
  .model("LeafCell", {
    cellId,
    node: types.union(Val, Op, InputRef, DepRef)
  })
  .views(self => ({
    // get x() {},
    // get y() {},
    // get width() {},
    get selected() {
      // TODO: IMPLEMENT
      return false;
    },
    get display() {
      const { x, y, width } = self;
      return { x, y, width };

      const { node, selected, parent } = self;

      const nodeType = getType(self.node);

      const defaultCell = {
        key: self.cellId,
        text: node.label,
        color: node.color,
        // path: childPath,
        x: currentX,
        y: y + 1,
        size: 1,
        root: false,
        selected,
        // selected: sameAsSelectedPath && selectedIndex === i,
        nodeType,
        siblings
        // downPath: linkPath.length < 2 ? linkPath : linkPath.slice(0, -1)
      };

      switch (nodeType) {
        case Op:
        case InputRef:
          return defaultCell;
          // allCells.push(defaultCell);
          // currentX++;
          break;
        case Val:
          const { val } = node;
          const boxSize = typeof val === "string" ? Math.ceil(val.length / 6) : 1;
          defaultCell.size = boxSize;
          return defaultCell;
          // allCells.push({
          //   ...defaultCell,
          //   size: boxSize
          // });
          // currentX += boxSize;
          break;
        case DepRef:
          defaultCell.size = 2;
          return defaultCell;
          // allCells.push({
          //   ...defaultCell,
          //   size: 2
          // });
          // currentX += 2;
          break;
        default:
          throw new Error("A wild node type appeared!");
          return defaultCell;
          // allCells.push(defaultCell);
          // currentX++;

          return {
            x: 0,
            y: 0,
            width: 0
          };
      }
    }
  }));

const Cell = types.union(LinkCell, LeafCell);

const ContextUser = setupContext(
  types.model("User", {
    selectedCell: types.maybe(types.reference(Cell))
  })
);
