import { types } from "mobx-state-tree";

import { makeContext } from "./context";

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
const User = types
  .model("User", {
    nameSets: types.optional(types.map(NameSet), {
      [usLocale]: { id: usLocale }
    }),
    currentNameSet: types.optional(types.reference(NameSet), usLocale)
  })
  .views(self => ({
    pathName(path) {
      if (typeof path === "string") {
        return self.currentNameSet.names.get(path) || "";
      }
      return self.currentNameSet.names.get(path.slice()) || "";
    }
  }));

export const ContextUser = makeContext(User);
