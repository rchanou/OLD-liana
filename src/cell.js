import { types, getType, clone, destroy, detach } from "mobx-state-tree";

import { setupContext } from "./context";
import { Val, Op, OpEnum, ops, LinkRef, InputRef, DepRef, Link, Input, Dependency, ContextRepo } from "./core";
import * as Color from "./color";

let idCounter = 0;
const optionalId = types.optional(types.identifier(types.number), () => idCounter++);

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

export const ContextUser = setupContext(
  types.optional(
    types
      .model("User", {
        selectedCell: types.maybe(types.reference(types.late(() => Cell)))
      })
      .actions(self => ({
        selectCellRef() {
          const { cellRef } = self.selectedCell;

          if (cellRef) {
            self.selectedCell = cellRef;
          }
        }
      })),
    {}
  )
);

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
            const boxSize = typeof val === "string" ? Math.ceil(val.length / 6) : 1;
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
        ? Math.max(...allBoxes.map(n => n.x)) - x + (immediateNextIsRef ? 2 : allBoxes[allBoxes.length - 1].size + 1)
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
          node => (node.ref ? { opened: false, link: node.ref } : { node: clone(node) })
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

const extendPosCell = (name, ...args) => types.compose(name, PosCell, types.model(...args));

// TODO: rename all cells
const NodeCell = extendPosCell("NodeCell", {
  node: types.union(Val, Op, InputRef, DepRef, LinkRef, Link),
  cellRef: types.maybe(types.reference(types.late(() => NodeCell)))
})
  .views(self => ({
    get text() {
      return self.node.label;
    },
    get color() {
      return self.node.color;
    },
    setPos(x, y) {
      self.x = x;
      self.y = y;
    }
  }))
  .actions(self =>
    makeKeyActions({
      7: {
        2: self.user.selectCellRef
      }
    })
  );

const LabelCell = types
  .model("LabelCell", {
    cellId,
    x: types.number,
    y: types.number,
    width: types.optional(types.number, 2),
    text: types.string,
    color: types.optional(types.string, "#eee") // TODO: remove hard-code
  })
  .views(self => ({
    get selected() {
      return false;
    },
    get selectable() {
      return false;
    },
    setPos(x, y) {
      self.x = x;
      self.y = y;
    }
  }));

export const CellList = types
  .model("CellList", {
    repo: ContextRepo.Ref,
    // TODO: make first cell/node a first class thingy?
    cells: types.optional(types.array(types.union(NodeCell, LabelCell)), []),
    x: types.optional(types.number, 0),
    y: types.optional(types.number, 0)
  })
  .actions(self => {
    let wrapMap = {};

    return {
      setPos(x, y) {
        let currentX = x - 1;
        let currentY = y - 1;

        self.cells.forEach(cell => {
          if (wrapMap[cell.cellId]) {
            currentX = x;
            currentY++;
          }

          cell.setPos(currentX, currentY);
          currentX += cell.width;
        });
      },
      afterCreate() {
        const linkCellMap = {};
        const linkCells = [];

        self.repo.links.forEach(link => {
          const { nodes, val, label } = link;

          self.cells.push({
            x: 0,
            y: 0,
            text: label
          });

          wrapMap[self.cells[self.cells.length - 1].cellId] = true;

          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            const nodeCell = {
              x: 0,
              y: 0,
              node: clone(node)
            };

            self.cells.push(nodeCell);

            if (i === 0) {
              linkCellMap[link.linkId] = self.cells[self.cells.length - 1];
            }
          }

          const valType = typeof val;

          self.cells.push({
            x: 0,
            y: 0,
            text: valType === "function" ? "func" : valType === "object" ? "obj" : JSON.stringify(val) || ""
          });
        });

        for (const cell of self.cells) {
          if (cell.node && cell.node.ref) {
            cell.cellRef = linkCellMap[cell.node.ref.linkId];
          }
        }

        self.setPos(self.x, self.y);
      }
    };
  });

// placeholder prop for localizable labels
const presetText = text => types.optional(types.string, text);

// const BOOL = "B";
// const NUM = "N";
// const STRING = "S";

// const createFieldModel = (name, ...args) => types.compose(name, NodeCell, types.model(...args));

// const BoolField = createFieldModel("BoolField", {
//   checked: types.boolean,
//   label: presetText("True?")
// });

// const NumField = createFieldModel("NumField", {
//   number: types.number,
//   label: presetText("Value")
// });

// const StringField = createFieldModel("StringField", {
//   string: types.string,
//   label: presetText("Value")
// });

const opList = ops.map(label => ({ value: label, label }));

