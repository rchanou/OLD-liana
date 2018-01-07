import { types } from "mobx-state-tree";

import { setupContext } from "./context";
import { Node, ContextRepo } from "./core";
import { LinkCell, CellList } from "./cell";
import { ContextUser } from "./user";

export const TREE = "TREE";
export const LIST = "LIST";

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

const opYXGrid = {
  0: {
    0: "@",
    1: "[",
    2: "{",
    3: ".",
    4: "g",
    5: "+",
    6: "-",
    7: "*",
    8: "/",
    9: "%"
  },
  1: { 1: "f", 2: "s", 3: "?", 6: "<", 7: ">", 8: "<=", 9: ">=" },
  2: { 6: "==", 7: "===", 8: "!=", 9: "!==" }
};

export const Editor = types
  .model("Editor", {
    ...ContextRepo.Mixin,
    ...ContextUser.Mixin,
    // tree: Tree,
    // root: types.maybe(LinkCell),
    cellList: types.optional(CellList, {})
    // currentView: types.optional(types.enumeration([TREE, LIST]), LIST)
  })
  .views(self => ({
    get user() {
      return self[ContextUser.Key];
    },
    get selectedCell() {
      return self.user.selectedCell;
    },
    get cursorCell() {
      const { inputMode } = self.user;
      const { selectedCell } = self;

      const finalCell = {
        ...selectedCell,
        input: inputMode,
        key: "CURSOR"
      };

      if (inputMode) {
        finalCell.value = selectedCell.value;
      }

      return finalCell;
    },
    get cells() {
      return self.cellList.cells(0, 0).concat(self.cursorCell);

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
    moveUp() {
      const { cells, user, selectedCell } = self;

      const gotoCell = cells.find(
        cell => cell.selectable && cell.x === selectedCell.x && cell.y === selectedCell.y - 1
      );

      if (gotoCell) {
        user.selectedCell = gotoCell;
      }
    },
    moveDown() {
      const { cells, user, selectedCell } = self;

      const gotoCell = cells.find(
        cell => cell.selectable && cell.x === selectedCell.x && cell.y === selectedCell.y + 1
      );

      if (gotoCell) {
        user.selectedCell = gotoCell;
      }
    },
    moveLeft() {
      const { cells, user, selectedCell } = self;

      const gotoCell = cells.find(
        cell => cell.selectable && cell.x === selectedCell.x - 2 && cell.y === selectedCell.y
      );

      if (gotoCell) {
        user.selectedCell = gotoCell;
      }
    },
    moveRight() {
      const { cells, user, selectedCell } = self;

      const gotoCell = cells.find(
        cell => cell.selectable && cell.x === selectedCell.x + 2 && cell.y === selectedCell.y
      );

      if (gotoCell) {
        user.selectedCell = gotoCell;
      }
    }
  }))
  .actions(self => ({
    handleInput(e) {
      self.selectedCell.value = e.target.value;
    }
  }))
  .actions(self => {
    const handleKeyPress = e => {
      const { keyCode } = e;

      console.log(keyCode);

      const { user, selectedCell } = self;

      if (user.inputMode) {
        if (e.keyCode == 13) {
          selectedCell.forLink.setVal(selectedCell.nodeIndex, selectedCell.value);
          user.toggleInputMode();
        }
        return;
      }

      if (user.changeOpMode) {
        user.toggleChangeOpMode();
      }

      const coords = keyLayout[keyCode];
      if (!coords) {
        return;
      }

      e.preventDefault();

      const [x, y] = coords;

      const { forLink, nodeIndex } = selectedCell;

      if (x === 6 && y === 3) {
        user.toggleChangeCellMode();
        return;
      }

      if (user.changeCellMode) {
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

      if (x === 9 && y === 2) {
        if (typeof nodeIndex === "number") {
          const deleted = selectedCell.forLink.deleteNode(nodeIndex);

          if (nodeIndex > selectedCell.forLink.nodes.length - 1) {
            self.moveLeft();
          }
          return;
        }
      }

      if (x === 6 && y === 1) {
        if (selectedCell.forLink) {
          selectedCell.forLink.addNode();
          return;
        }
      }

      if (x === 7 && y === 1) {
        if (selectedCell.gotoCellKey) {
          const gotoCell = self.cells.find(cell => cell.key === selectedCell.gotoCellKey);

          if (gotoCell) {
            user.setSelectedCell(gotoCell);
            return;
          }
        }
      }

      if (x === 8 && y === 2) {
        user.toggleInputMode();
        return;
      }

      if (x === 5 && y === 1) {
        self[ContextRepo.Key].addLink();
      }

      if (x === 2 && y === 1) {
        self.moveUp();
      }
      if (x === 2 && y === 2) {
        self.moveDown();
      }
      if (x === 1 && y === 2) {
        self.moveLeft();
      }
      if (x === 3 && y === 2) {
        self.moveRight();
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
