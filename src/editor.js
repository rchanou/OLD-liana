import { types } from "mobx-state-tree";

import { ContextRepo } from "./core";
import { ContextUser } from "./user";
import { makeRepoCells } from "./make-repo-list";
import { makeSearchCells } from "./make-search";
import { cursorify } from "./cells";

export const TREE = "TREE";
export const LIST = "LIST";

const keyLayout = {
  // TODO: make customizable
  "65": [0, 2],
  "66": [4, 3],
  "67": [2, 3],
  "68": [4, 2],
  "69": [7, 2],
  "70": [2, 1],
  "71": [4, 1],
  "72": [5, 2],
  "73": [8, 2],
  "74": [5, 1],
  "75": [5, 3],
  "76": [6, 1],
  "77": [6, 3],
  "78": [6, 2],
  "79": [9, 2],
  "80": [3, 1],
  "81": [0, 1],
  "82": [1, 2],
  "83": [2, 2],
  "84": [3, 2],
  "85": [7, 1],
  "86": [3, 3],
  "87": [1, 1],
  "88": [1, 3],
  "89": [8, 1],
  "90": [0, 3],
  "186": [9, 1],
  "188": [7, 3],
  "190": [8, 3],
  "191": [9, 3]
};

const HeldKeyCoords = types.model("HeldKeyCoords", {
  x: types.number,
  y: types.number
});

export const Editor = types
  .model("Editor", {
    ...ContextRepo.Mixin,
    ...ContextUser.Mixin,
    heldKeyCoords: types.maybe(HeldKeyCoords)
    // tree: Tree,
    // root: types.maybe(LinkCell),
    // currentView: types.optional(types.enumeration([TREE, LIST]), LIST)
  })
  .views(self => ({
    get user() {
      return self[ContextUser.Key];
    },
    get repo() {
      return self[ContextRepo.Key];
    },
    get repoCells() {
      return makeRepoCells(self.repo);
    },
    get searchCells() {
      return makeSearchCells(self.repo.links, self.user.input);
    },
    get selectedCell() {
      if (self.user.linkChooser) {
        return self.searchCells[self.user.linkChooser.selectedCellIndex];
      }

      return self.repoCells[self.user.selectedCellIndex];
    },
    get cursorCell() {
      return cursorify(self.selectedCell, self.user.input);
    },
    get cells() {
      if (self.user.linkChooser) {
        return self.searchCells.concat(self.cursorCell);
      }

      return self.repoCells.concat(self.cursorCell);

      // if (self.root) {
      //   return self.root.rootBoxes;
      // }
      // // TODO: switch on type here
      // return self.projection.boxes;
    }
  }))
  .actions(self => ({
    moveUp() {
      const { cells, user, selectedCell } = self;

      const gotoCellIndex = cells.findIndex(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x &&
          cell.y === selectedCell.y - 1
      );

      if (gotoCellIndex !== -1) {
        user.selectedCellIndex = gotoCellIndex;
      }
    },
    moveDown() {
      const { cells, user, selectedCell } = self;

      const gotoCellIndex = cells.findIndex(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x &&
          cell.y === selectedCell.y + 1
      );

      if (gotoCellIndex !== -1) {
        user.selectedCellIndex = gotoCellIndex;
      }
    },
    moveLeft() {
      const { cells, user, selectedCell } = self;

      const gotoCellIndex = cells.findIndex(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x - 2 &&
          cell.y === selectedCell.y
      );

      if (gotoCellIndex !== -1) {
        user.selectedCellIndex = gotoCellIndex;
      }
    },
    moveRight() {
      const { cells, user, selectedCell } = self;

      const gotoCellIndex = cells.findIndex(
        cell =>
          cell.selectable &&
          cell.x === selectedCell.x + 2 &&
          cell.y === selectedCell.y
      );

      if (gotoCellIndex !== -1) {
        user.selectedCellIndex = gotoCellIndex;
      }
    }
  }))
  .views(self => ({
    get keyMap() {
      const { selectedCell, user } = self;

      if (user.inputMode) {
        return {
          2: { 4: { label: "Input" }, 5: { label: "Mode" } }
        };
      }

      const { forLink, nodeIndex } = selectedCell;
      const {
        setInput,
        toggleChangeCellMode,
        toggleChangeOpMode,
        toggleAddNodeMode
      } = user;

      if (user.changeCellMode) {
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
                user.setChoosingLink(forLink);
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

      if (user.changeOpMode) {
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

      if (user.addNodeMode) {
        const selectNewCell = () => {
          const newSelectedCellIndex = self.repoCells.findIndex(
            cell =>
              cell.key === `CL-${forLink.linkId}-${forLink.nodes.length - 1}`
          );

          if (newSelectedCellIndex !== -1) {
            user.selectedCellIndex = newSelectedCellIndex;
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
          }
        };
      }

      if (user.linkChooser) {
        return {
          1: {
            2: { label: "▲", action: self.moveUp }
          },
          2: {
            1: { label: "◀", action: self.moveLeft },
            2: { label: "▼", action: self.moveDown },
            3: { label: "▶", action: self.moveRight }
          },
          3: {
            6: {
              label: "Cancel",
              action() {
                user.setChoosingLink(null);
              }
            }
          }
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

      if (selectedCell.gotoCellKey) {
        keyMap[2][7] = {
          label: "Go To Def",
          action() {
            const gotoCellIndex = self.cells.findIndex(
              cell => cell.key === selectedCell.gotoCellKey
            );

            if (gotoCellIndex !== -1) {
              user.selectCellIndex(gotoCellIndex);
            }

            return;
          }
        };
      }

      return keyMap;
    }
  }))
  .actions(self => ({
    handleInput(e) {
      const { value } = e.target;
      const { user } = self;

      if (user.linkChooser) {
        user.linkChooser.input = value;
        return;
      }

      user.input = value;
    },
    handleKeyPress(e) {
      const { keyCode } = e;

      // console.log(keyCode);

      const { user, selectedCell } = self;

      if (user.inputMode) {
        if (e.keyCode == 13) {
          selectedCell.forLink.setVal(selectedCell.nodeIndex, user.input);
          user.input = null;
          self.moveRight();
        }
        return;
      }

      const coords = keyLayout[keyCode]; // TODO: make key layout editable
      if (!coords) {
        return;
      }

      e.preventDefault();

      const [x, y] = coords;

      self.heldKeyCoords = { x, y };

      const YKeyMap = self.keyMap[y];
      if (YKeyMap) {
        const thisKey = YKeyMap[x];
        if (thisKey && thisKey.action) {
          thisKey.action();
        }
      }
    },
    handleKeyUp() {
      self.heldKeyCoords = null;
    }
  }))
  .actions(self => ({
    afterCreate() {
      document.addEventListener("keydown", self.handleKeyPress);
      document.addEventListener("keyup", self.handleKeyUp);
    },
    beforeDestroy() {
      document.removeEventListener("keydown", self.handleKeyPress);
      document.removeEventListener("keyup", self.handleKeyUp);
    }
  }));

export default Editor;
