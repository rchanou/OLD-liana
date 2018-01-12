import { types } from "mobx-state-tree";

import { ContextRepo } from "./core";

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
    selectCellIndex(index) {
      self.selectedCellIndex = index;
    },
    moveBy(step = +1, axis = "x") {
      const crossAxis = axis === "x" ? "y" : "x";

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
    }
  }));

export const uiModel = (...args) => types.compose(types.model(...args), UI);
