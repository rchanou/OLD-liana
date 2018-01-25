import { types, destroy, getSnapshot } from "mobx-state-tree";
import { isObservableArray } from "mobx";

import { Declaration } from "./repo";
import { Chooser } from "./chooser";
import { Tree } from "./tree";
import { newViewModel, cursorify, formatOut } from "./view";
import { pack } from "./pack";

const LOCAL_STORAGE_KEY = "LIANA";

export const makeRepoCells = (repo, x = 0, y = 0) => {
  const cells = [];
  let currentX = x;
  let currentY = y - 1;
  const renderProc = (parent, id, path = []) => {
    let proc = parent;
    if (id !== undefined) {
      proc = parent.get(id);
    }
    // const { id, line, ret, lines, out, name } = proc;
    // const renderLine = (line, lineId) => {};
    currentX = x;
    currentY++;
    const key = `CL-${path}-label`;
    cells.push({
      key,
      x: currentX,
      y: currentY,
      width: 2,
      selectable: true,
      text: `${id}: ${name}`,
      labelForDec: path
    });
    if (isObservableArray(proc)) {
      for (let i = 0; i < proc.length; i++) {
        currentX += 2;
        const word = proc[i];
        const key = `CL-${path}-${i}`;
        const newCell = {
          key,
          x: currentX,
          y: currentY,
          width: 2,
          selectable: true,
          forDec: proc,
          nodeIndex: i,
          text: word.name || `${path}-${i}`,
          // text: lineId ? proc.lineName(lineId) : word.name, // TODO: not fully working, see lineName method comment
          fill: word.color
        };
        // if (word.gRef) {
        //   newCell.gotoCellKey = `CL-${word.gRef.id}-0`;
        // }
        cells.push(newCell);
      }
    } else {
      proc.forEach((_, procId) => {
        renderProc(proc, procId, [...path, procId]);
        currentX = 0;
        currentY++;
      });
      // renderLine(ret, `${id}-r`);
    }
    currentX += 2;
    cells.push({
      key: `${key}-V`,
      x: currentX,
      y: currentY,
      width: 2,
      selectable: false
      // text: formatOut(out)
    });
  };
  renderProc(repo);
  return cells;
};

const NodeRef = types
  .model("NodeRef", {
    forDec: types.reference(Declaration),
    nodeIndex: types.maybe(types.number)
  })
  .views(self => ({
    get node() {
      return self.forDec.nodes[self.nodeIndex];
    }
  }));

