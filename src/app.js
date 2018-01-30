import { types, getEnv, destroy } from "mobx-state-tree";

// import { ContextRepo } from "./core";
// import { ContextUser } from "./user";
// import { RepoEditor } from "./repo-editor";
import { viewModel } from "./view";
import { MainEditor } from "./editor";

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

export const App = viewModel("App", {
  heldKeyCoords: types.maybe(HeldKeyCoords),
  mainEditor: types.optional(MainEditor, {})
})
  .actions(self => {
    const { dom } = getEnv(self);

    return {
      handleKeyDown(e) {
        const { keyCode } = e;
        const { keyMap } = self;

        if (typeof keyMap === "function") {
          keyMap(keyCode);
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
  .views(self => ({
    get cells() {
      return self.mainEditor.cells;
      // return self.mainEditor.cells.concat(self.chooser ? self.chooser.cells : []);
    },
    get keyMap() {
      return self.mainEditor.keyMap;
    },
    get handleInput() {
      return self.mainEditor.handleInput;
    }
  }));

export default App;
