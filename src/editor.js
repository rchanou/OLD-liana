import { types, destroy, getSnapshot } from "mobx-state-tree";
import { isObservableArray } from "mobx";

import { Chooser } from "./chooser";
import { Tree } from "./tree";
import { viewModel, cursorify, formatOut, calcWidth } from "./view";
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

export const MainEditor = viewModel("MainEditor", {
  changeCellMode: false,
  changeOpMode: false,
  addNodeMode: false,
  addOpMode: false,
  chooser: types.maybe(Chooser),
  editingNode: types.maybe(NodeRef),
  editingNameForDec: types.maybe(types.array(types.string)),
  tree: types.maybe(Tree)
})
  .views(self => ({
    get baseCells() {
      const { engine, user } = self;
      const makeDecCells = (parent, id, path = [], x = 0, y = 0) => {
        let dec = parent;
        if (id !== undefined) {
          dec = parent.get(id);
        }
        const procName = user.pathName(path);
        const width = calcWidth(procName);
        const cells = [
          {
            key: `CL-${path}`,
            x,
            y,
            width,
            text: id === "R" ? "←" : procName || id,
            fill: "hsl(270,66%,88%)",
            color: "#333",
            selectable: true,
            nameForDec: path,
            parentDec: path
          }
        ];
        let argX = x + width;
        for (let i = 0; i < 2; i++) {
          const argName = user.pathName([path, i]);
          const width = calcWidth(argName);
          if (argName) {
            cells.push({
              key: `CL-${path}-arg-${i}`,
              x: argX,
              y,
              width,
              text: argName,
              fill: "hsl(30,66%,83%)",
              color: "#333",
              selectable: true,
              parentDec: path
            });
            argX += width;
          }
        }
        if (isObservableArray(dec)) {
          x += width;
          dec.forEach((node, i) => {
            const { width = 2 } = node;
            const newCell = {
              key: `CL-${path}-${i}`,
              x,
              y,
              width,
              selectable: true,
              fill: node.color,
              text: node.name || node.out
            };
            if ("ref" in node) {
              newCell.gotoCellKey = `CL-${node.ref.slice()}-0`;
            }
            newCell.parentDec = parent;
            cells.push(newCell);
            x += width;
          });
          if (!dec.some(node => "arg" in node)) {
            const result = engine.run(path);
            const text =
              typeof result === "function"
                ? "f"
                : typeof result === "object"
                  ? JSON.stringify(result)
                  : String(result);
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
          // if (
          //   id !== undefined &&
          //   subId !== "R" &&
          //   !user.pathName([...path.slice(), subId])
          // ) {
          //   return;
          // }
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
      return makeDecCells(engine.main);
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
      if (self.editingNameForDec) {
        return self.user.pathName(self.editingNameForDec);
        // return self.editingNameForDec.name;
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

      if (self.editingNameForDec) {
        self.user.currentNameSet.setName(
          self.editingNameForDec,
          e.target.value
        );
        // self.editingNameForDec.setLabel(e.target.value);
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
      if (self.editingNameForDec) {
        self.editingNameForDec = null;
      } else {
        self.editingNameForDec = self.selectedCell.nameForDec;
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
            if (self.editingNameForDec) {
              self.toggleLabelEdit();
            }
          }
        };
      }

      if (self.changeCellMode) {
        const keyMap = {
          2: {
            6: {
              label: "Op",
              action() {
                toggleChangeCellMode();
                toggleChangeOpMode();
              }
            }
          },
          3: { 6: { label: "Cancel", action: toggleChangeCellMode } }
        };

        if (nodeIndex) {
          keyMap[1] = {
            7: {
              label: "Num",
              action() {
                forDec.setNode(nodeIndex, { val: 0 });
                toggleChangeCellMode();
                self.toggleEditingValMode();
              }
            },
            8: {
              label: "Text",
              action() {
                forDec.setNode(nodeIndex, { val: "" });
                toggleChangeCellMode();
                self.toggleEditingValMode();
              }
            },
            9: {
              label: "Bool",
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
          label: op,
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
            0: { label: "Cancel", action: toggleChangeOpMode },
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
              label: "Num",
              action() {
                const lastNodeIndex = forDec.addNode({ val: 0 });
                selectNewCell(lastNodeIndex);
                self.toggleEditingValMode();
              }
            },
            8: {
              label: "Text",
              action() {
                const lastNodeIndex = forDec.addNode({ val: "" });
                selectNewCell(lastNodeIndex);
                self.toggleEditingValMode();
              }
            },
            9: {
              label: "Bool",
              action() {
                const lastNodeIndex = forDec.addNode({ val: false });
                selectNewCell(lastNodeIndex);
              }
            }
          },
          2: {
            6: {
              label: "Op",
              action() {
                const lastNodeIndex = forDec.addNode({ op: "." });
                selectNewCell(lastNodeIndex);
                toggleChangeOpMode();
              }
            }
          },
          3: { 6: { label: "Cancel", action: toggleAddNodeMode } }
        };
      }

      const { baseKeyMap } = self;

      const keyMap = {
        1: {
          ...baseKeyMap[1],
          0: {
            label: "Save",
            action() {
              const snapshot = getSnapshot(self.repo);
              const minified = minify(snapshot);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(minified));
              console.log(JSON.stringify(snapshot));
            }
          },
          5: {
            label: "New Line",
            action() {
              self.engine.addDec(self.selectedCellIndex);

              // TODO: this logic to find the last-added name feels kinda hacky; improve?
              let i = self.baseCells.length;
              while (--i) {
                if (self.baseCells[i].nameForDec) {
                  self.selectCellIndex(i);
                  self.toggleLabelEdit();
                  return;
                }
              }
            }
          },
          6: { label: "Add", action: toggleAddNodeMode }
        },
        2: {
          ...baseKeyMap[2],
          6: { label: "Change", action: toggleChangeCellMode },
          9: {
            label: "Delete",
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

      if (selectedCell.nameForDec) {
        keyMap[2][6] = {
          label: "Change Label",
          action: self.toggleLabelEdit
        };
      }

      if (selectedCell.forDec) {
        keyMap[2][5] = {
          label: "Chooser",
          action: self.toggleChooser
        };
        keyMap[3][5] = {
          label: "Tree",
          action: self.toggleTree
        };
      }

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

            return;
          }
        };
      }

      return keyMap;
    }
  }));
