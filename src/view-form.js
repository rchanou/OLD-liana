import { types } from "mobx-state-tree";

import { Node, ContextRepo } from "./core";

export const Form = types
  .model("Form", {
    repo: ContextRepo.Ref,
    nodes: types.maybe(types.array(Node))
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
    }
  }));
