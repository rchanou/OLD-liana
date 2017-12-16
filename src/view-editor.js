import { types } from "mobx-state-tree";

import { Node, ContextRepo } from "./core";
import { Tree } from "./view-tree";
import { List } from "./view-list";
import { LinkForm } from "./view-form";
import { Field } from "./field";
import { LinkCell, ContextUser } from "./cell";

export const TREE = "TREE";
export const LIST = "LIST";

export const Editor = types
  .model("Editor", {
    ...ContextRepo.Mixin,
    ...ContextUser.Mixin,
    // tree: Tree,
    root: types.maybe(LinkCell),
    list: types.optional(List, {}),
    form: types.maybe(LinkForm),
    // selectedField: types.maybe(types.reference(Field)),
    currentView: types.optional(types.enumeration([TREE, LIST]), TREE),
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
      if (self.root) {
        return self.root.rootCells;
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
      self.form = self.form ? null : { subForms: [] };
    },
    moveUp() {
      switch (self.currentView) {
        case TREE:
          const { cells } = self.tree;
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
          projection.move(-1);
          break;

        case "right":
          projection.move(+1);
          break;

        case "up":
          projection.up();
          break;

        case "down":
          projection.down();
          break;

        case "open":
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
          console.log(keyCode);
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
