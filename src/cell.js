import { types, getType, clone, destroy, detach } from "mobx-state-tree";

import { setupContext } from "./context";
import {
  Val,
  Op,
  OpEnum,
  ops,
  LinkRef,
  InputRef,
  DepRef,
  Link,
  Input,
  Dependency,
  ContextRepo
} from "./core";
import * as Color from "./color";

let idCounter = 0;
const optionalId = types.optional(
  types.identifier(types.number),
  () => idCounter++
);

const cellId = optionalId;

const makeKeyActions = keyMap => ({
  onKey(coords) {
    if (!coords) {
      return false;
    }

    const [kx, ky] = coords;

    const xActions = keyMap[kx];

    if (!xActions) {
      return false;
    }

    const action = xActions[ky];

    if (action) {
      action();
      return true;
    }

    return false;
  }
});

const Cell = types.model("Cell", {
  key: types.string,
  x: types.number,
  y: types.number,
  width: types.maybe(types.number),
  height: types.maybe(types.number),
  selected: types.maybe(types.boolean),
  selectable: types.maybe(types.boolean),
  text: types.maybe(types.string),
  color: types.maybe(types.string),
  kind: types.maybe(types.enumeration("CellKind", ["AddNode", "LinkRef"])),
  gotoCellKey: types.maybe(types.string)
});

const User = types
  .model("User", {
    selectedCell: types.maybe(Cell)
  })
  .actions(self => ({
    setSelectedCell(cell) {
      self.selectedCell = cell;
    }
  }));

export const ContextUser = setupContext(types.optional(User, {}));

export const LinkCell = types
  .model("LinkCell", {
    user: ContextUser.Ref,
    cellId,
    link: types.reference(Link),
    subCells: types.maybe(types.array(types.late(() => Cell))),
    opened: types.optional(types.boolean, true)
  })
  .views(self => ({
    get selected() {
      return self === self.user.selectedCell;
    },
    get rootBoxes() {
      return self.display({ root: true });
    },
    get rootBox() {
      const { rootBoxes } = self;

      return rootBoxes[rootBoxes.length - 1];
    },
    display(opts = {}) {
      const { link, subCells, selected } = self;
      const { linkId, nodes, color } = link;

      const {
        x = 0,
        y = 0,
        root = false,
        immediateNextIsRef = false,
        nextIsRef = false,
        isLast = true,
        siblingCount = 1
      } = opts;

      const allBoxes = [];

      let currentX = x;

      const siblings = subCells.length;

      for (let i = 0; i < siblings; i++) {
        const subCell = subCells[i];
        const { cellId, node, selected, link, opened } = subCell;
        const category = link ? (opened ? Link : LinkCell) : getType(node); // (HACK) TODO: try to remove this

        const defaultBox = {
          cellRef: subCell,
          text: link ? link.label : node.label,
          color: link ? link.color : node.color,
          key: cellId,
          x: currentX,
          y: y + 1,
          size: 1,
          root: false,
          selected,
          category,
          siblings
        };

        const makeRefCells = linkCell => {
          const innerLink = linkCell.link;
          const { color } = innerLink;

          if (!linkCell.opened) {
            const { label } = innerLink;
            allBoxes.push({
              ...defaultBox,
              text: label,
              color,
              size: 2
            });
            currentX += 2;
            return;
          }

          const isLast = i === subCells.length - 1;

          let immediateNextIsRef = false;
          let nextIsRef = false; // rename to "followedByRef" or something
          for (let k = i; k < siblings; k++) {
            // TODO: don't do this in loop, precompute instead
            const siblingIsLinkCell = Boolean(subCells[k].link);
            if (siblingIsLinkCell) {
              if (k === i + 1) {
                immediateNextIsRef = true;
              }
              nextIsRef = true;
              break;
            }
          }

          const refChildBoxes = linkCell.display({
            x: currentX,
            y: y + 1,
            color,
            immediateNextIsRef,
            nextIsRef,
            isLast,
            selected: linkCell.selected,
            siblingCount: siblings
          });
          allBoxes.push(...refChildBoxes);

          const { size } = refChildBoxes[refChildBoxes.length - 1];
          currentX += size;
        };

        switch (category) {
          case Link:
          case LinkCell:
            makeRefCells(subCell);
            break;
          case Op:
          case InputRef:
            allBoxes.push(defaultBox);
            currentX++;
            break;
          case Val:
            const { val } = subCell;
            const boxSize =
              typeof val === "string" ? Math.ceil(val.length / 6) : 1;
            allBoxes.push({
              ...defaultBox,
              size: boxSize
            });
            currentX += boxSize;
            break;
          case DepRef:
            allBoxes.push({
              ...defaultBox,
              size: 2
            });
            currentX += 2;
            break;
          default:
            throw new Error("A wild node type appeared!");
            allBoxes.push(defaultBox);
            currentX++;
        }
      }

      const { label } = link;
      // TODO: we need some crazy logic to make this more adaptable
      // or perhaps there's a much more elegant way of doing this that I'm not seeing currently
      const thisSize = nextIsRef
        ? Math.max(...allBoxes.map(n => n.x)) -
          x +
          (immediateNextIsRef ? 2 : allBoxes[allBoxes.length - 1].size + 1)
        : Math.max(...allBoxes.map(n => n.x + n.size)) - x;

      const thisNode = {
        cellRef: self,
        key: self.cellId,
        x,
        y,
        size: thisSize,
        color,
        text: label,
        category: Link,
        selected,
        siblings: siblingCount
      };
      allBoxes.push(thisNode);

      return allBoxes;
    }
  }))
  .actions(self => ({
    open() {
      if (!self.subCells) {
        // TODO: rename all ref props to "link"?
        self.subCells = self.link.nodes.map(
          node =>
            node.ref ? { opened: false, link: node.ref } : { node: clone(node) }
        );
      }

      self.opened = true;
    },
    close() {
      self.opened = false;
    },
    afterCreate() {
      if (self.opened) {
        self.open();
      }
    }
  }));

