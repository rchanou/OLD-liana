import React from "react";
import { autorun } from "mobx";
import { Observer } from "mobx-react";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import * as L from "../src/core";
import Meta from "../src/meta";
import ViewTree from "../src/view-tree";
import ViewList from "../src/view-list";
import Editor, { LIST } from "../src/view-editor";

import ViewEditor from "../src/view-editor-react";

import Tree from "../src/view-tree-react";

const testDep = "https://unpkg.com/redux@3.7.2/dist/redux.min.js";

const simpleSnapshot = {
  context: {
    user: {
      labelSet: 'arstrsta'
    }
  },
  dependencies: {
    0: {
      depId: "0",
      path: testDep
    }
  },
  links: {
    0: { fartrsat: 'astr', linkId: "0", nodes: [{ op: "g" }, { val: "Math" }] },
    1: { linkId: "1", nodes: [{ op: "." }, { ref: "0" }, { val: "pow" }] },
    2: { linkId: "2", nodes: [{ ref: "1" }, { input: "n" }, { val: 2 }] },
    3: { linkId: "3", nodes: [{ ref: "2" }, { val: 5 }] },
    4: { linkId: "4", nodes: [{ ref: "2" }, { val: 12 }] },
    5: { linkId: "5", nodes: [{ op: "+" }, { ref: "3" }, { ref: "4" }] },
    6: { linkId: "6", nodes: [{ op: "." }, { ref: "0" }, { val: "sqrt" }] },
    7: { linkId: "7", nodes: [{ ref: "6" }, { ref: "5" }] },
    8: { linkId: "8", nodes: [{ op: "." }, { dep: "0" }, { val: "createStore" }] },
    9: { linkId: "9", nodes: [{ op: "." }, { input: "1" }, { val: "type" }] },
    10: { linkId: "10", nodes: [{ op: "+" }, { input: "2" }, { val: 1 }] },
    "10a": { callId: "10a", link: "10" },
    11: { linkId: "11", nodes: [{ op: "+" }, { input: "3" }, { val: -1 }] },
    "11a": { callId: "11a", link: "11" },
    12: {
      linkId: "12",
      nodes: [{ op: "s" }, { ref: "9" }, { val: "INCREMENT" }, { call: "10a" }, { val: "DECREMENT" }, { call: "11a" }]
    },
    13: { linkId: "13", nodes: [{ ref: "12" }, { input: "0" }] },
    14: { callId: "14", link: "13" },
    15: { linkId: "15", nodes: [{ ref: "8" }, { call: "14" }] }
  }
};

const simpleMetaSnapshot = {
  linkLabelSets: {
    standard: {
      0: { labelId: "0", targetId: "0", groupId: "standard", text: "Math" },
      1: { labelId: "1", targetId: "1", groupId: "standard", text: "power" },
      2: { labelId: "2", targetId: "2", groupId: "standard", text: "square" },
      3: { labelId: "3", targetId: "3", groupId: "standard", text: "5²" },
      4: { labelId: "4", targetId: "4", groupId: "standard", text: "12²" },
      5: { labelId: "5", targetId: "5", groupId: "standard", text: "5² + 12²" },
      6: { labelId: "6", targetId: "6", groupId: "standard", text: "√" },
      7: { labelId: "7", targetId: "7", groupId: "standard", text: "hypotenuse for 5 and 12" },
      8: { labelId: "8", targetId: "8", groupId: "standard", text: "create store" },
      9: { labelId: "9", targetId: "9", groupId: "standard", text: "action type" },
      10: { labelId: "10", targetId: "10", text: "increment", groupId: "standard" },
      11: { labelId: "11", targetId: "11", text: "decrement", groupId: "standard" },
      12: { labelId: "12", targetId: "12", text: "updater", groupId: "standard" },
      13: { labelId: "13", targetId: "13", text: "counter reducer", groupId: "standard" },
      15: { labelId: "15", targetId: "15", text: "counter store", groupId: "standard" }
    }
  },
  inputLabelSets: {
    standard: {
      0: { labelId: "0", text: "state" },
      1: { labelId: "1", text: "action" }
    }
  }
};

const testRoot = "15";

const simpleTree = {
  rootLink: testRoot,
  openPaths: {
    7: true
  },
  selectedPath: [testRoot],
  selectedIndex: 0
};

const simpleEditor = Editor.create(
  {
    [L.Repo.Key]: simpleSnapshot,
    tree: simpleTree,
    currentView: LIST
  },
  {
    system: SystemJS,
    meta: Meta.create(simpleMetaSnapshot),
    keyMap: {
      70: "up",
      82: "left",
      83: "down",
      84: "right",
      69: "open",
      78: "open"
    }
  }
);

window.s = simpleEditor

const params = new Map(
  Object.entries({
    0: 4,
    1: { type: "INCREMENT" }
  })
);

autorun(() => {
  window.a = simple.links.get("14").val;
});

autorun(() => {
  0 &&
    console.table(
      simpleEditor.boxes.map(n => ({
        key: n.key,
        size: n.size,
        text: n.text
      }))
    );
});

class Test extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <ViewEditor editor={simpleEditor} />;
    return <Observer>{() => <Tree boxes={simpleEditor.tree.boxes} />}</Observer>;
  }
}

storiesOf("Liana", module).add("default", () => <Test />);
