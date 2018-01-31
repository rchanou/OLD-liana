import { types } from "mobx-state-tree";

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

  const RefType = types
    .model(`Context${Model.name}Child`, {
      [contextRefKey]: Ref
    })
    .actions(self => ({
      postProcessSnapshot({ context, ...rest }) {
        return rest;
      }
    }));

  const refModel = (...args) => types.compose(RefType, types.model(...args));

  return {
    Type,
    defKey,
    key: contextRefKey,
    RefType,
    refModel,
    Ref
  };
};

export const mixinModel = (...Models) => (name, ...rest) => {
  const modelsToCompose = Models;
  if (rest.length) {
    modelsToCompose.push(types.model(...rest));
  }
  return types.compose(name, ...modelsToCompose);
};
