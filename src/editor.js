import { types, getEnv, destroy } from "mobx-state-tree";
import EventEmitter from "eventemitter3";

import { ContextRepo } from "./core";
import { ContextUser } from "./user";
import { RepoLister } from "./repo-lister";
import { Chooser } from "./chooser";
import { cursorify } from "./cells";
import { uiModel } from "./user-interface";

const keyLayout = {
  // TODO: make customizable
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

const HeldKeyCoords = types.model("HeldKeyCoords", {
  x: types.number,
  y: types.number
});

export const Editor = types
  .model("Editor", {
    ...ContextRepo.Mixin,
    // ...ContextUser.Mixin,
    heldKeyCoords: types.maybe(HeldKeyCoords),
    chooser: types.maybe(Chooser),
    repoList: types.optional(RepoLister, {})
  })
  .actions(self => {
    const { dom } = getEnv(self);

    return {
      handleKeyDown(e) {
        const { keyCode } = e;
        const { keyMap } = self;

        if (keyMap.onInput) {
          keyMap.onInput(keyCode);
          return;
        }

        const coords = keyLayout[keyCode]; // TODO: make key layout editable
        if (!coords) {
          return;
        }

        e.preventDefault();

        const [x, y] = coords;

        self.heldKeyCoords = { x, y };

        const YKeyMap = keyMap[y];
        if (YKeyMap) {
          const thisKey = YKeyMap[x];
          if (thisKey && thisKey.action) {
            thisKey.action();
          }
        }
      },
      handleKeyUp() {
        if (self.heldKeyCoords) {
          destroy(self.heldKeyCoords);
        }
      },
      afterCreate() {
        document.addEventListener("keydown", self.handleKeyDown);
        document.addEventListener("keyup", self.handleKeyUp);
      },
      beforeDestroy() {
        document.removeEventListener("keydown", self.handleKeyDown);
        document.removeEventListener("keyup", self.handleKeyUp);
      }
    };
  })
  .actions(self => ({
    toggleChooser(forLink, nodeIndex) {
      if (self.chooser) {
        destroy(self.chooser);
      } else {
        const { forLink, nodeIndex } = self.repoList.selectedCell;
        self.chooser = { forLink, nodeIndex };
      }
    }
  }))
  .views(self => ({
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

      return self.repoList.makeKeyMap(self.toggleChooser);
      // return self.current.keyMap;
    },
    get handleInput() {
      return self.current.handleInput;
    }
  }));

export default Editor;
