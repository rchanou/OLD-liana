import { types } from "mobx-state-tree";
import EventEmitter from "eventemitter3";
import { Dependency, Input, Hole, ContextRepo } from "./core";

export const formatOut = out => {
  if (out instanceof Error) {
    return out.message;
  } else if (out === Dependency) {
    return "...";
  } else if (typeof out === "function") {
    return "func";
  } else if (out instanceof Hole) {
    return "?";
  } else if (out == null) {
    return "";
  } else {
    return JSON.stringify(out);
  }
};

const UI = types
  .model("UI", {
    ...ContextRepo.Mixin,
    selectedCellIndex: types.optional(types.number, 0)
  })
  .views(self => ({
    get repo() {
      return self[ContextRepo.RefKey];
    },
    get selectedCell() {
      return self.baseCells[self.selectedCellIndex];
    },
    get cells() {
      return self.baseCells.concat(self.cursorCell || []);
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
          yx[y] = { min: 0, max: 0 };
        }

        yx[y][x] = i;

        if (x > yx[y].max) {
          yx.crossMax = x;
          yx[y].max = x;
        }
        if (x < yx[y].min) {
          yx.crossMin = x;
          yx[y].min = x;
        }

        if (!xy[x]) {
          xy[x] = { min: 0, max: 0 };
        }

        xy[x][y] = i;

        if (y > xy[x].max) {
          xy.crossMax = y;
          xy[x].max = y;
        }
        if (y < xy[x].min) {
          xy.crossMin = y;
          xy[x].min = y;
        }
      }

      return base;
    },
    get events() {
      return new EventEmitter();
    }
  }))
  .actions(self => ({
    selectCellIndex(index) {
      self.selectedCellIndex = index;
    },
    moveBy(step = +1, axis = "x") {
      const crossAxis = axis === "x" ? "y" : "x";
      // debugger;
      const currentCell = self.selectedCell;
      if (!currentCell) {
        return;
      }

      const crossAxisMap = self.cellMap[crossAxis];
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
        if (foundIndex !== undefined) {
          self.selectCellIndex(foundIndex);
          return;
        }
      }

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
    },
    beforeDestroy() {
      self.events.removeAllListeners();
    }
  }));

export const uiModel = (...args) => types.compose(types.model(...args), UI);

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
