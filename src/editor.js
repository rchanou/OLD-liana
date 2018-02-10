import { types, destroy, getParent, getSnapshot } from "mobx-state-tree";
import { isObservableArray } from "mobx";
import produce from "immer";
import merge from "deepmerge";

import { Chooser } from "./chooser";
// import { Tree } from "./tree";
import { optionalModel } from "./model-utils";
import { UI, calcWidth, formatOut } from "./view";
import { packApp } from "./app";

const LOCAL_STORAGE_KEY = "LIANA";

// const NodeRef = types
//   .model("NodeRef", {
//     // forDec: types.reference(Declaration),
//     nodeIndex: types.maybe(types.number)
//   })
//   .views(self => ({
//     get node() {
//       return self.forDec.nodes[self.nodeIndex];
//     }
//   }));

export const MainEditor = types
  .compose(
    "MainEditor",
    UI,
    optionalModel({
      groupFilter: "test",
      editFilterMode: false,
      chooseOpMode: false,
      addNodeMode: false,
      chooser: types.optional(Chooser, {}),
      editingPathName: types.maybe(
        types.array(types.union(types.string, types.number))
      )
      // changeCellMode: false,
      // editingNode: types.maybe(NodeRef),
      // tree: types.maybe(Tree)
    })
  )
  .views(self => ({
    get shownGroup() {
      const { groupFilter } = self;
      let foundGroup;
      self.repo.groups.forEach((group, id) => {
        if (group.name === groupFilter) {
          foundGroup = group;
          return;
        }
      });
      return foundGroup;
    },
    get shownDec() {
      const { shownGroup, repo } = self;
      const { main } = repo;
      if (!shownGroup) {
        return main;
      }
      const dec = new Map();
      for (const decId of shownGroup.decs) {
        dec.set(decId, main.get(decId));
      }
      return dec;
    },
    get baseCells() {
      const { groupFilter, shownDec, repo, user } = self;
      const makeBaseCells = (x = 0, y = 0) => {
        const groupCell = {
          key: `CL-GROUP`,
          x,
          y: y++,
          text: groupFilter,
          width: calcWidth(groupFilter)
        };
        const makeDecCells = (parent, id, path = [], x = 0, y = 0) => {
          let dec = parent;
          if (id !== undefined) {
            dec = parent.get(id);
          }
          const isDec = !isObservableArray(dec);
          const procName = user.pathName(path);
          const width = calcWidth(procName);
          const cells = [
            {
              key: `CL-${path}`,
              x,
              y,
              width,
              text: procName,
              fill: "hsl(270,66%,88%)",
              color: "#333",
              selectable: true,
              path,
              editableName: true,
              isDec
            }
          ];
          const params = repo.fullParams[path];
          if (params) {
            let paramX = x + width;
            for (let i = 0; i < params.length; i++) {
              const param = params[i];
              const name = user.pathName([...path, i]);
              const width = calcWidth(name);
              cells.push({
                key: `CL-P-${path},${i}`,
                x: paramX,
                y,
                width,
                text: name,
                fill: "hsl(30,66%,83%)",
                color: "#333",
                selectable: true,
                path: [...path, i],
                editableName: true
              });
              paramX += width;
            }
          }
          if (!isDec) {
            x += width;
            let params;
            let i = 0;
            for (i; i < dec.length; i++) {
              const node = dec[i];
              const { width = 2 } = node;
              const newCell = {
                key: `CL-${path}-${i}`,
                x,
                y,
                width,
                selectable: true,
                fill: node.color,
                text: node.name || node.out,
                path,
                index: i
              };
              if ("ref" in node) {
                newCell.gotoCellKey = `CL-${node.ref.slice()}-0`;
                if (!i) {
                  params = repo.params.get(path);
                  if (params) {
                    console.log("par", params);
                  }
                }
              }
              if ("arg" in node) {
                newCell.gotoCellKey = `CL-P-${node.arg.slice()}`;
              }
              cells.push(newCell);
              x += width;
            }
            if (!dec.some(node => "arg" in node)) {
              const text = formatOut(repo, path);
              cells.push({
                key: `CL-${path}-out`,
                x,
                y,
                text,
                width: calcWidth(text)
              });
            }
            return cells;
          }

          if (id !== undefined) {
            y++;
          }
          dec.forEach((_, subId) => {
            // TODO: inline anonymous decs
            const subX = id === undefined ? x : x + 1;
            const subDecCells = makeDecCells(
              dec,
              subId,
              [...path, subId],
              subX,
              y
            );
            cells.push(...subDecCells);
            y = subDecCells[subDecCells.length - 1].y + 1;
            if (id === undefined) {
              y++;
            }
          });
          return cells;
        };
        return makeDecCells(shownDec, undefined, undefined, x, y).concat(
          groupCell
        );
      };
      return makeBaseCells();
    },
    get activeCells() {
      if (self.chooser.show) {
        return self.chooser.cells;
      }
      if (self.tree) {
        return self.tree.allCells;
      }
      return self.cells;
    },
    get input() {
      if (self.editingNode) {
        return self.editingNode.node.out;
      }
      if (self.editingPathName) {
        return self.user.pathName(self.editingPathName);
      }
      if (self.editFilterMode) {
        return self.groupFilter;
      }
      return null;
    }
  }))
  .actions(self => ({
    handleInput(e) {
      if (self.chooser.show) {
        self.chooser.handleInput(e);
      }
      if (self.editingNode) {
        self.editingNode.node.select(e.target.value);
      }
      if (self.editingPathName) {
        self.user.currentNameSet.setName(self.editingPathName, e.target.value);
      }
      if (self.editFilterMode) {
        self.groupFilter = e.target.value;
      }
    },
    toggleEditFilterMode() {
      self.editFilterMode = !self.editFilterMode;
    },
    // toggleChangeCellMode() {
    //   self.changeCellMode = !self.changeCellMode;
    // },
    // toggleEditingValMode() {
    //   if (self.editingNode) {
    //     destroy(self.editingNode);
    //   } else {
    //     const { forDec, nodeIndex } = self.selectedCell;
    //     self.editingNode = { forDec, nodeIndex };
    //   }
    // },
    toggleChooseOpMode() {
      self.chooseOpMode = !self.chooseOpMode;
    },
    toggleAddNodeMode() {
      self.addNodeMode = !self.addNodeMode;
    },
    toggleNameEdit() {
      if (self.editingPathName) {
        self.editingPathName = null;
      } else {
        self.editingPathName = self.selectedCell.path;
      }
    },
    // toggleTree() {
    //   if (self.tree) {
    //     destroy(self.tree);
    //   } else {
    //     self.tree = { rootLink: self.selectedCell.forDec };
    //   }
    // },
    addToDec(item = []) {
      const { isDec, path } = self.selectedCell;
      const newId = self.repo.addToDec(isDec ? path : path.slice(0, -1), item);
      if (self.groupFilter && newId.length === 1) {
        self.shownGroup.add(newId[0]);
      }
      const newKey = `CL-${newId}`;
      const { baseCells } = self;
      let i = baseCells.length;
      while (--i) {
        if (baseCells[i].key === newKey) {
          self.selectCellIndex(i);
          // HACK: allows time for animation from above select action
          // TODO: more elegant way to do this
          setTimeout(self.toggleNameEdit, 199);
          return newId;
        }
      }
      return newId;
    }
  }))
  .views(self => ({
    get keyMap() {
      const {
        selectedCell
        // toggleChangeCellMode
      } = self;
      if (self.chooser.show) {
        return merge(self.chooser.keyMap, {
          2: {
            6: {
              action: [
                () => {
                  if (self.addNodeMode) {
                    self.toggleAddNodeMode();
                    let newItem;
                    {
                      const { path } = self.chooser.selectedCell;
                      if (typeof path[path.length - 1] === "number") {
                        newItem = { arg: path };
                      } else {
                        newItem = { ref: path };
                      }
                    }
                    const { path, index } = selectedCell;
                    self.repo.addNode(
                      newItem,
                      path,
                      index == null ? 0 : index + 1
                    );
                    self.selectCellIndex(self.selectedCellIndex + 1);
                  }
                }
              ]
            }
          }
        });
      }
      if (self.tree) {
        return self.tree.keyMap(self.toggleTree);
      }
      if (self.editingPathName) {
        return {
          title: "Type to Change Name",
          enter: "Save",
          esc: "Cancel",
          tab: "Save and Move Right",
          onKey(e) {
            if (e.keyCode == 13) {
              self.toggleNameEdit();
            }
          }
        };
      }
      if (self.editFilterMode) {
        return {
          title: "Type to Change Filter",
          enter: "Finish",
          onKey(e) {
            if (e.keyCode == 13) {
              self.toggleEditFilterMode();
            }
          }
        };
      }
      // if (self.changeCellMode) {
      //   const keyMap = {
      //     2: {
      //       6: {
      //         label: "Op",
      //         action() {
      //           toggleChangeCellMode();
      //           // toggleChooseOpMode();
      //         }
      //       }
      //     },
      //     3: { 6: { label: "Cancel", action: toggleChangeCellMode } }
      //   };
      //   if (nodeIndex) {
      //     keyMap[1] = {
      //       7: {
      //         label: "Num",
      //         action() {
      //           forDec.setNode(nodeIndex, { val: 0 });
      //           toggleChangeCellMode();
      //           self.toggleEditingValMode();
      //         }
      //       },
      //       8: {
      //         label: "Text",
      //         action() {
      //           forDec.setNode(nodeIndex, { val: "" });
      //           toggleChangeCellMode();
      //           self.toggleEditingValMode();
      //         }
      //       },
      //       9: {
      //         label: "Bool",
      //         action() {
      //           forDec.setNode(nodeIndex, { val: false });
      //           toggleChangeCellMode();
      //         }
      //       }
      //     };
      //   }
      //   return keyMap;
      // }
      if (self.chooseOpMode) {
        const o = op => ({
          label: op,
          action() {
            if (self.addNodeMode) {
              self.toggleChooseOpMode();
              self.toggleAddNodeMode();
              const { path, index } = selectedCell;
              self.repo.addNode({ op }, path, index == null ? 0 : index + 1);
              self.selectCellIndex(self.selectedCellIndex + 1);
            }
          }
        });
        return {
          1: {
            // TODO: use op enum constants
            0: o("@"),
            1: o("["),
            2: o("{"),
            3: o("."),
            4: o("g"),
            5: o("+"),
            6: o("-"),
            7: o("*"),
            8: o("/"),
            9: o("%")
          },
          2: {
            1: o("f"),
            2: o("s"),
            3: o("?"),
            6: o("<"),
            7: o(">"),
            8: o("<="),
            9: o(">=")
          },
          3: {
            0: {
              label: "Cancel",
              action() {
                if (self.addNodeMode) {
                  self.toggleAddNodeMode();
                  self.toggleChooseOpMode();
                }
              }
            },
            6: o("=="),
            7: o("==="),
            8: o("!="),
            9: o("!==")
          }
        };
      }
      // if (self.addNodeMode) {
      //   const selectNewCell = () => {
      //     const newSelectedCellIndex = self.baseCells.findIndex(
      //       cell => cell.key === `CL-${forDec.id}-${forDec.nodes.length - 1}`
      //     );
      //     if (newSelectedCellIndex !== -1) {
      //       self.selectCellIndex(newSelectedCellIndex);
      //     }
      //     self.toggleAddNodeMode();
      //   };
      //   return {
      //     1: {
      //       7: {
      //         label: "Num",
      //         action() {
      //           const lastNodeIndex = forDec.addNode({ val: 0 });
      //           selectNewCell(lastNodeIndex);
      //           self.toggleEditingValMode();
      //         }
      //       },
      //       8: {
      //         label: "Text",
      //         action() {
      //           const lastNodeIndex = forDec.addNode({ val: "" });
      //           selectNewCell(lastNodeIndex);
      //           self.toggleEditingValMode();
      //         }
      //       },
      //       9: {
      //         label: "Bool",
      //         action() {
      //           const lastNodeIndex = forDec.addNode({ val: false });
      //           selectNewCell(lastNodeIndex);
      //         }
      //       }
      //     },
      //     2: {
      //       6: {
      //         label: "Op",
      //         action() {
      //           const lastNodeIndex = forDec.addNode({ op: "." });
      //           selectNewCell(lastNodeIndex);
      //           // toggleChooseOpMode();
      //         }
      //       }
      //     },
      //     3: { 6: { label: "Cancel", action: self.toggleAddNodeMode } }
      //   };
      // }
      const keyMap = {
        1: {
          0: {
            label: "Save",
            action() {
              // this feels wrong, but it was the easiest way to do it
              const appStore = getParent(self);
              const snapshot = getSnapshot(appStore);
              const packed = packApp(snapshot);
              const serialized = JSON.stringify(packed);
              localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
              console.log(serialized);
            }
          },
          3: {
            label: "Change Filter",
            action: self.toggleEditFilterMode
          },
          5: {
            label: "Add Line",
            action() {
              self.addToDec();
            }
          }
        },
        2: {
          5: {
            label: "Add Func",
            action() {
              self.addToDec({ R: [] });
            }
          }
          // 6: { label: "Change Node", action: toggleChangeCellMode }
        },
        3: {}
      };
      if (selectedCell.isDec) {
        keyMap[1][6] = {
          label: "Add Param",
          action() {
            self.repo.addParam(selectedCell.path);
          }
        };
      } else if (
        typeof selectedCell.path[selectedCell.path.length - 1] === "string"
      ) {
        keyMap[1][6] = {
          label: "Add Op",
          action() {
            self.toggleAddNodeMode();
            self.toggleChooseOpMode();
          }
        };
        keyMap[1][7] = {
          label: "Add Ref",
          action() {
            self.toggleAddNodeMode();
            self.chooser.toggle(selectedCell.path, selectedCell.index);
          }
        };
      }
      if (self.groupFilter) {
        keyMap[1][4] = {
          label: "Move Up",
          action() {
            const [topScopeId] = selectedCell.path;
            const groupIndex = self.shownGroup.decs.indexOf(topScopeId);
            if (groupIndex === -1) {
              return;
            }
            const selectedCellKey = selectedCell.key;
            self.shownGroup.moveUp(groupIndex);
            const newCellIndex = self.baseCells.findIndex(
              c => c.key === selectedCellKey
            );
            self.selectCellIndex(newCellIndex);
          }
        };
        keyMap[2][4] = {
          label: "Move Down",
          action() {
            const [topScopeId] = selectedCell.path;
            const groupIndex = self.shownGroup.decs.indexOf(topScopeId);
            if (groupIndex === -1) {
              return;
            }
            const selectedCellKey = selectedCell.key;
            self.shownGroup.moveDown(groupIndex);
            const newCellIndex = self.baseCells.findIndex(
              c => c.key === selectedCellKey
            );
            self.selectCellIndex(newCellIndex);
          }
        };
      }
      keyMap[3][9] = {
        label: "Delete",
        action() {
          self.selectCellIndex(self.selectedCellIndex - 1);
          self.repo.deleteFromDec(selectedCell.path, selectedCell.index);
        }
      };
      if (selectedCell.editableName) {
        keyMap[2][6] = {
          label: "Change Name",
          action: self.toggleNameEdit
        };
      }
      // if (selectedCell.forDec) {
      //   keyMap[3][5] = {
      //     label: "Tree",
      //     action: self.toggleTree
      //   };
      // }
      if (selectedCell.gotoCellKey) {
        keyMap[2][7] = {
          label: "Go To Def",
          action() {
            const gotoCellIndex = self.baseCells.findIndex(
              cell => cell.key === selectedCell.gotoCellKey
            );
            if (gotoCellIndex !== -1) {
              self.selectCellIndex(gotoCellIndex);
            }
          }
        };
      }
      return merge(self.baseKeyMap, keyMap);
    }
  }));
