import { types } from "mobx-state-tree";
import { isObservableArray } from "mobx";
// import { UI, cursorify, formatOut } from "./view";
import { UI, formatOut } from "./view";
import { optionalModel } from "./model-utils";
import { RefPath } from "./core";

export const Chooser = types
  .compose(
    "Chooser",
    UI,
    optionalModel({
      show: false,
      path: types.optional(RefPath, []),
      index: types.maybe(types.number),
      filter: "",
      inputMode: false
    })
  )
  .actions(self => ({
    toggle(path, index) {
      if (path != null) {
        self.path = path;
      }
      if (index != null) {
        self.index = index;
      }
      self.show = !self.show;
    },
    toggleInputMode() {
      self.inputMode = !self.inputMode;
    },
    handleInput(e) {
      self.filter = e.target.value;
    }
  }))
  .views(self => ({
    // get currentNode() {
    //   return self.forLink.nodes[self.nodeIndex];
    // },
    get input() {
      return self.inputMode ? self.filter : null;
    },
    get baseCells() {
      const { filter, repo, user, path, index } = self;
      const { main } = repo;
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
      const pushDecRefCells = (dec, prePath = []) => {
        dec.forEach((subDec, subId) => {
          const path = [...prePath, subId];
          cells.push({
            key: `CHS-${path}`,
            x,
            y: y++,
            width: 5,
            text: `${user.pathName(path)} = ${formatOut(repo, path)}`,
            selectable: true,
            path,
            fill: "orchid"
          });
        });
      };
      let currentDec = repo.main;
      pushDecRefCells(currentDec);
      const runningPath = [];
      for (const id of path) {
        currentDec = currentDec.get(id);
        if (currentDec && !isObservableArray(currentDec)) {
          //TODO: warn, throw if not?
          runningPath.push(id);
          pushDecRefCells(currentDec, runningPath);
        }
      }
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
    // keyMap(exit = () => {}) {
    get keyMap() {
      if (self.inputMode) {
        return e => {
          if (e.keyCode == 13) {
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
            action: [
              () => {
                if (self.selectedCell.key === "FILTER") {
                  self.toggleInputMode();
                  return;
                }
                // const chosenRec = self.selectedCell.record;
                // const newNode = {};
                // if (chosenRec.linkId) {
                //   newNode.ref = chosenRec.linkId;
                // } else if (chosenRec.inputId) {
                //   newNode.input = chosenRec.inputId;
                // } else if (chosenRec.depId) {
                //   newNode.dep = chosenRec.depId;
                // }
                // const { forLink, nodeIndex } = self;
                // forLink.setNode(nodeIndex, newNode);
                // exit();
                self.toggle();
              }
            ]
          }
        },
        3: {
          6: {
            label: "Cancel",
            action: self.toggle
            // action() {
            //   exit();
            // }
          }
        }
      };
    }
  }));
