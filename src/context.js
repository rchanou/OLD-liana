import { types, isRoot, getParent } from "mobx-state-tree";

export const setupContext = (Model, key) => {
  if (typeof Model.name !== "string") {
    throw new Error("Name required for context model type!");
  }

  const KEY = key || `context${Model.name}`;
  const REFKEY = `${KEY}Ref`;

  let defaultContext;

  const getContext = node => {
    const context = node[KEY];

    if (context) {
      return context;
    }

    // TODO: should I leave in this defaultContext behavior?
    if (isRoot(node)) {
      if (defaultContext) {
        return defaultContext;
      }

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
    [KEY]: types.maybe(Model),
    [REFKEY]: Ref
  };

  const RefModel = types.model(`${Model.name}Ref`, Mixin).actions(self => ({
    postProcessSnapshot(snapshot) {
      delete snapshot[REFKEY];
      return snapshot;
    }
  }));

  const refModel = (...args) => types.compose(RefModel, types.model(...args));

  return { KEY, REFKEY, refModel, Ref, Mixin };
};