const LeafCell = types
  .model("LeafCell", {
    user: ContextUser.Ref,
    cellId,
    node: types.union(Val, Op, InputRef, DepRef)
  })
  .views(self => ({
    get selected() {
      return self === self.user.selectedCell;
    }
  }));

const PosCell = types
  .model("PosCell", {
    user: ContextUser.Ref,
    cellId,
    x: types.number,
    y: types.number,
    width: types.optional(types.number, 2),
    height: types.optional(types.number, 1),
    selectable: types.optional(types.boolean, true)
  })
  .views(self => ({
    get selected() {
      return self === self.user.selectedCell;
    }
  }))
  .actions(self => makeKeyActions());

const extendPosCell = (name, ...args) =>
  types.compose(name, PosCell, types.model(...args));

export const CellList = types
  .model("CellList", {
    user: ContextUser.Ref,
    repo: ContextRepo.Ref
  })
  .views(self => ({
    cells(x = 0, y = 0) {
      const selectedCellKey = self.user.selectedCell.key;

      const cells = [];

      let currentX = x;
      let currentY = y - 1;

      const { repo, user } = self;

      repo.links.forEach(link => {
        const { linkId, nodes, val, label } = link;

        currentX = x;
        currentY++;

        const key = `CL-${linkId}`;

        cells.push({
          key,
          x: currentX,
          y: currentY,
          width: 2,
          selected: selectedCellKey === key,
          selectable: false,
          text: label
          // keyGrid: {
          //   7: {
          //     2() {
          //       self.user.selectCell.key(key);
          //     }
          //   }
          // }
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
            selected: selectedCellKey === key,
            selectable: true,
            text: node.label,
            color: node.color
            // keyGrid: {
            //   7: {
            //     2() {
            //       self.user.selectCellKey(key);
            //     }
            //   }
            // }
          };
          if (node.ref) {
            newCell.gotoCellKey = `CL-${node.ref.linkId}-0`;
          }

          cells.push(newCell);
        }

        currentX += 2;

        const valType = typeof val;

        cells.push({
          key: `${key}-V`,
          x: currentX,
          y: currentY,
          width: 2,
          selected: selectedCellKey === key,
          selectable: false,
          text:
            valType === "function" ? "func" : valType === "object" ? "obj" : val
          // keyGrid: {
          //   7: {
          //     2() {
          //       self.user.selectCellKey(key);
          //     }
          //   }
          // }
        });
      });

      return cells;
    }
  }));

