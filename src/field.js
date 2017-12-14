import { types } from "mobx-state-tree";

import { OpEnum, Link, Input, Dependency, ContextRepo } from "./core";

// placeholder prop for localizable labels
const presetText = text => types.optional(types.string, text);

let idCounter = 0;
const optionalId = types.optional(
  types.identifier(types.number),
  () => idCounter++
);

export const ValTypeField = types.model("ValTypeField", {
  fieldId: optionalId,
  checked: types.boolean,
  label: presetText("Value Type")
});

export const BoolField = types.model("BoolField", {
  fieldId: optionalId,
  checked: types.boolean,
  label: presetText("True?")
});

export const NumField = types.model("NumField", {
  optionalId,
  number: types.number,
  label: presetText("Value")
});

export const StringField = types.model("StringField", {
  fieldId: optionalId,
  string: types.string,
  label: presetText("Value")
});

export const OpField = types
  .model("OpField", {
    fieldId: optionalId,
    search: types.string,
    op: types.optional(OpEnum, ".") // TODO: remove hard-coded default
  })
  .views(self => ({
    get selected() {
      return self.op;
    },
    get options() {
      return opLabels.map(label => ({ value: label, label }));
    }
  }))
  .actions(self => ({
    handleSelect({ value }) {
      self.op = value;
    }
  }));

export const LinkField = types
  .model("LinkField", {
    fieldId: optionalId,
    repo: ContextRepo.Ref,
    search: types.string,
    linkRef: types.reference(Link)
  })
  .views(self => ({
    get selected() {
      return self.linkRef.linkId;
    },
    get options() {
      return self.repo.links
        .entries()
        .map(link => ({ value: link.linkId, label: link.label }));
    }
  }))
  .actions(self => ({
    handleSelect({ value }) {
      self.linkRef = value;
    }
  }));

export const InputField = types
  .model("InputField", {
    fieldId: optionalId,
    repo: ContextRepo.Ref,
    search: types.string,
    inputRef: types.reference(Input)
  })
  .views(self => ({
    get selected() {
      return self.inputRef.inputId;
    },
    get options() {
      return self.repo.inputs
        .entries()
        .map(input => ({ value: input.inputId, label: input.label }));
    }
  }))
  .actions(self => ({
    handleSelect({ value }) {
      self.inputRef = value;
    }
  }));

export const DepField = types
  .model("DepField", {
    fieldId: optionalId,
    repo: ContextRepo.Ref,
    search: types.string,
    depRef: types.reference(Dependency)
  })
  .views(self => ({
    get selected() {
      return self.depRef.depId;
    },
    get options() {
      return self.repo.dependencies
        .entries()
        .map(dep => ({ value: dep.depId, label: dep.label }));
    }
  }))
  .actions(self => ({
    handleSelect({ value }) {
      self.depRef = value;
    }
  }));

export const Field = types.union(
  ValTypeField,
  BoolField,
  NumField,
  StringField,
  OpField,
  InputField,
  LinkField,
  DepField
);
