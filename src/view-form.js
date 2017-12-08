import { types } from "mobx-state-tree";

import { OpEnum, Link, Input, Node, ContextRepo, Dependency } from "./core";

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
  .views({
    get val() {}
  });

const OpForm = types.model("OpForm", {
  search: types.string,
  op: types.optional(OpEnum, ".")
});

const RefForm = types.model("RefForm", {
  search: types.string,
  linkRef: types.reference(Link)
});

const InputForm = types.model("InputForm", {
  search: types.string,
  inputRef: types.reference(Input)
});

const DepForm = types.model("DepForm", {
  search: types.string,
  depRef: types.reference(Dependency)
});

const SubForm = types.union(ValForm, OpForm, RefForm, InputForm, DepForm);

export const Form = types
  .model("Form", {
    repo: ContextRepo.Ref,
    nodes: types.maybe(types.array(SubForm))
  })
  .views(self => ({
    get fields() {
      if (!self.nodes) {
        return [];
      }

      const fields = [];

      self.nodes.forEach(node => {});

      return fields;
    }
  }))
  .actions(self => ({
    toggle() {
      if (self.nodes) {
        self.nodes = null;
      } else {
        self.nodes = [];
      }
    },
    addNode() {
      self.nodes.push({ op: "+" });
      // self.form.push({ ref: self.defaultRepoLink });
    },
    submit() {}
  }));
