import React from "react";
import { findDOMNode } from "react-dom";
import { autorun } from "mobx";
import { getSnapshot, destroy } from "mobx-state-tree";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import { ContextRepo } from "../src/core";
import { Editor /*TREE, LIST*/ } from "../src/editor";
import { Chooser } from "../src/chooser";

import { ReactEditor } from "../src/react-editor";

const LOCAL_STORAGE_KEY = "LIANA";

const testDep = "https://unpkg.com/redux@3.7.2/dist/redux.min.js";

const repo = {
  dependencies: {
    0: {
      depId: "0",
      path: testDep
    }
  },
  inputs: {
    0: { inputId: "0", labelSet: "state" },
    1: { inputId: "1", labelSet: "action" },
    2: { inputId: "2", labelSet: "x" },
    3: { inputId: "3" },
    n: { inputId: "n", labelSet: "base" }
  },
  links: {
    0: {
      linkId: "0",
      nodes: [{ op: "g" }, { val: "Math" }],
      labelSet: "Math"
    },
    1: {
      linkId: "1",
      nodes: [{ op: "." }, { ref: "0" }, { val: "pow" }],
      labelSet: "power"
    },
    2: {
      linkId: "2",
      nodes: [{ ref: "1" }, { input: "n" }, { val: 2 }],
      labelSet: "square"
    },
    3: {
      linkId: "3",
      nodes: [{ ref: "2" }, { val: 5 }],
      labelSet: "5²"
    },
    4: {
      linkId: "4",
      nodes: [{ ref: "2" }, { val: 12 }],
      labelSet: "12²"
    },
    5: {
      linkId: "5",
      nodes: [{ op: "+" }, { ref: "3" }, { ref: "4" }],
      labelSet: "5²+12²"
    },
    6: {
      linkId: "6",
      nodes: [{ op: "." }, { ref: "0" }, { val: "sqrt" }],
      labelSet: "√"
    },
    7: {
      linkId: "7",
      nodes: [{ ref: "6" }, { ref: "5" }],
      labelSet: "hypotenuse for 5 & 12"
    },
    8: {
      linkId: "8",
      nodes: [{ op: "." }, { dep: "0" }, { val: "createStore" }],
      labelSet: "create store"
    },
    9: {
      linkId: "9",
      nodes: [{ op: "." }, { input: "1" }, { val: "type" }],
      labelSet: "action type"
    },
    10: {
      linkId: "10",
      nodes: [{ op: "+" }, { input: "2" }, { val: 1 }],
      labelSet: "increment"
    },
    11: {
      linkId: "11",
      nodes: [{ op: "+" }, { input: "3" }, { val: -1 }],
      labelSet: "decrement"
    },
    12: {
      linkId: "12",
      nodes: [
        { op: "s" },
        { ref: "9" },
        { val: "INCREMENT" },
        { ref: "10", inputs: {} },
        { val: "DECREMENT" },
        { ref: "11", inputs: {} }
      ],
      labelSet: "updater"
    },
    13: {
      linkId: "13",
      nodes: [{ ref: "12" }, { input: "0" }],
      labelSet: "counter reducer"
    },
    15: {
      linkId: "15",
      nodes: [{ ref: "8" }, { ref: "13", inputs: {} }],
      labelSet: "counter store"
    },
    16: {
      linkId: "16",
      nodes: [{ op: "+" }, { val: "lol" }, { val: "no" }],
      labelSet: "test"
    },
    17: { linkId: "17", nodes: [{ op: "." }] },
    18: {
      linkId: "18",
      nodes: [{ op: "{" }, { val: "a" }, { val: 1 }, { val: "c" }, { val: 2 }]
    }
  }
};

// const testRoot = "7";
// const testCellId = -1;

// const simpleTree = {
//   rootLink: testRoot,
//   openPaths: {
//     7: true
//   },
//   selectedPath: [testRoot],
//   selectedIndex: 0
// };

// const editor = {
//   ...context,
//   [ContextKeyboard.Key]: {},
//   repoList: { selectedCellIndex: 75 }
//   // chooser: { forLink: "0" },
//   // tree: simpleTree,
//   // root: { cellId: testCellId, link: testRoot },
//   // currentView: TREE
// };

// TODO: finish implementing save
// const storedSnapshot = localStorage.getItem(LOCAL_STORAGE_KEY);

// const snapshotToLoad = storedSnapshot
//   ? JSON.parse(storedSnapshot)
//   : editor;
// const saveRepo = () => {
//   const snapshotToSave = getSnapshot(simpleEditor);
//   localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshotToSave));
// };
// addEventListener("beforeunload", saveRepo);

const context = {
  [ContextRepo.Key]: repo
};

const params = new Map(
  Object.entries({
    0: 4,
    1: { type: "INCREMENT" }
  })
);

window.g = store => getSnapshot(store);

const env = { system: SystemJS };

class Story extends React.Component {
  state = {};

  componentDidMount() {
    const dom = findDOMNode(this);

    const store = Editor.create(this.props.editor, { ...env, dom });

    if (!window.s) {
      window.s = store;
    }

    this.setState({ store });
  }

  render() {
    const { store } = this.state;

    if (!store) {
      return null;
    }

    return <ReactEditor editor={store} />;
  }
  componentWillUnmount() {
    destroy(this.state.store);
  }
}

storiesOf("Liana", module)
  .add("editor", () => (
    <Story
      editor={{
        ...context,
        repoList: { selectedCellIndex: 75 }
      }}
    />
  ))
  .add("editor in chooser", () => (
    <Story
      editor={{
        ...context,
        repoList: { selectedCellIndex: 75 },
        chooser: { forLink: "0" }
      }}
    />
  ));
