import { types } from "mobx-state-tree";

import Tree from "../src/view-tree";
import List from "../src/view-list";

export const TREE = "TREE";
export const LIST = "LIST";

export const Editor = types
  .model("Editor", {
    tree: Tree,
    list: List,
    currentView: types.enumeration([TREE, LIST])
  })
  .actions(self => ({
    setView(view) {
      self.currentView = view;
    }
  }));

export default Editor;
