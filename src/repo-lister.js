import { types, destroy } from "mobx-state-tree";

import { Link, Dependency } from "./core";
import { Chooser } from "./chooser";
import { uiModel, cursorify, formatOut, CLOSE } from "./user-interface";

export const makeRepoCells = (repo, x = 0, y = 0) => {
  const cells = [];

  let currentX = x;
  let currentY = y - 1;

  repo.links.forEach(link => {
    const { linkId, nodes, out, label } = link;

    currentX = x;
    currentY++;

    const key = `CL-${linkId}`;

    cells.push({
      key,
      x: currentX,
      y: currentY,
      width: 2,
      selectable: true,
      text: label
    });

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      const key = `CL-${linkId}-${i}`;

      currentX += 2;

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

const NodeRef = types.model("NodeRef", {
  link: types.reference(Link),
  index: types.maybe(types.number)
});

export const RepoLister = uiModel("RepoLister", {
  changeCellMode: optionalBoolean,
  changeOpMode: optionalBoolean,
  addNodeMode: optionalBoolean,
  addOpMode: optionalBoolean,
  input: types.maybe(types.string),
  chooser: types.maybe(Chooser),
  editingNode: types.maybe(NodeRef)
})
  .views(self => ({
    get repoCells() {
      return makeRepoCells(self.repo);
    },
    get baseCells() {
      // return self.repoCells.concat(self.chooser ? self.chooser.baseCells : []);

      if (self.chooser) {
        return self.chooser.baseCells;
      }

      return self.repoCells;
    },
    get cursorCell() {
      if (self.chooser) {
        return self.chooser.cursorCell;
      }

      return cursorify(self.selectedCell, "RL", self.input);
    }
  }))
  .actions(self => ({
    handleInput(e) {
      // console.log("fun", e.target.value);
      self.input = e.target.value;
    },
    setInput(value) {
      self.input = value;
    },
    toggleChooser(forLink, nodeIndex) {
      if (self.chooser) {
        destroy(self.chooser);
      } else {
        const { forLink, nodeIndex } = self.selectedCell;
        self.chooser = { forLink, nodeIndex };
        self.chooser.events.on(CLOSE, self.toggleChooser);
      }
    },
    toggleChangeCellMode() {
      self.changeCellMode = !self.changeCellMode;
    },
    toggleChangeOpMode() {
      self.changeOpMode = !self.changeOpMode;
    },
    toggleAddNodeMode() {
      self.addNodeMode = !self.addNodeMode;
    },
    beginSettingNode(nodeRef) {
      self.settingNode = nodeRef;
    },
    setNode(value) {
      const { settingNode } = self;

      if (!settingNode) {
        return;
      }

      const { link, index } = settingNode;
      link.nodes[index].select(value);
    },
    endSettingNode() {
      self.settingNode = null;
    },
    setChoosingLink(forLink) {
      self.linkChooser = { forLink };
    }
  }))
  .views(self => ({
    get keyMap() {
      if (self.chooser) {
        return self.chooser.keyMap;
      }

      const {
        selectedCell,
        setInput,
        toggleChangeCellMode,
        toggleChangeOpMode,
        toggleAddNodeMode
      } = self;
      const { forLink, nodeIndex } = selectedCell;

      if (self.input != null) {
        return {
          onInput(keyCode) {
            if (keyCode == 13) {
              forLink.setVal(nodeIndex, self.input);
              setInput(null);
              self.moveRight();
            }
          },
          2: { 4: { label: "Input" }, 5: { label: "Mode" } }
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
            },
            7: {
              label: "Link",
              action() {
                toggleChangeCellMode();
                self.setChoosingLink(forLink);
              }
            }
          },
          3: { 6: { label: "Cancel", action: toggleChangeCellMode } }
        };

        if (nodeIndex) {
          keyMap[1] = {
            6: {
              label: "Num",
              action() {
                forLink.setNode(nodeIndex, { val: 0 });
                toggleChangeCellMode();
                setInput("0");
              }
            },
            7: {
              label: "Text",
              action() {
                forLink.setNode(nodeIndex, { val: "" });
                toggleChangeCellMode();
                setInput("");
              }
            },
            8: {
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
            cell =>
              cell.key === `CL-${forLink.linkId}-${forLink.nodes.length - 1}`
          );

          if (newSelectedCellIndex !== -1) {
            self.selectCellIndex(newSelectedCellIndex);
          }
          toggleAddNodeMode();
        };

        return {
          1: {
            6: {
              label: "Num",
              action() {
                const lastNodeIndex = forLink.addNode({ val: 0 });
                selectNewCell(lastNodeIndex);
                setInput("0");
              }
            },
            7: {
              label: "Text",
              action() {
                const lastNodeIndex = forLink.addNode({ val: "" });
                selectNewCell(lastNodeIndex);
                setInput("");
              }
            },
            8: {
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

      const keyMap = {
        1: {
          2: { label: "▲", action: self.moveUp },
          5: {
            label: "Add Link",
            action: self.repo.addLink // TODO: auto-select added link
          },
          6: { label: "Add", action: toggleAddNodeMode }
        },
        2: {
          1: { label: "◀", action: self.moveLeft },
          2: { label: "▼", action: self.moveDown },
          3: { label: "▶", action: self.moveRight },
          9: {
            label: "Delete",
            action() {
              if (typeof nodeIndex === "number") {
                const deleted = selectedCell.forLink.deleteNode(nodeIndex);
                if (nodeIndex > selectedCell.forLink.nodes.length - 1) {
                  self.moveLeft();
                }
              }
            }
          }
        },
        3: { 6: { label: "Change", action: toggleChangeCellMode } }
      };

      if (selectedCell.forLink) {
        keyMap[2][5] = {
          label: "Chooser",
          action: self.toggleChooser
        };
      }

      if (selectedCell.gotoCellKey) {
        keyMap[2][7] = {
          label: "Go To Def",
          action() {
            const gotoCellIndex = self.cells.findIndex(
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
