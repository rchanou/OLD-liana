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
