// NOTE: "Keyboardable" is an awful name.

import { types } from "mobx-state-tree";

import { setupContext } from "./context";

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

const Keyboard = types
  .model("Keyboard", {
    heldKeyCoords: types.maybe(HeldKeyCoords)
  })
  .actions(self => {
    // let editorStates = [];
    let editor;

    return {
      pushEditor(newEditor) {
        editor = newEditor;
        console.log("eee", editor);
        // editorStates.push(editor);
        // console.log("es", editorStates);
      },
      popEditor() {
        console.log("eee", editor);
        // editorStates.pop();
        // console.log("es", editorStates);
      },
      handleKeyDown(e) {
        const { keyCode } = e;
        const { keyMap } = editor;
        console.log("shamon");
        // const { keyMap } = editorStates[editorStates.length - 1];

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
        self.heldKeyCoords = null;
      },
      afterCreate() {
        console.log("da boot");
        document.addEventListener("keydown", self.handleKeyDown);
        document.addEventListener("keyup", self.handleKeyUp);
      },
      beforeDestroy() {
        console.log("naw man");
        document.removeEventListener("keydown", self.handleKeyDown);
        document.removeEventListener("keyup", self.handleKeyUp);
      }
    };
  });

export const ContextKeyboard = setupContext(Keyboard);

const Keyboarder = types
  .model("Keyboarder", {
    ...ContextKeyboard.Mixin
  })
  .views(self => ({
    get keyboard() {
      return self[ContextKeyboard.RefKey];
    },
    get heldKeyCoords() {
      return self.keyboard.heldKeyCoords;
    }
  }))
  .actions(self => ({
    afterCreate() {
      self.keyboard.pushEditor(self);
    },
    beforeDestroy() {
      self.keyboard.popEditor();
    }
  }));

export const keyboardableModel = (...args) => {
  const firstModel = types.compose(types.model(...args), Keyboarder);

  return firstModel;
};
