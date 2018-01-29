import { types, destroy, getSnapshot } from "mobx-state-tree";
import { isObservableArray } from "mobx";

// import { Declaration } from "./repo";
import { Chooser } from "./chooser";
import { Tree } from "./tree";
import { viewModel, cursorify, formatOut } from "./view";
import { pack } from "./pack";

const LOCAL_STORAGE_KEY = "LIANA";

const NodeRef = types
  .model("NodeRef", {
    // forDec: types.reference(Declaration),
    nodeIndex: types.maybe(types.number)
  })
  .views(self => ({
    get node() {
      return self.forDec.nodes[self.nodeIndex];
    }
  }));

export const MainEditor = viewModel("RepoLister", {
  changeCellMode: false,
  changeOpMode: false,
  addNodeMode: false,
  addOpMode: false,
  chooser: types.maybe(Chooser),
  editingNode: types.maybe(NodeRef),
  // editingLabelForDec: types.maybe(types.reference(Declaration)),
  tree: types.maybe(Tree)
})
  .views(self => ({
    get baseCells() {
      const { engine, user } = self;
      const makeProcCells = (parent, id, path = [], x = 0, y = 0) => {
        let proc = parent;
        if (id !== undefined) {
          proc = parent.get(id);
        }
        const cells = [
          {
            key: `CL-${path}`,
            x,
            y,
            width: 2,
            text: id === "R" ? "←" : id,
            fill: "hsl(270,66%,88%)",
            color: "#333"
          }
        ];
        let argX = x + 2;
        for (let i = 0; i < 2; i++) {
          const argName = user.pathName([path, i]);
          if (argName) {
            cells.push({
              key: `CL-${path}-arg-${i}`,
              x: argX,
              y,
              width: 2,
              text: argName,
              fill: "hsl(30,66%,83%)",
              color: "#333"
            });
            argX += 2;
          }
        }
        if (isObservableArray(proc)) {
          x += 2;
          proc.forEach((word, i) => {
            const { width = 2 } = word;
            cells.push({
              key: `CL-${path}-${i}`,
              x,
              y,
              width,
              selectable: true,
              fill: word.color,
              text: word.name || word.out
            });
            x += width;
          });
          return cells;
        }
        if (id !== undefined) {
          y++;
        }
        proc.forEach((_, subId) => {
          const subX = id === undefined ? x : x + 1;
          const subProcCells = makeProcCells(
            proc,
            subId,
            [...path, subId],
            subX,
            y
          );
          cells.push(...subProcCells);
          y = subProcCells[subProcCells.length - 1].y + 1;
          if (id === undefined) {
            y++;
          }
        });
        return cells;
      };
      return makeProcCells(engine.main);
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

      const {
        selectedCell,
        setInput,
        toggleChangeCellMode,
        toggleChangeOpMode,
        toggleAddNodeMode
      } = self;
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
            const gotoCellIndex = self.baseCells.findIndex(
              cell => cell.key === selectedCell.gotoCellKey
            );

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
