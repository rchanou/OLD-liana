import { types } from "mobx-state-tree";
import EventEmitter from "eventemitter3";

import { ContextRepo } from "./core";
import { ContextUser } from "./user";
import { RepoLister } from "./repo-lister";
import { Chooser, EXIT } from "./chooser";
import { cursorify } from "./cells";
import { uiModel } from "./user-interface";

export const TREE = "TREE";
export const LIST = "LIST";

export const Editor = uiModel("Editor", {
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
    const events = new EventEmitter();

    events.on(EXIT, self.toggleChooser);

    return {
      get current() {
        return self.chooser || self.repoList;
      },
      get cells() {
        return self.current.cells;
      },
      get keyMap() {
        if (self.current.makeKeyMap) {
          return self.current.makeKeyMap(events);
        }
        return self.current.keyMap;
      },
      get handleInput() {
        return self.current.handleInput;
      }
    };
  });

export default Editor;
