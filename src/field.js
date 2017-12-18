import { types } from "mobx-state-tree";

import { OpEnum, Op, ops, Link, Input, Dependency, ContextRepo } from "./core";
import { PosCell } from "./cell";

// placeholder prop for localizable labels
const presetText = text => types.optional(types.string, text);

const BOOL = "B";
const NUM = "N";
const STRING = "S";

// let idCounter = 0;
// const optionalId = types.optional(types.identifier(types.number), () => idCounter++);

const createFieldModel = (name, ...args) => types.compose(name, PosCell, types.model(...args));

export const BoolField = createFieldModel("BoolField", {
  // fieldId: optionalId,
  checked: types.boolean,
  label: presetText("True?")
});

export const NumField = createFieldModel("NumField", {
  // fieldId: optionalId,
  number: types.number,
  label: presetText("Value")
});

export const StringField = createFieldModel("StringField", {
  // fieldId: optionalId,
  string: types.string,
  label: presetText("Value")
});

const opList = ops.map(label => ({ value: label, label }));

export const OpField = createFieldModel("OpField", {
  // fieldId: optionalId,
  search: presetText(""),
  node: Op
  // op: types.optional(OpEnum, ".") // TODO: remove hard-coded default
})
  .views(self => ({
    get selected() {
      return self.op;
    },
    get options() {
      return opList;
    }
  }))
  .actions(self => ({
    handleSelect({ value }) {
      self.op = value;
    }
  }));

export const LinkField = createFieldModel("LinkField", {
  // fieldId: optionalId,
  repo: ContextRepo.Ref,
  search: types.string,
  linkRef: types.reference(Link)
})
  .views(self => ({
    get selected() {
      return self.linkRef.linkId;
    },
    get options() {
      return self.repo.linkList;
    }
  }))
  .actions(self => ({
    handleSelect({ value }) {
      self.linkRef = value;
    }
  }));

export const InputRefField = createFieldModel("InputField", {
  // fieldId: optionalId,
  repo: ContextRepo.Ref,
  search: types.string,
  inputRef: types.reference(Input)
})
  .views(self => ({
    get selected() {
      return self.inputRef.inputId;
    },
    get options() {
      return self.repo.inputList;
    }
  }))
  .actions(self => ({
    handleSelect({ value }) {
      self.inputRef = value;
    }
  }));

export const ValForm = createFieldModel("ValForm", {
  // TODO: this needs to be a radio form/set of fields
  valType: types.enumeration("ValType", [BOOL, NUM, STRING]),
  boolField: BoolField,
  numField: NumField,
  stringField: StringField
}).views(self => ({
  get val() {
    switch (self.valType) {
      case BOOL:
        return self.boolField.checked;
      case NUM:
        return self.numField.number;
      case STRING:
        return self.stringField.string;
    }
  }
}));

export const InputArg = createFieldModel("InputArg", {
  input: types.reference(Input),
  valForm: ValForm
});

export const RefForm = createFieldModel("RefForm", {
  linkField: LinkField,
  inputArgs: types.maybe(types.array(InputArg))
});

export const DepRefField = createFieldModel("DepField", {
  // fieldId: optionalId,
  repo: ContextRepo.Ref,
  search: types.string,
  depRef: types.reference(Dependency)
})
  .views(self => ({
    get selected() {
      return self.depRef.depId;
    },
    get options() {
      return self.repo.depList;
    }
  }))
  .actions(self => ({
    handleSelect({ value }) {
      self.depRef = value;
    }
  }));

export const LinkForm = types
  .model("LinkForm", {
    nodeFields: types.optional(types.array(types.union(ValForm, RefForm, OpField, InputRefField, DepRefField)), []),
    x: types.optional(types.number, 0),
    y: types.optional(types.number, 0)
  })
  .actions(self => ({
    addNodeField() {
      const { nodeFields } = self;

      const lastNodeField = nodeFields[nodeFields.length - 1];

      nodeFields.push({
        op: ".",
        x: lastNodeField.x,
        y: lastNodeField.y + 1
      }); // TODO: remove hard-code
    },
    afterCreate() {
      self.nodeFields.push({
        node: { op: "." },
        x: self.x,
        y: self.y
      });
    }
  }));

export const Field = types.union(BoolField, NumField, StringField, OpField, InputRefField, LinkField, DepRefField);
