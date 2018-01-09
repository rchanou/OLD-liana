import { types } from "mobx-state-tree";

import { setupContext } from "./context";
import { Link } from "./core";

const optionalBoolean = types.optional(types.boolean, false);

const NodeRef = types.model("NodeRef", {
  link: types.reference(Link),
  index: types.maybe(types.number)
});

const HeldKeyCoords = types.model("HeldKeyCoords", {
  x: types.number,
  y: types.number
});

const User = types
  .model("User", {
    selectedCellIndex: types.optional(types.number, 0),
    heldKeyCoords: types.maybe(HeldKeyCoords),
    // settingNode: types.maybe(NodeRef),
    changeCellMode: optionalBoolean,
    changeOpMode: optionalBoolean,
    addNodeMode: optionalBoolean,
    addOpMode: optionalBoolean,
    input: types.maybe(types.string),
    chooseLinkMode: optionalBoolean
  })
  .views(self => ({
    get inputMode() {
      return self.input !== null;
    }
  }))
  .actions(self => ({
    selectCellIndex(index) {
      self.selectedCellIndex = index;
    },
    setInput(value) {
      self.input = value;
    },
    toggleChangeCellMode() {
      self.changeCellMode = !self.changeCellMode;
    },
    toggleChangeOpMode() {
      self.changeOpMode = !self.changeOpMode;
    },
    toggleAddNodeMode() {
      self.addNodeMode = !self.addNodeMode;
    },
    beginSettingNode(nodeRef) {
      self.settingNode = nodeRef;
    },
    setNode(value) {
      const { settingNode } = self;

      if (!settingNode) {
        return;
      }

      const { link, index } = settingNode;
      link.nodes[index].select(value);
    },
    endSettingNode() {
      self.settingNode = null;
    }
  }));

export const ContextUser = setupContext(types.optional(User, {}));
