// TODO: just merge this whole model into the editor model?

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

const LinkChooser = types.model("LinkChooser", {
  forLink: types.reference(Link),
  selectedCellIndex: types.optional(types.number, 0),
  input: types.optional(types.string, ""),
  inputMode: optionalBoolean
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
    // choosingLink: types.maybe(types.reference(Link))
    linkChooser: types.maybe(LinkChooser)
  })
  .views(self => ({
    get inputMode() {
      return self.input !== null;
    },
    get choosingLink() {
      return self.linkChooser;
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
    },
    setChoosingLink(forLink) {
      self.linkChooser = { forLink };
    }
  }));

export const ContextUser = setupContext(types.optional(User, {}));
