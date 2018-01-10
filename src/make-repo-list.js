import { types } from "mobx-state-tree";

import { Link, Dependency } from "./core";

export const makeRepoCells = (repo, x = 0, y = 0) => {
  const cells = [];

  let currentX = x;
  let currentY = y - 1;

  repo.links.forEach(link => {
    const { linkId, nodes, out, label } = link;

    currentX = x;
    currentY++;

    const key = `CL-${linkId}`;

    cells.push({
      key,
      x: currentX,
      y: currentY,
      width: 2,
      selectable: true,
      text: label
    });

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      const key = `CL-${linkId}-${i}`;

      currentX += 2;

      const newCell = {
        key,
        x: currentX,
        y: currentY,
        width: 2,
        selectable: true,
        forLink: link,
        nodeIndex: i,
        text: node.label,
        fill: node.color
      };

      if (node.ref) {
        newCell.gotoCellKey = `CL-${node.ref.linkId}-0`;
      }

      cells.push(newCell);
    }

    currentX += 2;

    let text;
    if (out instanceof Error) {
      text = out.message;
    } else if (out === Dependency) {
      text = "...";
    } else if (typeof out === "function") {
      text = "func";
    } else {
      text = JSON.stringify(out);
    }

    cells.push({
      key: `${key}-V`,
      x: currentX,
      y: currentY,
      width: 2,
      selectable: false,
      text
    });
  });

  return cells;
};

const optionalBoolean = types.optional(types.boolean, false);

const NodeRef = types.model("NodeRef", {
  link: types.reference(Link),
  index: types.maybe(types.number)
});

const RepoLister = types
  .model("RepoLister", {
    selectedCellIndex: types.optional(types.number, 0),
    // settingNode: types.maybe(NodeRef),
    changeCellMode: optionalBoolean,
    changeOpMode: optionalBoolean,
    addNodeMode: optionalBoolean,
    addOpMode: optionalBoolean,
    input: types.maybe(types.string)
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
