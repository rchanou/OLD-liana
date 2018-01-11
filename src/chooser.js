import { types } from "mobx-state-tree";

import { Link, Input, Dependency, ContextRepo } from "./core";
import { cursorify } from "./cells";
import { uiModel } from "./user-interface";

const makeSearchCells = (records, filter = "", x = 0, y = 0) => {
  const cells = [];

  records.forEach(rec => {
    if (!rec.label) {
      return;
    }

    // HACK: key-finding logic seems hella dirty but simplest way for now
    let key;
    if (rec.linkId !== undefined) {
      key = `SCL-${rec.linkId}`;
    } else if (rec.inputId !== undefined) {
      key = `SCI-${rec.inputId}`;
    } else if (rec.depId !== undefined) {
      key = `SCD-${rec.depId}`;
    }

    if (rec.label.includes(filter)) {
      cells.push({
        key,
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

export const EXIT = "EXIT";

export const Chooser = uiModel(`Chooser`, {
  ...ContextRepo.Mixin,
  forLink: types.reference(Link),
  nodeIndex: types.maybe(types.number),
  // selectedCellIndex: types.optional(types.number, 0),
  filter: types.optional(types.string, ""),
  inputMode: types.optional(types.boolean, false)
})
  .views(self => ({
    get repo() {
      return self[ContextRepo.RefKey];
    },
    get baseCells() {
      const { repo, input } = self;
      const { links, inputs, dependencies } = repo;

      return makeSearchCells(links, input)
        .concat(makeSearchCells(inputs, input, 5))
        .concat(makeSearchCells(dependencies, input, 10));
    },
    get selectedCell() {
      return self.baseCells[self.selectedCellIndex];
    },
    get cursorCell() {
      return cursorify(
        self.selectedCell,
        self.inputMode ? self.filter : undefined
      );
    },
    get cells() {
      return self.baseCells.concat(self.cursorCell);
    }
  }))
  .actions(self => ({
    handleInput(e) {
      self.filter = e.target.value;
    },
    selectCellIndex(index) {
      self.selectedCellIndex = index;
    }
  }))
  .views(self => ({
    makeKeyMap(events) {
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
              events.emit(EXIT);
            }
          }
        }
      };
    },
    get keyMap() {
      return self.makeKeyMap();
    }
  }));
