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

      if (!snapshot[KEY]) {
        delete snapshot[KEY];
      }

      return snapshot;
    }
  }));

  const refModel = (...args) => types.compose(RefModel, types.model(...args));

  return { KEY, REFKEY, refModel, Ref, Mixin };
};

export const makeContext = Model => {
  if (typeof Model.name !== "string") {
    throw new Error("Name required for context model type!");
  }

  const defKey = `def${Model.name}`;
  const contextRefKey = `context${Model.name}`;

  const Context = types.model(`Context${Model.name}`, {
    _id: types.optional(types.identifier(types.number), 0)
  });

  const Type = types.compose(Model, Context);

  const Ref = types.optional(types.union(Type, types.reference(Type)), 0);

  const RefModel = types
    .model(`Context${Model.name}Child`, {
      [contextRefKey]: Ref
    })
    .actions(self => ({
      postProcessSnapshot({ context, ...rest }) {
        return rest;
      }
    }));

  const refModel = (...args) => types.compose(RefModel, types.model(...args));

  return {
    Type,
    defKey,
    key: contextRefKey,
    refModel
  };
};
