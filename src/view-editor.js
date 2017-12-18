import { types } from "mobx-state-tree";

import { Node, ContextRepo } from "./core";
// import { Tree } from "./view-tree";
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
    form: types.optional(LinkForm, { x: 2, y: 15 }),
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
      return [...self.cellList.cells, ...self.form.cells];

      if (self.root) {
        return self.root.rootBoxes;
      }
      // TODO: switch on type here
      return self.projection.cells;
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
        cell => cell.selectable && cell.x === selectedCell.x && cell.y === selectedCell.y - 1
      );

      if (gotoCell) {
        self[ContextUser.Key].selectedCell = gotoCell;
      }
    },
    moveDown() {
      const { cells } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = cells.find(
        cell => cell.selectable && cell.x === selectedCell.x && cell.y === selectedCell.y + 1
      );

      if (gotoCell) {
        self[ContextUser.Key].selectedCell = gotoCell;
      }
    },
    moveLeft() {
      const { cells } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = cells.find(
        cell => cell.selectable && cell.x === selectedCell.x - 2 && cell.y === selectedCell.y
      );

      if (gotoCell) {
        self[ContextUser.Key].selectedCell = gotoCell;
      }
    },
    moveRight() {
      const { cells } = self;
      const { selectedCell } = self[ContextUser.Key];

      const gotoCell = cells.find(
        cell => cell.selectable && cell.x === selectedCell.x + 2 && cell.y === selectedCell.y
      );

      if (gotoCell) {
        self[ContextUser.Key].selectedCell = gotoCell;
      }
    }
  }))
  .actions(self => {
    const handleKeyUp = e => {
      e.preventDefault();

      const { keyCode } = e;
      const actionName = self.keyMap.get(keyCode);
      const { projection } = self;

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
          console.log(keyCode);
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
