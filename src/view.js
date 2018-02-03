import { types } from "mobx-state-tree";
import { Pkg, ContextEngine } from "./core";
import { ContextUser } from "./user";
import { optionalModel } from "./model-utils";

export const calcWidth = text =>
  typeof text !== "string" ? 1 : Math.ceil((text.length + 3) / 6);

// export const formatOut = out => {
//   if (out instanceof Error) {
//     return out.message;
//   } else if (out === Pkg) {
//     return "...";
//   } else if (typeof out === "function") {
//     // TODO: more elegant display of functions and higher-order functions
//     return "func";
//   } else if (out === undefined || Number.isNaN(out)) {
//     return String(out);
//   } else {
//     return JSON.stringify(out);
//   }
// };

let cursorIdCounter = 0; // TODO: better way to determine IDs?

export const UI = optionalModel("UI", {
  selectedCellIndex: 0,
  engine: ContextEngine,
  user: ContextUser
})
  .views(self => {
    const cursorId = `CURSOR-${cursorIdCounter++}`;
    return {
      get selectedCell() {
        return self.baseCells[self.selectedCellIndex];
      },
      get cursorCell() {
        const { input, selectedCell } = self;
        const { x, y, width } = selectedCell;
        return {
          x,
          y,
          width,
          input,
          cursor: true,
          key: cursorId
        };
      },
      get cells() {
        return self.baseCells.concat(self.cursorCell || []);
      },
      get activeCells() {
        return self.cells;
      },
      get baseKeyMap() {
        return {
          1: {
            2: { label: "▲", action: self.moveUp }
          },
          2: {
            1: { label: "◀", action: self.moveLeft },
            2: { label: "▼", action: self.moveDown },
            3: { label: "▶", action: self.moveRight }
          }
        };
      },
      get cellMap() {
        const base = {
          y: {},
          x: {}
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
          const { x, y, width = 0, height = 0 } = cell;
          for (let cy = y; cy <= y + height; cy++) {
            for (let cx = x; cx <= x + width; cx++) {
              if (!yx[cy]) {
                yx[cy] = { min: 0, max: 0 };
              }
              if (!xy[cx]) {
                xy[cx] = { min: 0, max: 0 };
              }
              yx[cy][cx] = i;
              xy[cx][cy] = i;
              if (cx > yx[cy].max) {
                yx[cy].max = cx;
              }
              if (cx < yx[cy].min) {
                yx[cy].min = cx;
              }
              if (cy > xy[cx].max) {
                xy[cx].max = cy;
              }
              if (cy < xy[cx].min) {
                xy[cx].min = cy;
              }
            }
          }
        }
        // TODO: logic to fill out "edge" cells for less jumpiness
        return base;
      }
    };
  })
  .actions(self => ({
    selectCellIndex(index) {
      self.selectedCellIndex = index;
    },
    moveBy(step = +1, axis = "x") {
      const crossAxis = axis === "x" ? "y" : "x";
      const currentCell = { ...self.selectedCell };
      const crossSizeProp = crossAxis === "x" ? "width" : "height";
      // TODO: center-finding can be improved (maybe try banker's rounding to prevent cursor "drift?")
      const crossCenter = Math.ceil(
        currentCell[crossAxis] + (currentCell[crossSizeProp] - 1 || 0) / 2
      );
      currentCell[crossAxis] = crossCenter;
      const crossAxisMap = self.cellMap[crossAxis];
      if (!currentCell) {
        return;
      }
      const crossAxisPos = currentCell[crossAxis];
      const crossAxisSet = crossAxisMap[crossAxisPos];
      if (!crossAxisSet) {
        return;
      }
      let axisPos = currentCell[axis];
      const { min } = crossAxisSet;
      const { max } = crossAxisSet;
      while (min <= axisPos && axisPos <= max) {
        axisPos += step;
        const foundIndex = crossAxisSet[axisPos];
        if (foundIndex !== self.selectedCellIndex && foundIndex !== undefined) {
          self.selectCellIndex(foundIndex);
          return;
        }
      }
      // NOTE: Short-circuiting wraparound logic below at the moment (allow param to set?)
      return;
      if (axis === "y") {
        return;
      }
      let foundIndex;
      if (axisPos > max) {
        foundIndex = crossAxisSet[min];
      } else if (axisPos < min) {
        foundIndex = crossAxisSet[max];
      }
      if (foundIndex !== undefined) {
        self.selectCellIndex(foundIndex);
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
    }
  }));

export const uiModel = (name, ...args) => {
  if (args.length) {
    return types.compose(types.model(name, ...args), UI);
  }
  if (name) {
    return types.compose(name, UI);
  }
  return UI;
};

export const cursorify = (baseCell, key, input) => {
  const { x, y, width, forLink, nodeIndex, gotoCellKey } = baseCell;
  return {
    x,
    y,
    width,
    forLink,
    nodeIndex,
    gotoCellKey,
    input,
    cursor: true,
    key: `CURSOR-${key}`
  };
};
