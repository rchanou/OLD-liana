import React from "react";
import { autorun } from "mobx";
import { getSnapshot } from "mobx-state-tree";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import { ContextRepo } from "../src/core";
import { ContextUser } from "../src/cell";
import { Editor, TREE, LIST } from "../src/view-editor";
import { ReactEditor } from "../src/view-editor-react";

const LOCAL_STORAGE_KEY = "LIANA";

const testDep = "https://unpkg.com/redux@3.7.2/dist/redux.min.js";

const simpleSnapshot = {
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
    }
  }
};

const testRoot = "7";
const testCellId = -1;

// const simpleTree = {
//   rootLink: testRoot,
//   openPaths: {
//     7: true
//   },
//   selectedPath: [testRoot],
//   selectedIndex: 0
// };

const keyMap = {
  70: "up",
  82: "left",
  83: "down",
  84: "right",
  69: "open",
  76: "changeView",
  78: "open",
  85: "create"
};

const defaultSnapshot = {
  [ContextRepo.Key]: simpleSnapshot,
  // tree: simpleTree,
  root: { cellId: testCellId, link: testRoot },
  // [ContextUser.Key]: {
  //   selectedCell: testCellId
  // },
  currentView: TREE,
  keyMap
};

const storedSnapshot = localStorage.getItem(LOCAL_STORAGE_KEY);

const snapshotToLoad = storedSnapshot ? JSON.parse(storedSnapshot) : defaultSnapshot;

const simpleEditor = Editor.create(
  { ...defaultSnapshot, keyMap },
  {
    system: SystemJS
  }
);

window.s = simpleEditor;

const saveSnapshot = () => {
  const snapshotToSave = getSnapshot(simpleEditor);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshotToSave));
};
window.g = () => getSnapshot(simpleEditor);

addEventListener("beforeunload", saveSnapshot);

const params = new Map(
  Object.entries({
    0: 4,
    1: { type: "INCREMENT" }
  })
);

autorun(() => {
  window.a = simpleEditor[ContextRepo.Key].links.get("13").val;
});

autorun(() => {
  0 &&
    console.table(
      simpleEditor.cells.map(n => ({
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
    return <ReactEditor editor={simpleEditor} />;
  }
}

storiesOf("Liana", module).add("default", () => <Test />);
