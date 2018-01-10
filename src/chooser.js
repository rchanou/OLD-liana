import { types } from "mobx-state-tree";

import { Link, Input, Dependency, ContextRepo } from "./core";
import { cursorify } from "./cells";

const makeSearchCells = (records, filter = "", x = 0, y = 0) => {
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

export const Chooser = types
  .model(`Chooser`, {
    repo: ContextRepo.Key,
    forLink: types.reference(Link),
    nodeIndex: types.maybe(types.number),
    selectedCellIndex: types.optional(types.number, 0),
    filter: types.optional(types.string, ""),
    inputMode: types.optional(types.boolean, false)
  })
  .views(self => ({
    get searchCells() {
      const { repo, input } = self;
      const { links, inputs, dependencies } = repo;

      return makeSearchCells(links, input)
        .concat(makeSearchCells(inputs, input, 5))
        .concat(makeSearchCells(dependencies, input, 10));
    },
    get selectedCell() {
      return self.searchCells[self.selectedCellIndex];
    },
    get cursorCell() {
      return cursorify(self.selectedCell, self.inputMode ? self.filter : undefined);
    },
    get cells() {
      return self.searchCells.concat(self.cursorCell);
    },
    get keyMap() {
      return {
        1: {
          2: { label: "▲", action: self.moveUp }
        },
        2: {
          1: { label: "◀", action: self.moveLeft },
          2: { label: "▼", action: self.moveDown },
          3: { label: "▶", action: self.moveRight }
        },
        3: {
          6: {
            label: "Cancel",
            action() {
              user.setChoosingLink(null);
            }
          }
        }
      };
    }
  }))
  .views(self => ({
    get keyMap() {
      return {
        1: {
          2: { label: "▲", action: self.moveUp }
        },
        2: {
          1: { label: "◀", action: self.moveLeft },
          2: { label: "▼", action: self.moveDown },
          3: { label: "▶", action: self.moveRight }
        },
        3: {
          6: {
            label: "Cancel",
            action() {
              self.setChoosingLink(null);
            }
          }
        }
      };
    }
  }));