const OpField = extendPosCell("OpField", {
  // op: types.optional(OpEnum, ".") // TODO: remove hard-coded default
  node: types.optional(Op, { op: "." })
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
window.o = OpField;
// const LinkField = createFieldModel("LinkField", {
//   repo: ContextRepo.Ref,
//   search: types.string,
//   linkRef: types.reference(Link)
// })
//   .views(self => ({
//     get selected() {
//       return self.linkRef.linkId;
//     },
//     get options() {
//       return self.repo.linkList;
//     }
//   }))
//   .actions(self => ({
//     handleSelect({ value }) {
//       self.linkRef = value;
//     }
//   }));

const LinkRefField = extendPosCell("LinkRefField", {
  repo: ContextRepo.Ref,
  selectedlinkListIndex: types.optional(types.number, 0)
  // node: types.maybe(types.reference(Link))
})
  .views(self => ({
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

// const InputRefField = createFieldModel("InputField", {
//   repo: ContextRepo.Ref,
//   search: types.string,
//   inputRef: types.reference(Input)
// })
//   .views(self => ({
//     get selected() {
//       return self.inputRef.inputId;
//     },
//     get options() {
//       return self.repo.inputList;
//     }
//   }))
//   .actions(self => ({
//     handleSelect({ value }) {
//       self.inputRef = value;
//     }
//   }));

// const ValForm = createFieldModel("ValForm", {
//   // TODO: this needs to be a radio form/set of fields
//   valType: types.enumeration("ValType", [BOOL, NUM, STRING]),
//   boolField: BoolField,
//   numField: NumField,
//   stringField: StringField
// }).views(self => ({
//   get val() {
//     switch (self.valType) {
//       case BOOL:
//         return self.boolField.checked;
//       case NUM:
//         return self.numField.number;
//       case STRING:
//         return self.stringField.string;
//     }
//   }
// }));

// const InputArg = createFieldModel("InputArg", {
//   input: types.reference(Input),
//   valForm: ValForm
// });

// const RefForm = createFieldModel("RefForm", {
//   linkField: LinkField,
//   inputArgs: types.maybe(types.array(InputArg))
// });

// const DepRefField = createFieldModel("DepField", {
//   repo: ContextRepo.Ref,
//   search: types.string,
//   depRef: types.reference(Dependency)
// })
//   .views(self => ({
//     get selected() {
//       return self.depRef.depId;
//     },
//     get options() {
//       return self.repo.depList;
//     }
//   }))
//   .actions(self => ({
//     handleSelect({ value }) {
//       self.depRef = value;
//     }
//   }));

const NodeForm = extendPosCell("NodeForm", {
  subForm: types.maybe(types.union(snap => (!snap || snap.node ? OpField : LinkRefField), OpField, LinkRefField)),
  text: presetText("insert type here"),
  color: "steelblue" // TODO: different color
})
  .actions(self => ({
    changeSubForm(newSubForm) {
      if (self.subForm) {
        destroy(self.subForm);
      }
      // console.log("say what brah");
      self.subForm = {
        x: self.x,
        y: self.y + 1,
        ...newSubForm
      };
    },
    afterCreate() {
      self.changeSubForm({ node: { op: "." } });
    }
  }))
  .actions(self =>
    makeKeyActions({
      7: {
        2() {
          const subFormType = getType(self.subForm);

          switch (subFormType) {
            case OpField:
              self.changeSubForm({});
              break;
            case LinkRefField:
              self.changeSubForm({ node: { op: "." } });
              break;
          }
        }
      }
    })
  );

export const LinkForm = types
  .model("LinkForm", {
    x: types.optional(types.number, 0),
    y: types.optional(types.number, 0),
    formId: optionalId,
    nodeFields: types.optional(types.array(NodeForm), []),
    addButton: types.maybe(types.late(() => LinkAddButton))
  })
  .views(self => ({
    get cells() {
      return [...self.nodeFields, ...self.nodeFields.map(field => field.subForm), self.addButton];
    }
  }))
  .actions(self => ({
    addNodeField() {
      const { nodeFields } = self;

      const lastNodeField = nodeFields[nodeFields.length - 1];

      nodeFields.push({
        x: lastNodeField.x + 2,
        y: lastNodeField.y
      });
      self.addButton.x = self.addButton.x + 2;
    },
    afterCreate() {
      const { x, y } = self;

      self.nodeFields.push({
        x,
        y
      });

      self.addButton = {
        form: self,
        x: x + 2,
        y
      };
    }
  }));

const LinkAddButton = extendPosCell("LinkAddButton", {
  form: types.reference(LinkForm),
  text: presetText("Add Node"),
  color: presetText("green")
})
  .actions(self =>
    makeKeyActions({
      7: {
        2: self.form.addNodeField
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

export const Cell = types.union(LinkCell, LeafCell, NodeCell, NodeForm, OpField, LinkRefField, LinkAddButton);
