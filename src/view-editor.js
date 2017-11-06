import { getEnv, types } from "mobx-state-tree";

import { Node } from "./core";
import Tree from "./view-tree";
import List from "./view-list";

export const TREE = "TREE";
export const LIST = "LIST";

export const Editor = types
  .model("Editor", {
    tree: Tree,
    list: types.optional(List, {}),
    form: types.maybe(Node),
    currentView: types.optional(types.enumeration([TREE, LIST]), TREE)
  })
  .actions(self => ({
    setView(view) {
      self.currentView = view;
    }
  }))
  .actions(self => {
    const { keyMap } = getEnv(self);

    const projectionMap = {
      [TREE]: self.tree,
      [LIST]: self.list
    };

    const handleKeyUp = e => {
      e.preventDefault();
      const { keyCode } = e;
      const actionName = keyMap[keyCode];

      const projection = projectionMap[self.currentView];

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
