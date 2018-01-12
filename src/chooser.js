import { types } from "mobx-state-tree";
import EventEmitter from "eventemitter3";

import { Link, Input, Dependency } from "./core";
import { uiModel, cursorify } from "./user-interface";

const makeSearchCells = (records, filter = "", x = 0, y = 0) => {
  const cells = [];

  records.forEach(record => {
    if (!record.label) {
      return;
    }

    // HACK: key-finding logic seems hella dirty but simplest way for now
    let key;
    if (record.linkId !== undefined) {
      key = `SCL-${record.linkId}`;
    } else if (record.inputId !== undefined) {
      key = `SCI-${record.inputId}`;
    } else if (record.depId !== undefined) {
      key = `SCD-${record.depId}`;
    }

    if (record.label.includes(filter)) {
      cells.push({
        record,
        key,
        x,
        y: y++,
        width: 5,
        selectable: true,
        fill: record.color,
        text: record.label
      });
    }
  });

  return cells;
};

export const CHOOSE = "CHOOSE";
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
    },
    get events() {
      return new EventEmitter();
    },
    get keyMap() {
      const { events } = self;

      return {
        events,
        1: {
          2: { label: "▲", action: self.moveUp }
        },
        2: {
          1: { label: "◀", action: self.moveLeft },
          2: { label: "▼", action: self.moveDown },
          3: { label: "▶", action: self.moveRight },
          6: {
            label: "Choose",
            action() {
              events.emit(CHOOSE, self.selectedCell.record);
            }
          }
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
  }))
  .actions(self => ({
    handleInput(e) {
      self.filter = e.target.value;
    },
    beforeDestroy() {
      self.events.removeAllListeners();
    }
  }));
// TODO: check if this and any subscriptions cause memory leaks and try to handle those
