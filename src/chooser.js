import { types } from "mobx-state-tree";

import { Link, Input, Dependency } from "./core";
import { uiModel, cursorify, formatOut, CLOSE } from "./user-interface";

export const Chooser = uiModel("Chooser", {
  forLink: types.reference(Link),
  nodeIndex: types.maybe(types.number),
  filter: types.optional(types.string, ""),
  inputMode: types.optional(types.boolean, false)
})
  .views(self => ({
    get currentNode() {
      return self.forLink.nodes[self.nodeIndex];
    },
    get input() {
      return self.inputMode ? self.filter : null;
    },
    get baseCells() {
      const { filter, repo, currentNode, forLink } = self;

      const makeSearchCells = (records, x = 0, y = 0) => {
        const cells = [];

        records.forEach(record => {
          if (!record.label) {
            return;
          }

          // HACK: key-finding logic seems hella dirty but simplest way for now
          let key, text;
          if (record.linkId !== undefined) {
            key = `SCL-${record.linkId}`;
            text = `${record.label} = ${formatOut(record.out)}`;
          } else if (record.inputId !== undefined) {
            key = `SCI-${record.inputId}`;
            text = record.label;
          } else if (record.depId !== undefined) {
            key = `SCD-${record.depId}`;
            text = record.label;
          }

          const selectable =
            !record.equivalent(currentNode) && !record.equivalent(forLink);

          if (record.label.includes(filter)) {
            cells.push({
              record,
              key,
              x,
              y: y++,
              width: 5,
              selectable,
              fill: selectable ? record.color : "#999",
              text
            });
          }
        });

        return cells;
      };

      const { links, inputs, dependencies } = repo;

      return makeSearchCells(links)
        .concat(makeSearchCells(inputs, 5))
        .concat(makeSearchCells(dependencies, 10));
    },
    get keyMap() {
      return {
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
              const chosenRec = self.selectedCell.record;

              const newNode = {};
              if (chosenRec.linkId) {
                newNode.ref = chosenRec.linkId;
              } else if (chosenRec.inputId) {
                newNode.input = chosenRec.inputId;
              } else if (chosenRec.depId) {
                newNode.dep = chosenRec.depId;
              }

              const { forLink, nodeIndex } = self;
              forLink.setNode(nodeIndex, newNode);
              self.events.emit(CLOSE);
            }
          }
        },
        3: {
          6: {
            label: "Cancel",
            action() {
              self.events.emit(CLOSE);
            }
          }
        }
      };
    }
  }))
  .actions(self => ({
    handleInput(e) {
      self.filter = e.target.value;
    }
  }));
// TODO: check if this and any subscriptions cause memory leaks and try to handle those
