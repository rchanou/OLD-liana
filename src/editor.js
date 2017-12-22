import { types } from "mobx-state-tree";

import { Node, ContextRepo } from "./core";
// import { Tree } from "./tree";
import { LinkCell, ContextUser, CellList, LinkForm } from "./cell";

export const TREE = "TREE";
export const LIST = "LIST";

export const Editor = types
  .model("Editor", {
    ...ContextRepo.Mixin,
    ...ContextUser.Mixin,
    // tree: Tree,
    root: types.maybe(LinkCell),
    cellList: types.optional(CellList, {}),
    form: types.optional(LinkForm, { x: 2, y: 15 }), // TODO: remove hard-code
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
    get boxes() {
      // return [...self.cellList.boxes(0,0), ...self.form.boxes];
      return [...self.cellList.boxes(0, 0)];

      if (self.root) {
        return self.root.rootBoxes;
      }
      // TODO: switch on type here
      return self.projection.boxes;
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
      const { boxes } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = boxes.find(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x &&
          cell.y === selectedCell.y - 1
      );

      if (gotoCell) {
        // self[ContextUser.Key].selectedCell = gotoCell;
        self[ContextUser.Key].selectedCellKey = gotoCell.key;
      }
    },
    moveDown() {
      const { boxes } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = boxes.find(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x &&
          cell.y === selectedCell.y + 1
      );

      if (gotoCell) {
        // self[ContextUser.Key].selectedCell = gotoCell;
        self[ContextUser.Key].selectedCellKey = gotoCell.key;
      }
    },
    moveLeft() {
      const { boxes } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = boxes.find(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x - 2 &&
          cell.y === selectedCell.y
      );

      if (gotoCell) {
        // self[ContextUser.Key].selectedCell = gotoCell;
        self[ContextUser.Key].selectedCellKey = gotoCell.key;
      }
    },
    moveRight() {
      const { boxes } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = boxes.find(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x + 2 &&
          cell.y === selectedCell.y
      );

      if (gotoCell) {
        // self[ContextUser.Key].selectedCell = gotoCell;
        self[ContextUser.Key].selectedCellKey = gotoCell.key;
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
      78: [7, 2],
      69: [8, 2]
    };

    const handleKeyUp = e => {
      const { keyCode } = e;
      const actionName = self.keyMap.get(keyCode);
      const { projection } = self;

      // TODO: pull this block of logic into own function?
      const keyCoords = keyLayout[keyCode];
      const { selectedCell } = self[ContextUser.Key];
      if (selectedCell.inputMode) {
        return;
      }

      e.preventDefault();
      console.log(keyCode);

      const didCellKeyAction = selectedCell.onKey(keyCoords);
      if (didCellKeyAction) {
        return;
      }

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
