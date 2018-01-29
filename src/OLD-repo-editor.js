import { types, destroy, getSnapshot } from "mobx-state-tree";

import { Link, Dependency } from "./core";
import { Chooser } from "./chooser";
import { Tree } from "./tree";
import { uiModel, cursorify, formatOut } from "./user-interface";
import { minify } from "./minify";

const LOCAL_STORAGE_KEY = "LIANA";

export const makeRepoCells = (repo, x = 0, y = 0) => {
  const cells = [];

  let currentX = x;
  let currentY = y - 1;

  repo.links.forEach(link => {
    const { linkId, nodes, fun, params, out, label } = link;

    currentX = x;
    currentY++;

    const key = `CL-${linkId}`;

    cells.push({
      key,
      x: currentX,
      y: currentY,
      width: 2,
      selectable: true,
      text: `${linkId}: ${label}`,
      labelForLink: link
    });

    if (params) {
      for (let i = 0; i < params.length; i++) {
        currentX += 2;
        const param = params[i];
        const key = `CLP-${linkId}-${i}`;

        const newCell = {
          key,
          x: currentX,
          y: currentY,
          width: 2,
          selectable: true,
          forLink: link,
          nodeIndex: i,
          text: param.label,
          fill: param.color
        };

        cells.push(newCell);
      }
    }

    if (nodes) {
      for (let i = 0; i < nodes.length; i++) {
        currentX += 2;
        const node = nodes[i];
        const key = `CL-${linkId}-${i}`;

        const newCell = {
          key,
          x: currentX,
          y: currentY,
          width: 2,
          selectable: true,
          forLink: link,
          nodeIndex: i,
          text: node.label,
          fill: node.color
        };

        if (node.ref) {
          newCell.gotoCellKey = `CL-${node.ref.linkId}-0`;
        }

        cells.push(newCell);
      }
    }

    currentX += 2;

    cells.push({
      key: `${key}-V`,
      x: currentX,
      y: currentY,
      width: 2,
      selectable: false,
      text: formatOut(out)
    });
  });

  return cells;
};

const optionalBoolean = types.optional(types.boolean, false);

const NodeRef = types
  .model("NodeRef", {
    forLink: types.reference(Link),
    nodeIndex: types.maybe(types.number)
  })
  .views(self => ({
    get node() {
      return self.forLink.nodes[self.nodeIndex];
    }
  }));

export const RepoEditor = uiModel("RepoLister", {
  changeCellMode: optionalBoolean,
  changeOpMode: optionalBoolean,
  addNodeMode: optionalBoolean,
  addOpMode: optionalBoolean,
  chooser: types.maybe(Chooser),
  editingNode: types.maybe(NodeRef),
  editingLabelForLink: types.maybe(types.reference(Link)),
  tree: types.maybe(Tree)
})
  .views(self => ({
    get baseCells() {
      return makeRepoCells(self.repo);
    },
    get activeCells() {
      if (self.chooser) {
        return self.chooser.allCells;
      }

      if (self.tree) {
        return self.tree.allCells;
      }

      return self.allCells;
    },
    get input() {
      if (self.editingNode) {
        return self.editingNode.node.out;
      }

      if (self.editingLabelForLink) {
        return self.editingLabelForLink.label;
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

      if (self.editingLabelForLink) {
        self.editingLabelForLink.setLabel(e.target.value);
      }
    },
    toggleChooser(forLink, nodeIndex) {
      if (self.chooser) {
        destroy(self.chooser);
      } else {
        const { forLink, nodeIndex } = self.selectedCell;
        self.chooser = { forLink, nodeIndex };
      }
    },
    toggleChangeCellMode() {
      self.changeCellMode = !self.changeCellMode;
    },
    toggleEditingValMode() {
      if (self.editingNode) {
        destroy(self.editingNode);
      } else {
        const { forLink, nodeIndex } = self.selectedCell;
        self.editingNode = { forLink, nodeIndex };
      }
    },
    toggleChangeOpMode() {
      self.changeOpMode = !self.changeOpMode;
    },
    toggleAddNodeMode() {
      self.addNodeMode = !self.addNodeMode;
    },
    setChoosingLink(forLink) {
      self.linkChooser = { forLink };
    },
    toggleLabelEdit() {
      if (self.editingLabelForLink) {
        self.editingLabelForLink = null;
      } else {
        self.editingLabelForLink = self.selectedCell.labelForLink;
      }
    },
    toggleTree() {
      if (self.tree) {
        destroy(self.tree);
      } else {
        self.tree = { rootLink: self.selectedCell.forLink };
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
      const { forLink, nodeIndex } = selectedCell;

      if (self.input != null) {
        return keyCode => {
          if (keyCode == 13) {
            if (self.editingNode) {
              self.toggleEditingValMode();
              // self.moveRight();
            }
            if (self.editingLabelForLink) {
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
                forLink.setNode(nodeIndex, { val: 0 });
                toggleChangeCellMode();
                self.toggleEditingValMode();
              }
            },
            8: {
              label: "Text",
              action() {
                forLink.setNode(nodeIndex, { val: "" });
                toggleChangeCellMode();
                self.toggleEditingValMode();
              }
            },
            9: {
              label: "Bool",
              action() {
                forLink.setNode(nodeIndex, { val: false });
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
            forLink.setNode(nodeIndex, { op });
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
            cell => cell.key === `CL-${forLink.linkId}-${forLink.nodes.length - 1}`
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
                const lastNodeIndex = forLink.addNode({ val: 0 });
                selectNewCell(lastNodeIndex);
                self.toggleEditingValMode();
              }
            },
            8: {
              label: "Text",
              action() {
                const lastNodeIndex = forLink.addNode({ val: "" });
                selectNewCell(lastNodeIndex);
                self.toggleEditingValMode();
              }
            },
            9: {
              label: "Bool",
              action() {
                const lastNodeIndex = forLink.addNode({ val: false });
                selectNewCell(lastNodeIndex);
              }
            }
          },
          2: {
            6: {
              label: "Op",
              action() {
                const lastNodeIndex = forLink.addNode({ op: "." });
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
          // 2: { label: "▲", action: self.moveUp },
          5: {
            label: "Add Link",
            action() {
              self.repo.addLink();

              // TODO: this logic to find the last-added label feels kinda hacky; improve?
              let i = self.baseCells.length;
              while (--i) {
                if (self.baseCells[i].labelForLink) {
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
          // 1: { label: "◀", action: self.moveLeft },
          // 2: { label: "▼", action: self.moveDown },
          // 3: { label: "▶", action: self.moveRight },
          6: { label: "Change", action: toggleChangeCellMode },
          9: {
            label: "Delete",
            action() {
              if (typeof nodeIndex === "number") {
                selectedCell.forLink.deleteNode(nodeIndex);
                self.selectCellIndex(self.selectedCellIndex - 1);
              }
            }
          }
        },
        3: {}
      };

      if (selectedCell.labelForLink) {
        keyMap[2][6] = {
          label: "Change Label",
          action: self.toggleLabelEdit
        };
      }

      if (selectedCell.forLink) {
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
