import { types } from "mobx-state-tree";
import EventEmitter from "eventemitter3";

import { Link, Input, Dependency } from "./core";
import { uiModel, cursorify } from "./user-interface";

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

export const CLOSE = "CLOSE";

export const Chooser = uiModel("Chooser", {
  forLink: types.reference(Link),
  nodeIndex: types.maybe(types.number),
  filter: types.optional(types.string, ""),
  inputMode: types.optional(types.boolean, false)
})
  .views(self => ({
    get baseCells() {
      const { repo, filter } = self;
      const { links, inputs, dependencies } = repo;

      return makeSearchCells(links, filter)
        .concat(makeSearchCells(inputs, filter, 5))
        .concat(makeSearchCells(dependencies, filter, 10));
    },
    get cursorCell() {
      return cursorify(self.selectedCell, "CHOOSER", self.inputMode ? self.filter : undefined);
    }
  }))
  .actions(self => ({
    handleInput(e) {
      self.filter = e.target.value;
    }
  }))
  .views(self => {
    // TODO: check if this and any subscriptions cause memory leaks and try to handle those
    const events = new EventEmitter();

    return {
      get keyMap() {
        return {
          events,
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
                events.emit(CLOSE);
              }
            }
          }
        };
      }
    };
  });
