import { types } from "mobx-state-tree";

import { Node, ContextRepo } from "./core";
import Tree from "./view-tree";
import List from "./view-list";

export const TREE = "TREE";
export const LIST = "LIST";

export const Editor = types
  .model("Editor", {
    ...ContextRepo.Mixin,
    tree: Tree,
    list: types.optional(List, {}),
    form: types.maybe(Node),
    currentView: types.optional(types.enumeration([TREE, LIST]), TREE),
    keyMap: types.map(types.string)
  })
  .actions(self => ({
    setView(view) {
      self.currentView = view;
    }
  }))
  .actions(self => {
    const { keyMap } = self;

    const projectionMap = {
      [TREE]: self.tree,
      [LIST]: self.list
    };

    const handleKeyUp = e => {
      e.preventDefault();
      const { keyCode } = e;
      const actionName = keyMap.get(keyCode);

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
        case "changeView":
          const { currentView } = self;
          if (currentView === TREE) {
            self.setView(LIST);
          } else {
            self.setView(TREE);
          }
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
