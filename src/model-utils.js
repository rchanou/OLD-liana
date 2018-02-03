import { types } from "mobx-state-tree";
import isEqual from "lodash.isequal";

export const makeContext = Model => {
  if (typeof Model.name !== "string") {
    throw new Error("Name required for context model type!");
  }
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
  return RefType;
};

export const mixinModel = (...Models) => (name, ...rest) => {
  const modelsToCompose = Models;
  if (rest.length) {
    modelsToCompose.push(types.model(...rest));
  }
  return types.compose(name, ...modelsToCompose);
};

export const optionalModel = (name, props, ...rest) => {
  const defaults = {};
  for (const propKey in props) {
    const prop = props[propKey];
    if (prop && typeof prop === "object") {
      if (!("defaultValue" in prop)) {
        throw new Error(
          "All types declared in a private model must be optional."
        );
      }
      defaults[propKey] = prop.defaultValue;
    } else {
      defaults[propKey] = prop;
    }
  }
  const PreModel = types.model(name, props, ...rest);
  return PreModel.actions(self => ({
    postProcessSnapshot(snapshot) {
      for (const key in defaults) {
        // a function as default strongly implies that it's meant to generate a new value everytime
        // so don't try to clean snapshot values for those properties
        if (
          !(typeof defaults[key] === "function") &&
          isEqual(snapshot[key], defaults[key])
        ) {
          delete snapshot[key];
        }
      }
      return snapshot;
    }
  }));
};

export const incrementLetterId = prev => {
  const next = [...prev];
  const addAtIndex = index => {
    const val = prev[index];
    if (val === "z") {
      next[index] = 0;
      if (index === 0) {
        next.splice(0, 0, "a");
      } else {
        addAtIndex(index - 1);
      }
    } else {
      const valAsInt = parseInt(val, 36);
      next[index] = (valAsInt + 1).toString(36);
    }
  };
  addAtIndex(prev.length - 1);
  return next.join("");
};