export const MainEditor = newViewModel("RepoLister", {
  changeCellMode: false,
  changeOpMode: false,
  addNodeMode: false,
  addOpMode: false,
  chooser: types.maybe(Chooser),
  editingNode: types.maybe(NodeRef),
  editingLabelForDec: types.maybe(types.reference(Declaration)),
  tree: types.maybe(Tree)
})
  .views(self => ({
    get baseCells() {
      return makeRepoCells(self.engine.main);
    },
    // get cells() {
    //   return self.activeCells;
    // },
    // get activeCells() {
    //   if (self.chooser) {
    //     return self.chooser.allCells;
    //   }

    //   if (self.tree) {
    //     return self.tree.allCells;
    //   }

    //   return self.allCells;
    // },
    get input() {
      if (self.editingNode) {
        return self.editingNode.node.out;
      }

      if (self.editingLabelForDec) {
        return self.editingLabelForDec.name;
      }

      return null;
    }
  }))
  .actions(self => ({
    handleInput(e) {
      if (self.chooser) {
        self.chooser.handleInput(e);
      }

      if (self.editingNode) {
        self.editingNode.node.select(e.target.value);
      }

      if (self.editingLabelForDec) {
        self.editingLabelForDec.setLabel(e.target.value);
      }
    },
    toggleChooser(forDec, nodeIndex) {
      if (self.chooser) {
        destroy(self.chooser);
      } else {
        const { forDec, nodeIndex } = self.selectedCell;
        self.chooser = { forDec, nodeIndex };
      }
    },
    toggleChangeCellMode() {
      self.changeCellMode = !self.changeCellMode;
    },
    toggleEditingValMode() {
      if (self.editingNode) {
        destroy(self.editingNode);
      } else {
        const { forDec, nodeIndex } = self.selectedCell;
        self.editingNode = { forDec, nodeIndex };
      }
    },
    toggleChangeOpMode() {
      self.changeOpMode = !self.changeOpMode;
    },
    toggleAddNodeMode() {
      self.addNodeMode = !self.addNodeMode;
    },
    setChoosingLink(forDec) {
      self.linkChooser = { forDec };
    },
    toggleLabelEdit() {
      if (self.editingLabelForDec) {
        self.editingLabelForDec = null;
      } else {
        self.editingLabelForDec = self.selectedCell.labelForDec;
      }
    },
    toggleTree() {
      if (self.tree) {
        destroy(self.tree);
      } else {
        self.tree = { rootLink: self.selectedCell.forDec };
      }
    }
  }))
  .views(self => ({
    get keyMap() {
      if (self.chooser) {
        return self.chooser.keyMap(self.toggleChooser);
      }

      if (self.tree) {
        return self.tree.keyMap(self.toggleTree);
      }

      const { selectedCell, setInput, toggleChangeCellMode, toggleChangeOpMode, toggleAddNodeMode } = self;
      const { forDec, nodeIndex } = selectedCell;

      if (self.input != null) {
        return keyCode => {
          if (keyCode == 13) {
            if (self.editingNode) {
              self.toggleEditingValMode();
              // self.moveRight();
            }
            if (self.editingLabelForDec) {
              self.toggleLabelEdit();
            }
          }
        };
      }

      if (self.changeCellMode) {
        const keyMap = {
          2: {
            6: {
              name: "Op",
              action() {
                toggleChangeCellMode();
                toggleChangeOpMode();
              }
            }
          },
          3: { 6: { name: "Cancel", action: toggleChangeCellMode } }
        };

        if (nodeIndex) {
          keyMap[1] = {
            7: {
              name: "Num",
              action() {
                forDec.setNode(nodeIndex, { val: 0 });
                toggleChangeCellMode();
                self.toggleEditingValMode();
              }
            },
            8: {
              name: "Text",
              action() {
                forDec.setNode(nodeIndex, { val: "" });
                toggleChangeCellMode();
                self.toggleEditingValMode();
              }
            },
            9: {
              name: "Bool",
              action() {
                forDec.setNode(nodeIndex, { val: false });
                toggleChangeCellMode();
              }
            }
          };
        }

        return keyMap;
      }

      if (self.changeOpMode) {
        const o = op => ({
          name: op,
          action() {
            forDec.setNode(nodeIndex, { op });
            toggleChangeOpMode();
          }
        });

        return {
          1: {
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
            0: { name: "Cancel", action: toggleChangeOpMode },
            6: o("=="),
            7: o("==="),
            8: o("!="),
            9: o("!==")
          }
        };
      }

      if (self.addNodeMode) {
        const selectNewCell = () => {
          const newSelectedCellIndex = self.baseCells.findIndex(
            cell => cell.key === `CL-${forDec.id}-${forDec.nodes.length - 1}`
          );

          if (newSelectedCellIndex !== -1) {
            self.selectCellIndex(newSelectedCellIndex);
          }
          toggleAddNodeMode();
        };

        return {
          1: {
            7: {
              name: "Num",
              action() {
                const lastNodeIndex = forDec.addNode({ val: 0 });
                selectNewCell(lastNodeIndex);
                self.toggleEditingValMode();
              }
            },
            8: {
              name: "Text",
              action() {
                const lastNodeIndex = forDec.addNode({ val: "" });
                selectNewCell(lastNodeIndex);
                self.toggleEditingValMode();
              }
            },
            9: {
              name: "Bool",
              action() {
                const lastNodeIndex = forDec.addNode({ val: false });
                selectNewCell(lastNodeIndex);
              }
            }
          },
          2: {
            6: {
              name: "Op",
              action() {
                const lastNodeIndex = forDec.addNode({ op: "." });
                selectNewCell(lastNodeIndex);
                toggleChangeOpMode();
              }
            }
          },
          3: { 6: { name: "Cancel", action: toggleAddNodeMode } }
        };
      }

      const { baseKeyMap } = self;

      const keyMap = {
        1: {
          ...baseKeyMap[1],
          0: {
            name: "Save",
            action() {
              const snapshot = getSnapshot(self.repo);
              const minified = minify(snapshot);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(minified));
              console.log(JSON.stringify(snapshot));
            }
          },
          // 2: { name: "▲", action: self.moveUp },
          5: {
            name: "Add Dec",
            action() {
              self.repo.addLink();

              // TODO: this logic to find the last-added name feels kinda hacky; improve?
              let i = self.baseCells.length;
              while (--i) {
                if (self.baseCells[i].labelForDec) {
                  self.selectCellIndex(i);
                  self.toggleLabelEdit();
                  return;
                }
              }
            }
          },
          6: { name: "Add", action: toggleAddNodeMode }
        },
        2: {
          ...baseKeyMap[2],
          // 1: { name: "◀", action: self.moveLeft },
          // 2: { name: "▼", action: self.moveDown },
          // 3: { name: "▶", action: self.moveRight },
          6: { name: "Change", action: toggleChangeCellMode },
          9: {
            name: "Delete",
            action() {
              if (typeof nodeIndex === "number") {
                selectedCell.forDec.deleteNode(nodeIndex);
                self.selectCellIndex(self.selectedCellIndex - 1);
              }
            }
          }
        },
        3: {}
      };

      if (selectedCell.labelForDec) {
        keyMap[2][6] = {
          name: "Change Label",
          action: self.toggleLabelEdit
        };
      }

      if (selectedCell.forDec) {
        keyMap[2][5] = {
          name: "Chooser",
          action: self.toggleChooser
        };
        keyMap[3][5] = {
          name: "Tree",
          action: self.toggleTree
        };
      }

      if (selectedCell.gotoCellKey) {
        keyMap[2][7] = {
          name: "Go To Def",
          action() {
            const gotoCellIndex = self.baseCells.findIndex(cell => cell.key === selectedCell.gotoCellKey);

            if (gotoCellIndex !== -1) {
              self.selectCellIndex(gotoCellIndex);
            }

            return;
          }
        };
      }

      return keyMap;
    }
  }));
