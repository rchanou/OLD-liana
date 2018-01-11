import { types, isRoot, getParent } from "mobx-state-tree";

export const setupContext = (Model, key) => {
  if (typeof Model.name !== "string") {
    throw new Error("Name required for context model type!");
  }

  const Key = key || `context${Model.name}`;
  const RefKey = `${Key}Ref`;

  let defaultContext;

  const getContext = node => {
    const context = node[Key];

    if (context) {
      return context;
    }

    if (isRoot(node)) {
      if (defaultContext) {
        return defaultContext;
      }
      console.warn("say what", Key, RefKey);
      defaultContext = Model.create();
      return defaultContext;
      // throw new Error(`Could not find required Context ${Model.name}.`);
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
    [Key]: types.maybe(Model),
    [RefKey]: Ref
  };

  const RefMixin = {
    [RefKey]: Ref
  };

  return { Key, Model, Ref, Mixin, RefKey, RefMixin };
};
