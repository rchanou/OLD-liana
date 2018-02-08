import { types, getSnapshot } from "mobx-state-tree";
import isEqual from "lodash.isequal";

export const asContext = Model => {
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
  if (name) {
    return types.compose(name, ...modelsToCompose);
  }
  return types.compose(...modelsToCompose);
};

export const optionalModel = (nameOrPropDefs, propDefs) => {
  const PreModel =
    typeof nameOrPropDefs === "object"
      ? types.model(nameOrPropDefs)
      : types.model(nameOrPropDefs, propDefs);
  propDefs = typeof nameOrPropDefs === "object" ? nameOrPropDefs : propDefs;
  const defaults = {};
  for (const propKey in propDefs) {
    const propDef = propDefs[propKey];
    if (propDef && typeof propDef === "object") {
      if ("defaultValue" in propDef) {
        // a function as default strongly implies that it's meant to generate a new value everytime
        // so don't try to clean snapshot values for those properties
        if (typeof propDef.defaultValue !== "function") {
          defaults[propKey] = propDef.defaultValue;
        }
      } else {
        // hacky way of detecting maybe type
        if (propDef.name.endsWith(" | null)")) {
          defaults[propKey] = null;
        } else {
          throw new Error(
            `All properties in optionalModel must be optional. Fix prop ${propKey}.`
          );
        }
      }
    } else {
      defaults[propKey] = propDef;
    }
  }
  return PreModel.actions(self => ({
    postProcessSnapshot(snapshot) {
      for (const key in defaults) {
        if (isEqual(snapshot[key], defaults[key])) {
          delete snapshot[key];
        }
      }
      return snapshot;
    }
  }));
};

export const privateModel = (nameOrPropDefs, propDefs) => {
  const PreModel =
    typeof nameOrPropDefs === "object"
      ? types.model(nameOrPropDefs)
      : types.model(nameOrPropDefs, propDefs);
  propDefs = typeof nameOrPropDefs === "object" ? nameOrPropDefs : propDefs;
  for (const propKey in propDefs) {
    const propDef = propDefs[propKey];
    if (
      propDef &&
      typeof propDef === "object" &&
      !("defaultValue" in propDef) &&
      !propDef.name.endsWith(" | null)")
    ) {
      debugger;
      throw new Error(
        `All properties in privateModel must be optional. Fix prop ${propKey}.`
      );
    }
  }
  return PreModel.preProcessSnapshot(snapshot => {
    const shallowClone = { ...snapshot };
    for (const key in propDefs) {
      shallowClone[key] = null;
    }
    return shallowClone;
  }).actions(self => ({
    postProcessSnapshot(snapshot) {
      for (const key in propDefs) {
        delete snapshot[key];
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
