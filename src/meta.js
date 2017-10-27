import { types } from "mobx-state-tree";

import { CallRef, Input, Link, LinkRef, Op, DepRef, Val } from "./core";

const optionalMap = type => types.optional(types.map(type), {});
const optionalString = types.optional(types.string, "");

export const Label = types.model("Label", {
  labelId: types.identifier(types.string),
  text: optionalString,
  targetId: optionalString,
  groupId: optionalString,
  locale: optionalString
});

export const Comment = types.model("Post", {
  postId: types.identifier(types.string),
  text: optionalString,
  targetId: optionalString
});

export const Meta = types
  .model("Meta", {
    linkLabelSets: optionalMap(optionalMap(Label)),
    inputLabelSets: optionalMap(optionalMap(Label)),
    linkComments: optionalMap(Comment),
    subLabels: optionalMap(Label),
    subComments: optionalMap(Comment),
    branchLabels: optionalMap(Label),
    branchComments: optionalMap(Comment),
    selectedLabelSet: types.optional(types.string, "standard")
  })
  .views(self => ({
    get linkLabelSet() {
      return self.linkLabelSets.get(self.selectedLabelSet);
    },
    get inputLabelSet() {
      return self.inputLabelSets.get(self.selectedLabelSet);
    }
  }));

export default Meta;
