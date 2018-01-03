import { types } from "mobx-state-tree";

import { Node, ContextRepo } from "./core";
import { LinkCell, ContextUser, CellList, LinkForm } from "./cell";

export const TREE = "TREE";
export const LIST = "LIST";

export const Editor = types
  .model("Editor", {
    ...ContextRepo.Mixin,
    ...ContextUser.Mixin,
    // tree: Tree,
    // root: types.maybe(LinkCell),
    cellList: types.optional(CellList, {}),
    form: types.optional(LinkForm, {}), // TODO: remove hard-code
    currentView: types.optional(types.enumeration([TREE, LIST]), LIST),
    keyMap: types.map(types.string)
  })
  .views(self => ({
    get projectionMap() {
      return {
        [TREE]: self.tree,
        [LIST]: self.list
      };
    },
    get projection() {
      return self.projectionMap[self.currentView];
    },
    get cells() {
      return [
        ...self.cellList.cells(0, 0),
        ...self.form.cells(0, self[ContextRepo.Key].links.size)
      ];

      if (self.root) {
        return self.root.rootBoxes;
      }
      // TODO: switch on type here
      return self.projection.boxes;
    },
    get keyBoxes() {
      return [];
    }
  }))
  .actions(self => ({
    setView(view) {
      self.currentView = view;
    },
    toggleForm() {
      self.form = self.form ? null : { nodeForms };
    },
    moveUp() {
      const { cells } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = cells.find(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x &&
          cell.y === selectedCell.y - 1
      );

      if (gotoCell) {
        self[ContextUser.Key].selectedCell = gotoCell;
      }
    },
    moveDown() {
      const { cells } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = cells.find(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x &&
          cell.y === selectedCell.y + 1
      );

      if (gotoCell) {
        self[ContextUser.Key].selectedCell = gotoCell;
      }
    },
    moveLeft() {
      const { cells } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = cells.find(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x - 2 &&
          cell.y === selectedCell.y
      );

      if (gotoCell) {
        self[ContextUser.Key].selectedCell = gotoCell;
      }
    },
    moveRight() {
      const { cells } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = cells.find(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x + 2 &&
          cell.y === selectedCell.y
      );

      if (gotoCell) {
        self[ContextUser.Key].selectedCell = gotoCell;
      }
    }
  }))
  .actions(self => ({
    onInput(val) {
      const { selectedCell } = self[ContextUser.Key];
      if (selectedCell) {
        selectedCell.val = val;
      }
    }
  }))
  .actions(self => {
    const keyLayout = {
      76: [6, 1],
      78: [6, 2],
      85: [7, 1],
      69: [7, 2],
      188: [7, 3],
      73: [8, 2],
      79: [9, 2]
    };

    const keyTree = {};

    const newNodeMap = {
      7: {
        1: { val: 1 },
        2: { val: 0 },
        3: { val: 2 }
      }
    };

    const handleKeyUp = e => {
      const { keyCode } = e;
      const actionName = self.keyMap.get(keyCode);
      const { projection } = self;

      // TODO: pull this block of logic into own function?
      const coords = keyLayout[keyCode];
      const { selectedCell } = self[ContextUser.Key];
      // if (selectedCell.inputMode) {
      //   return;
      // }

      e.preventDefault();
      console.log(keyCode);

      if (coords) {
        const [x, y] = coords;

        if ("nodeIndex" in selectedCell) {
          if (x === 9 && y === 2) {
            const deleted = selectedCell.forLink.deleteNode(
              selectedCell.nodeIndex
            );

            if (
              selectedCell.nodeIndex >
              selectedCell.forLink.nodes.length - 1
            ) {
              self.moveLeft();
            }
            return;
          }
        }

        if (selectedCell.forLink) {
          if (x === 6 && y === 1) {
            selectedCell.forLink.addNode();
            return;
          }
        }

        if (selectedCell.gotoCellKey) {
          if (x === 7 && y === 2) {
            const gotoCell = self.cells.find(
              cell => cell.key === selectedCell.gotoCellKey
            );
            if (gotoCell) {
              self[ContextUser.Key].setSelectedCell(gotoCell);
              return;
            }
          }
        }

        if (x === 8 && y === 2) {
          return;
        }
      }

      // const didCellKeyAction = selectedCell.onKey(keyCoords);
      // if (didCellKeyAction) {
      //   return;
      // }

      switch (actionName) {
        case "left":
          self.moveLeft();
          // projection.move(-1);
          break;

        case "right":
          self.moveRight();
          // projection.move(+1);
          break;

        case "up":
          self.moveUp();
          // projection.up();
          break;

        case "down":
          self.moveDown();
          // projection.down();
          break;

        case "open":
          self[ContextUser.Key].selectedCell.onKey();
          break;
          projection.open();
          break;

        case "changeView":
          const { currentView } = self;
          if (currentView === TREE) {
            self.setView(LIST);
          } else {
            self.setView(TREE);
          }
          break;

        case "create":
          self.toggleForm();
          break;

        default:
          const action = projection[actionName];
          if (typeof action === "function") {
            action(projection);
          }
      }
    };

    return {
      afterCreate() {
        document.addEventListener("keyup", handleKeyUp);
      },
      beforeDestroy() {
        document.removeEventListener("keyup", handleKeyUp);
      }
    };
  });

export default Editor;
