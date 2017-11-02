import { types } from "mobx-state-tree";

import { Node } from "./core";
import Tree from "./view-tree";
import List from "./view-list";

export const TREE = "TREE";
export const LIST = "LIST";

export const Editor = types
  .model("Editor", {
    tree: Tree,
    list: List,
    form: types.maybe(Node),
    currentView: types.optional(types.enumeration([TREE, LIST]), TREE)
  })
  .actions(self => ({
    setView(view) {
      self.currentView = view;
    }
  }));

export default Editor;