// placeholder prop for localizable labels
const presetText = text => types.optional(types.string, text);

const opList = ops.map(label => ({ value: label, label }));

const OpField = extendPosCell("OpField", {
  // op: types.optional(OpEnum, ".") // TODO: remove hard-coded default
  node: types.optional(Op, { op: "." }) // TODO: change name to op? uncomment above and use that instead?
})
  .views(self => ({
    get text() {
      return self.node.label;
    },
    get color() {
      return self.node.color;
    },
    get options() {
      return opList;
    }
  }))
  .actions(self =>
    makeKeyActions({
      7: {
        2() {
          const selectedOpIndex = ops.indexOf(self.node.op);
          let nextOpIndex = selectedOpIndex - 1;
          if (nextOpIndex === -1) {
            nextOpIndex = ops.length - 1;
          }
          self.node.op = ops[nextOpIndex];
        }
      },
      8: {
        2() {
          const selectedOpIndex = ops.indexOf(self.node.op);
          let nextOpIndex = selectedOpIndex + 1;
          if (nextOpIndex === ops.length) {
            nextOpIndex = 0;
          }
          self.node.op = ops[nextOpIndex];
        }
      }
    })
  );

const OpSelect = types.model("OpField", {
  node: types.optional(Op, { op: "." })
});

const BoolValField = extendPosCell("BoolValField", {
  node: types.optional(Val, { val: false })
})
  .views(self => ({
    get text() {
      return self.node.label;
    },
    get color() {
      return self.node.color;
    }
  }))
  .actions(self =>
    makeKeyActions({
      7: {
        2() {
          self.node.val = false;
        }
      },
      8: {
        2() {
          self.node.val = true;
        }
      }
    })
  );

const StringValField = extendPosCell("StringValField", {
  inputMode: types.optional(types.boolean, false),
  node: types.optional(Val, { val: "" })
})
  .views(self => ({
    get text() {
      if (self.inputMode) {
        return self.node.val;
      }
      ("–");
      return self.node.label;
    },
    get color() {
      return self.node.color;
    }
  }))
  .actions(self => ({
    setVal(newVal) {
      self.node.val = newVal;
    },
    leaveInputMode() {
      self.inputMode = false;
    }
  }))
  .actions(self =>
    makeKeyActions({
      8: {
        2() {
          self.inputMode = true;
        }
      }
    })
  );

const LinkRefField = extendPosCell("LinkRefField", {
  repo: ContextRepo.Ref,
  selectedlinkListIndex: types.optional(types.number, 0)
})
  .views(self => ({
    get node() {
      return { ref: self.selectedLink.linkId };
    },
    get selectedLink() {
      return self.repo.linkList[self.selectedlinkListIndex];
    },
    get text() {
      return self.selectedLink.label;
    },
    get color() {
      return self.selectedLink.color;
    }
  }))
  .actions(self =>
    makeKeyActions({
      7: {
        2() {
          let prevIndex = self.selectedlinkListIndex - 1;
          if (prevIndex === -1) {
            prevIndex = self.repo.linkList.length - 1;
          }
          self.selectedlinkListIndex = prevIndex;
        }
      },
      8: {
        2() {
          let nextIndex = self.selectedlinkListIndex + 1;
          if (nextIndex === self.repo.linkList.length) {
            nextIndex = 0;
          }
          self.selectedlinkListIndex = nextIndex;
        }
      }
    })
  );

const subFormList = [
  { node: { op: "." } },
  {}, // TODO: make more specific as I add more field types
  { node: { val: false } },
  { node: { val: "" } }
];
const subFormListLength = subFormList.length;
const subFormTypes = [OpField, BoolValField, StringValField, LinkRefField];

