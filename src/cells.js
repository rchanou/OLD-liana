import { createTransformer } from "mobx";

export const cursorify = (baseCell, input) => {
  const { x, y, width, forLink, nodeIndex, gotoCellKey } = baseCell;

  const finalCell = {
    x,
    y,
    width,
    forLink,
    nodeIndex,
    gotoCellKey,
    input,
    key: "CURSOR"
  };

  return finalCell;
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
