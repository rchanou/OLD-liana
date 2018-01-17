// TODO: just merge this whole model into the editor model?

import { types } from "mobx-state-tree";

import { setupContext } from "./context";

const User = types.model("User", {
  labelSet: types.optional(types.string, "en-US")
});

export const ContextUser = setupContext(types.optional(User, {}));
