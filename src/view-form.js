import { types } from "mobx-state-tree";

import { OpEnum, Link, Input, Dependency, ContextRepo } from "./core";

const BOOL = "B";
const NUM = "N";
const STRING = "S";

const ValForm = types
  .model("ValForm", {
    valType: types.enumeration("ValType", [BOOL, NUM, STRING]),
    boolVal: types.boolean,
    numVal: types.number,
    stringVal: types.string
  })
  .views(self => ({
    get val() {
      switch (self.valType) {
        case BOOL:
          return self.boolVal;
        case NUM:
          return self.numVal;
        case STRING:
          return self.stringVal;
      }
    }
  }));

const OpForm = types
  .model("OpForm", {
    search: types.string,
    op: types.optional(OpEnum, ".")
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

const RefForm = types
  .model("RefForm", {
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

const InputForm = types
  .model("InputForm", {
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

const DepForm = types
  .model("DepForm", {
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

const SubForm = types.union(ValForm, OpForm, RefForm, InputForm, DepForm);

export const LinkForm = types
  .model("LinkForm", {
    subForms: types.optional(types.array(SubForm), [])
  })
  .actions(self => ({
    addSubForm() {
      console.log("clock you");
      self.subForms.push({ search: "", op: "+" });
      // self.form.push({ ref: self.defaultRepoLink });
    }
  }));
