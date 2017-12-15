import { types, getParent } from "mobx-state-tree";

export const setupContext = (Model, key) => {
  if (typeof Model.name !== "string") {
    throw new Error("Name required for context model type!");
  }

  const Key = key || `context${Model.name}`;

  const getContext = node => {
    const context = node[Key];

    if (context) {
      return context;
    }

    const parent = getParent(node);
    if (parent) {
      return getContext(parent);
    }

    return null;
  };

  const Ref = types.optional(
    types.union(
      Model,
      types.reference(Model, {
        set(val) {
          return 0;
        },
        get(identifier, parent) {
          return getContext(parent);
        }
      })
    ),
    0
  );

  const Mixin = {
    [Key]: Model
  };

  return { Key, Model, Ref, Mixin };
};
