import { createTransformer } from "mobx";

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

export const createCellMap = createTransformer(cells => {
  const yxMap = {};

  for (const cell of cells) {
    const { x, y } = cell;

    if (!yxMap[y]) {
      yxMap[y] = {};
    }

    yxMap[y][x] = cell;
  }

  return yxMap;
});
