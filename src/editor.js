import { types } from "mobx-state-tree";

import { ContextRepo } from "./core";
import { ContextUser } from "./user";
import { RepoLister } from "./repo-lister";
import { Chooser } from "./chooser";
import { cursorify } from "./cells";
import { keyboardableModel } from "./keyboardable";

export const TREE = "TREE";
export const LIST = "LIST";

export const Editor = keyboardableModel("Editor", {
  ...ContextRepo.Mixin,
  // ...ContextUser.Mixin,
  chooser: types.maybe(Chooser),
  repoList: types.optional(RepoLister, {})
})
  .actions(self => ({
    toggleChooser(forLink, nodeIndex) {
      if (self.chooser) {
        self.chooser = null;
      } else {
        self.chooser = { forLink, nodeIndex };
      }
    }
  }))
  .views(self => {
    // TODO: try event emitter shiz
    return {
      get current() {
        return self.chooser || self.repoList;
      },
      get cells() {
        return self.current.cells;
      },
      get keyMap() {
        if (self.chooser) {
          return self.chooser.makeKeyMap(self.toggleChooser);
        }
        return self.repoList.keyMap;
      }
    };
  })
  .actions(self => ({
    handleInput(e) {
      return self.current.handleInput;
    }
  }));

export default Editor;
