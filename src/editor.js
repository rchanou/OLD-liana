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
      "65": [0, 2],
      "66": [4, 3],
      "67": [2, 3],
      "68": [4, 2],
      "69": [7, 2],
      "70": [2, 1],
      "71": [4, 1],
      "72": [5, 2],
      "73": [8, 2],
      "74": [5, 1],
      "75": [5, 3],
      "76": [6, 1],
      "77": [6, 3],
      "78": [6, 2],
      "79": [9, 2],
      "80": [3, 1],
      "81": [0, 1],
      "82": [1, 2],
      "83": [2, 2],
      "84": [3, 2],
      "85": [7, 1],
      "86": [3, 3],
      "87": [1, 1],
      "88": [1, 3],
      "89": [8, 1],
      "90": [0, 3],
      "186": [9, 1],
      "188": [7, 3],
      "190": [8, 3],
      "191": [9, 3]
    };

    const keyTree = {};

    const newNodeMap = {
      7: {
        1: { val: 1 },
        2: { val: 0 },
        3: { val: 2 }
      }
    };

    const handleKeyPress = e => {
      const { keyCode } = e;
      const actionName = self.keyMap.get(keyCode);
      const { projection } = self;

      // TODO: pull this block of logic into own function?
      const coords = keyLayout[keyCode];
      // if (selectedCell.inputMode) {
      //   return;
      // }

      console.log(keyCode);

      if (coords) {
        e.preventDefault();

        const [x, y] = coords;
        const user = self[ContextUser.Key];
        const { selectedCell, changeCellMode } = user;

        const { forLink, nodeIndex } = selectedCell;

        if (x === 6 && y === 3) {
          user.toggleChangeCellMode();
          return;
        }

        if (changeCellMode) {
          if (x === 6 && y === 1) {
            forLink.setNode(nodeIndex, { val: 0 });
            return;
          }
          if (x === 7 && y === 1) {
            forLink.setNode(nodeIndex, { val: "" });
            return;
          }
          if (x === 8 && y === 1) {
            forLink.setNode(nodeIndex, { val: false });
            return;
          }
          if (x === 6 && y === 2) {
            forLink.setNode(nodeIndex, { op: "." });
            return;
          }
          if (x === 7 && y === 2) {
            forLink.setNode(nodeIndex, {
              ref: self[ContextRepo.Key].linkList[0]
            });
            return;
          }
          if (x === 8 && y === 2) {
            forLink.setNode(nodeIndex, {
              input: self[ContextRepo.Key].inputList[0]
            });
            return;
          }
          if (x === 9 && y === 2) {
            forLink.setNode(nodeIndex, {
              dep: self[ContextRepo.Key].depList[0]
            });
            return;
          }
        }

        if (typeof nodeIndex === "number") {
          if (x === 9 && y === 2) {
            const deleted = selectedCell.forLink.deleteNode(nodeIndex);

            if (nodeIndex > selectedCell.forLink.nodes.length - 1) {
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
        document.addEventListener("keydown", handleKeyPress);
      },
      beforeDestroy() {
        document.removeEventListener("keydown", handleKeyPress);
      }
    };
  });

export default Editor;
