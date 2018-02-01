import { types } from "mobx-state-tree";

export const makeContext = Model => {
  if (typeof Model.name !== "string") {
    throw new Error("Name required for context model type!");
  }

  const defKey = `def${Model.name}`;
  const contextRefKey = `context${Model.name}`;

  const Context = types
    .model(`Context${Model.name}`, {
      _contextId: types.optional(types.identifier(types.number), 0)
    })
    .preProcessSnapshot(snapshot => {
      if ("_contextId" in snapshot) {
        throw new Error('_contextId is "private"; defining it is not allowed.');
      }
      return snapshot;
    })
    .actions(self => ({
      postProcessSnapshot(snapshot) {
        delete snapshot._contextId;
        return snapshot;
      }
    }));

  const ContextModel = types.compose(`Context${Model.name}`, Model, Context);

  const RefType = types.optional(
    types.union(
      // for some reason, in some cases, mobx-state-tree can't tell that 0 should be a reference
      // so define a dispatcher to help it out
      val => (val === 0 ? types.reference(ContextModel) : ContextModel),
      ContextModel,
      types.reference(ContextModel)
    ),
    0
  );

  const RefModel = types
    .model(`Context${Model.name}Child`, {
      [contextRefKey]: RefType
    })
    .actions(self => ({
      postProcessSnapshot(snapshot) {
        const clone = { ...snapshot };
        delete clone[contextRefKey];
        return clone;
      }
    }));

  return {
    Model: ContextModel,
    RefModel,
    RefType,
    defKey,
    key: contextRefKey
  };
};

export const mixinModel = (...Models) => (name, ...rest) => {
  const modelsToCompose = Models;
  if (rest.length) {
    modelsToCompose.push(types.model(...rest));
  }
  return types.compose(name, ...modelsToCompose);
};
