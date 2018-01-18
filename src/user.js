import { types } from "mobx-state-tree";

import { makeContext } from "./context";

const LabelSet = types.model("LabelSet", {
  id: types.identifier(types.string),
  decs: types.optional(
    types.map(types.union(types.map(types.string), types.string)),
    {}
  )
});

const usLocale = "en-US";
const User = types.model("User", {
  labelSets: types.optional(types.map(LabelSet), {
    [usLocale]: { id: usLocale }
  }),
  currentLabelSet: types.optional(types.reference(LabelSet), usLocale)
});

export const ContextUser = makeContext(User);
