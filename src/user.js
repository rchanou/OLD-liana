import { types } from "mobx-state-tree";

import { setupContext } from "./context";
import { Link } from "./core";

const optionalBoolean = types.optional(types.boolean, false);

// placeholder prop for localizable labels
// const presetText = text => types.optional(types.string, text);

const Cell = types
  .model("Cell", {
    // key: presetText("CURSOR"),
    // forCellKey: types.maybe(types.string),
    value: types.maybe(types.string),
    x: types.number,
    y: types.number,
    width: types.optional(types.number, 2),
    height: types.optional(types.number, 1),
    gotoCellKey: types.maybe(types.string),
    forLink: types.maybe(types.reference(Link)),
    nodeIndex: types.maybe(types.number)
  })
  .actions(self => ({
    setValue(value) {
      self.value = value;
    }
  }));

const NodeRef = types.model("NodeRef", {
  link: types.reference(Link),
  index: types.maybe(types.number)
});

const User = types
  .model("User", {
    selectedCellIndex: types.optional(types.number, 0),
    selectedCell: types.maybe(Cell),
    // settingNode: types.maybe(NodeRef),
    changeCellMode: optionalBoolean,
    addNodeMode: optionalBoolean,
    inputMode: optionalBoolean,
    changeOpMode: optionalBoolean
  })
  .actions(self => ({
    // setSelectedCellKey
    setSelectedCell(cell) {
      self.selectedCell = cell;
    },
    toggleAddNodeMode() {
      self.addNodeMode = !self.addNodeMode;
    },
    toggleInputMode() {
      self.selectedCell.value = "";
      self.inputMode = !self.inputMode;
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
    toggleChangeCellMode() {
      self.changeCellMode = !self.changeCellMode;
    },
    toggleChangeOpMode() {
      self.changeOpMode = !self.changeOpMode;
    }
  }));

export const ContextUser = setupContext(types.optional(User, {}));
