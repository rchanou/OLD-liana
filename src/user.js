import { types } from "mobx-state-tree";

import { makeContext } from "./context";

const NameSet = types.model("LabelSet", {
  id: types.identifier(types.string),
  names: types.optional(types.map(types.string), {})
  // decs: types.optional(types.map(types.union(types.map(types.string), types.string)), {})
});

const usLocale = "en-US";
const User = types
  .model("User", {
    nameSets: types.optional(types.map(NameSet), {
      [usLocale]: { id: usLocale }
    }),
    currentNameSet: types.optional(types.reference(NameSet), usLocale)
  })
  .views(self => ({
    pathName(path) {
      return self.currentNameSet.names.get(path);
    }
  }));

export const ContextUser = makeContext(User);
