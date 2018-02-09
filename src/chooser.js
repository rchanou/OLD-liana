import { types } from "mobx-state-tree";
import { isObservableArray } from "mobx";
// import { UI, cursorify, formatOut } from "./view";
import { UI } from "./view";
import { optionalModel } from "./model-utils";
import { RefPath } from "./core";

export const Chooser = types
  .compose(
    "Chooser",
    UI,
    optionalModel({
      path: types.optional(RefPath, []),
      index: types.maybe(types.number),
      filter: "",
      inputMode: false
    })
  )
  .views(self => ({
    get currentNode() {
      return self.forLink.nodes[self.nodeIndex];
    },
    get input() {
      return self.inputMode ? self.filter : null;
    },
    get baseCells() {
      // const { filter, repo, currentNode, forLink } = self;
      const { filter, repo, user, path, index } = self;
      const { main } = repo;
      // const makeSelectCells = (x = 0, y = 0) => {
      let x = 0;
      let y = 0;
      const cells = [
        {
          key: "FILTER",
          x,
          y: y++,
          width: 5,
          text: self.filter,
          selectable: true
        }
      ];
      const pushDecRefCells = dec => {
        dec.forEach((subDec, subId) => {
          cells.push({
            key: `CHS-${subId}`,
            x,
            y: y++,
            width: 5,
            text: subId,
            selectable: true
          });
          // if (isObservableArray(subDec)) {
          //   return;
          // }
          // pushDecRefCells(subDec);
        });
      };
      let currentDec = repo.main;
      pushDecRefCells(currentDec);
      for (const id of path) {
        currentDec = currentDec.get(id);
        if (!isObservableArray(currentDec)) {
          pushDecRefCells(currentDec);
        }
      }
      // const pushDecCells = dec => {
      //   if (isObservableArray(dec)) {
      //     cells.push();
      //     return;
      //   }
      //   dec.forEach(subDec => {});
      // };
      // pushDecCells(main);
      return cells;
      // return (
      //   makeSelectCells(repo.main, 0, 1)
      // .concat(makeSearchCells(inputs, 5))
      // .concat(makeSearchCells(dependencies, 10))
      //     .concat({
      //       key: "FILTER",
      //       x: 0,
      //       y: 0,
      //       width: 5,
      //       text: self.filter,
      //       selectable: true
      //     })
      // );
      // if (!subDec.label) {
      //   return;
      // }
      // // HACK: key-finding logic seems hella dirty but simplest way for now
      // let key, text;
      // if (subDec.linkId !== undefined) {
      //   key = `SCL-${subDec.linkId}`;
      //   text = `${subDec.label} = ${formatOut(subDec.out)}`;
      // } else if (subDec.inputId !== undefined) {
      //   key = `SCI-${subDec.inputId}`;
      //   text = subDec.label;
      // } else if (subDec.depId !== undefined) {
      //   key = `SCD-${subDec.depId}`;
      //   text = subDec.label;
      // }
      // const selectable =
      //   !subDec.equivalent(currentNode) && !subDec.equivalent(forLink);
      // if (
      //   subDec.label.includes(filter) ||
      //   formatOut(subDec.out).includes(filter)
      // ) {
      //   cells.push({
      //     subDec,
      //     key,
      //     x,
      //     y: y++,
      //     width: 5,
      //     selectable,
      //     fill: selectable ? subDec.color : "#999",
      //     text
      //   });
      // }
      // });
      // };
      // return cells;
      // };
      // const { links, inputs, dependencies } = repo;
    },
    keyMap(exit = () => {}) {
      if (self.inputMode) {
        return keyCode => {
          if (keyCode == 13) {
            self.toggleInputMode();
            if (self.baseCells.length > 1) {
              self.selectCellIndex(self.selectedCellIndex + 1);
            }
          }
        };
      }
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
              if (self.selectedCell.key === "FILTER") {
                self.toggleInputMode();
                return;
              }
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
              exit();
            }
          }
        },
        3: {
          6: {
            label: "Cancel",
            action() {
              exit();
            }
          }
        }
      };
    }
  }))
  .actions(self => ({
    toggleInputMode() {
      self.inputMode = !self.inputMode;
    },
    handleInput(e) {
      self.filter = e.target.value;
    }
  }));
