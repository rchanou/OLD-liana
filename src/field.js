import { types } from "mobx-state-tree";

import { OpEnum, Link, Input, Dependency, ContextRepo } from "./core";

// placeholder prop for localizable labels
const presetText = text => types.optional(types.string, text);

const BOOL = "B";
const NUM = "N";
const STRING = "S";

const valTypeEnum = types.enumeration("ValType", [BOOL, NUM, STRING]);

let idCounter = 0;
const optionalId = types.optional(
  types.identifier(types.number),
  () => idCounter++
);

const fieldModels = {
  ValTypeCheck: {
    checked: types.boolean,
    label: presetText("Value Type")
  },
  BoolVal: {
    checked: types.boolean,
    label: presetText("True?")
  },
  NumVal: {
    number: types.number,
    label: presetText("Value")
  },
  StringVal: {
    string: types.string,
    label: presetText("Value")
  }
};

export const Field = {};
const allModels = [];
for (const modelKey in fieldModels) {
  const newModel = types.model(modelKey, {
    fieldId: optionalId,
    ...fieldModels[modelKey]
  });
  Field[modelKey] = newModel;
  allModels.push(newModel);
}
Field.Model = types.union(...allModels);
