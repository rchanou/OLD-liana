import { getType } from "mobx-state-tree";

export const makeSearchCells = (records, filter = "", x = 0, y = 0) => {
  const cells = [];

  records.forEach(rec => {
    if (!rec.label) {
      return;
    }

    if (rec.label.includes(filter)) {
      cells.push({
        // HACK: key-finding logic seems hella dirty but simplest way for now
        key: rec.linkId || rec.inputId || rec.depId,
        x,
        y: y++,
        width: 5,
        selectable: true,
        fill: rec.color,
        text: rec.label
      });
    }
  });

  return cells;
};