const NodeForm = extendPosCell("NodeForm", {
  subForm: types.maybe(types.union(OpSelect)),
  //   types.union(snap => {
  //     if (!snap) {
  //       return OpField;
  //     }

  //     const { node } = snap;

  //     if (!node) {
  //       // TODO: maybe change this (and model) to be more in line with rest...
  //       return LinkRefField;
  //     }

  //     if (node.op) {
  //       return OpSelect;
  //       return OpField;
  //     }

  //     const { val } = node;

  //     if (typeof val === "boolean") {
  //       return BoolValField;
  //     }

  //     if (typeof val === "string") {
  //       return StringValField;
  //     }
  //   }, ...subFormTypes)
  // ),
  text: presetText("insert type here"),
  color: "steelblue" // TODO: different color
})
  .views(self => ({
    boxes(x = 0, y = 0) {
      return;
    }
  }))
  .actions(self => {
    let subFormIndex = 0;

    const changeSubForm = shift => {
      if (self.subForm) {
        destroy(self.subForm);
      }

      subFormIndex += shift;

      if (subFormIndex >= subFormListLength) {
        subFormIndex = 0;
      } else if (subFormIndex < 0) {
        subFormIndex = subFormListLength - 1;
      }

      const newSubForm = subFormList[subFormIndex];

      self.subForm = {
        x: self.x,
        y: self.y + 1,
        ...newSubForm
      };
    };

    return {
      afterCreate() {
        changeSubForm(0);
      },
      ...makeKeyActions({
        7: {
          2() {
            changeSubForm(-1);
          }
        },
        8: {
          2() {
            changeSubForm(+1);
          }
        }
      })
    };
  });

const addButtonKey = "LFA";

export const LinkForm = types
  .model("LinkForm", {
    // editingLink:types.reference(Link),
    user: ContextUser.Ref
    // nodeForms: types.optional(types.array(NodeForm), [])
  })
  .views(self => ({
    cells(x = 0, y = 0) {
      const selectedCellKey = self.user.selectedCell.key;

      const cells = [];

      x += 2;

      cells.push({
        key: addButtonKey,
        x,
        y,
        width: 2,
        selected: selectedCellKey === addButtonKey,
        selectable: true,
        text: "Add Node",
        color: "green"
      });

      return cells;
    }
  }))
  .actions(self => ({
    addNodeField() {
      const { nodeForms } = self;

      const lastNodeField = nodeForms[nodeForms.length - 1];

      nodeForms.push({
        x: lastNodeField.x + 2,
        y: lastNodeField.y
      });
      self.addButton.x = self.addButton.x + 2;
      self.submitButton.x = self.submitButton.x + 2;
    }
  }));

// const AddNodeFormButton = extendPosCell("AddNodeFormButton", {
//   form: types.reference(LinkForm),
//   text: presetText("Add Node"),
//   color: presetText("green")
// })
//   .actions(self =>
//     makeKeyActions({
//       8: {
//         2: self.form.addNodeField
//       }
//     })
//   )
//   .actions(self => ({
//     // TODO: for testing only, remove
//     afterCreate() {
//       if (!self.user.selectedCell) {
//         self.user.selectedCell = self;
//       }
//     }
//   }));

let tempTestIdCounter = 0;
const SubmitLinkFormButton = extendPosCell("SubmitLinkFormButton", {
  repo: ContextRepo.Ref,
  form: types.reference(LinkForm),
  text: presetText("Submit Node"),
  color: presetText("orchid")
})
  .actions(self =>
    makeKeyActions({
      8: {
        2() {
          const nodes = self.form.detachNodes();
          console.log("dem nodes", nodes);
          self.repo.putLink({
            linkId: `L${tempTestIdCounter++}`,
            nodes: [{ op: "." }]
          });
        }
      }
    })
  )
  .actions(self => ({
    // TODO: for testing only, remove
    afterCreate() {
      if (!self.user.selectedCell) {
        self.user.selectedCell = self;
      }
    }
  }));

// export const Cell = types.union(
//   LinkCell,
//   LeafCell,
//   NodeForm,
//   ...subFormTypes,
//   AddNodeFormButton,
//   SubmitLinkFormButton
// );
