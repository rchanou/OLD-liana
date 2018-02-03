import { types } from "mobx-state-tree";

import { makeContext, privateModel } from "./context";

const NameSet = types
  .model("LabelSet", {
    id: types.identifier(types.string),
    names: types.optional(types.map(types.string), {})
  })
  .actions(self => ({
    setName(path, value) {
      self.names.set(String(path.slice()), value);
    }
  }));

const usLocale = "en-US";
const User = privateModel("User", {
  nameSets: types.optional(types.map(NameSet), {
    [usLocale]: { id: usLocale }
  }),
  currentNameSet: types.optional(types.reference(NameSet), usLocale)
}).views(self => ({
  pathName(path) {
    if (typeof path === "string") {
      if (path === "R") {
        return "←";
      }
      return self.currentNameSet.names.get(path) || path;
    }
    path = path.slice();
    if (path[path.length - 1] === "R") {
      return "←";
    }
    return self.currentNameSet.names.get(path) || `(${path})`;
  }
}));

export const ContextUser = makeContext(User);
export const ContextUserReader = privateModel("ContextUserReader", {
  user: ContextUser
});
