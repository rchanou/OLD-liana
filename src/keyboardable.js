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
    // HACK: this whole system seems hella dirty and prone to mem leaks
    // TODO: try to improve it

    let editor;

    return {
      pushEditor(newEditor) {
        editor = newEditor;
        // console.log("eee", editor);
      },
      // popEditor() {
      //   console.log("fff", editor);
      // },
      handleKeyDown(e) {
        const { keyCode } = e;
        const { keyMap } = editor;

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
        document.addEventListener("keydown", self.handleKeyDown);
        document.addEventListener("keyup", self.handleKeyUp);
      },
      beforeDestroy() {
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
    },
    get cellMap() {
      const base = {
        y: { crossMin: 0, crossMax: 0 },
        x: { crossMin: 0, crossMax: 0 }
      };
      const yx = base.y;
      const xy = base.x;

      const { baseCells } = self;
      const { length } = baseCells;

      for (let i = 0; i < length; i++) {
        const cell = baseCells[i];
        if (!cell.selectable) {
          continue;
        }

        const { x, y } = cell;

        if (!yx[y]) {
          yx[y] = {};
        }

        yx[y][x] = i;

        if (x > yx.crossMax) {
          yx.crossMax = x;
        }
        if (x < yx.crossMin) {
          yx.crossMin = x;
        }

        if (!xy[x]) {
          xy[x] = {};
        }

        xy[x][y] = i;

        if (y > xy.crossMax) {
          xy.crossMax = y;
        }
        if (y < xy.crossMin) {
          xy.crossMin = y;
        }
      }

      return base;
    }
  }))
  .actions(self => ({
    moveBy(step = +1, axis = "x") {
      const crossAxis = axis === "x" ? "y" : "x";

      const currentCell = self.selectedCell;
      // currentCell = currentCell || self.selectedCell;
      if (!currentCell) {
        return;
      }

      // let { x, y } = currentCell;
      let axisPos = currentCell[axis];
      const crossAxisPos = currentCell[crossAxis];

      const crossAxisMap = self.cellMap[crossAxis];

      const crossAxisSet = crossAxisMap[crossAxisPos];
      if (!crossAxisSet) {
        return;
      }

      const min = crossAxisMap.crossMin;
      const max = crossAxisMap.crossMax;

      while (min <= axisPos && axisPos <= max) {
        axisPos += step;
        const foundIndex = crossAxisSet[axisPos];
        if (foundIndex !== undefined) {
          self.selectCellIndex(foundIndex);
          return;
        }
      }
    },
    moveRight() {
      self.moveBy();
    },
    moveLeft() {
      self.moveBy(-1);
    },
    moveDown() {
      self.moveBy(+1, "y");
    },
    moveUp() {
      self.moveBy(-1, "y");
    },
    afterCreate() {
      // TODO: only push if isRoot?
      self.keyboard.pushEditor(self);
    }
    // TODO: destroy to prevent mem leaks if necessary
    // beforeDestroy() {
    //   self.keyboard.popEditor();
    // }
  }));

export const keyboardableModel = (...args) =>
  types.compose(types.model(...args), Keyboarder);
