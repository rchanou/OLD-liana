import React from "react";
import { autorun } from "mobx";
import { Observer } from "mobx-react";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
// import { linkTo } from "@storybook/addon-links";
// import { Button, Welcome } from "@storybook/react/demo";

import * as L from "../src/core";
import Meta from "../src/meta";
import ViewRepoTree from "../src/view-tree";
import ViewRepoList from "../src/view-list";
import ViewEditor from "../src/view-editor";

import Tree from "../src/view-tree-react";

const testDep = "https://unpkg.com/redux@3.7.2/dist/redux.min.js";

const simpleSnapshot = {
  dependencies: {
    0: {
      depId: "0",
      path: testDep
    }
  },
  links: {
    0: { linkId: "0", nodes: [{ op: "g" }, { val: "Math" }] },
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

// const withCalls = L.Repo.create(
//   {
//     links: {
//       0: { linkId: "0", nodes: [{ op: "g" }, { val: "Math" }] },
//       1: { linkId: "1", nodes: [{ op: "." }, { ref: "0" }, { val: "pow" }] },
//       2: { linkId: "2", nodes: [{ ref: "1" }, { input: "0" }, { val: 2 }] },
//       3: { callId: "3", link: "2", inputs: { 0: { val: 7 } } },
//       4: { linkId: "4", nodes: [{ ref: "2" }, { val: 12 }] },
//       5: { linkId: "5", nodes: [{ op: "+" }, { ref: "3" }, { ref: "4" }] },
//       6: { linkId: "6", nodes: [{ op: "." }, { ref: "0" }, { val: "sqrt" }] },
//       7: { linkId: "7", nodes: [{ ref: "6" }, { ref: "5" }] }
//     },
//     linkLabelSets: {
//       standard: {
//         0: { labelId: "0", text: "Math" },
//         1: { labelId: "1", text: "power" },
//         2: { labelId: "2", text: "square" },
//         3: { labelId: "3", text: "square of 5" },
//         4: { labelId: "4", text: "square of 12" },
//         5: { labelId: "5", text: "sum of squares of 5 and 12" },
//         6: { labelId: "6", text: "square root" },
//         7: { labelId: "7", text: "hypotenuse of 5 and 12" }
//       }
//     }
//   },
//   { system: SystemJS }
// );

// const graph = L.Repo.create(
//   {
//     dependencies: {
//       0: { depId: "0", path: testDep },
//       1: { depId: "1", path: "https://unpkg.com/lodash@4.17.4/lodash.js" }
//     },
//     links: {
//       0: { linkId: "0", nodes: [{ op: "g" }, { val: "Math" }] },
//       1: { linkId: "1", nodes: [{ op: "." }, { ref: "0" }, { val: "pow" }] },
//       2: { linkId: "2", nodes: [{ op: "." }, { ref: "0" }, { val: "sqrt" }] },
//       3: { linkId: "3", nodes: [{ op: "g" }, { val: "console" }] },
//       "3b": { linkId: "3b", nodes: [{ op: "." }, { ref: "3" }, { val: "log" }] },
//       "3a": { linkId: "3a", nodes: [{ ref: "3b" }, { val: "hello world" }] },
//       4: {
//         linkId: "4",
//         nodes: [{ subRef: "0" }, { input: "a" }, { val: null }, { input: "a" }]
//       },
//       5: {
//         linkId: "5",
//         nodes: [{ op: "[" }, { val: 1 }, { val: 3 }, { val: 5 }]
//       },
//       6: { linkId: "6", nodes: [{ ref: "4" }, { op: "+" }] },
//       7: { linkId: "7", nodes: [{ ref: "1" }, { val: 3 }, { val: 2 }] },
//       8: { linkId: "8", nodes: [{ ref: "1" }, { input: "a" }, { val: 4 }] },
//       9: { linkId: "9", nodes: [{ ref: "8" }, { val: 3 }] },
//       11: { linkId: "11", nodes: [{ val: 4 }] },
//       12: {
//         linkId: "12",
//         nodes: [{ ref: "1" }, { ref: "11" }, { ref: "11" }]
//       },
//       13: { linkId: "13", nodes: [{ op: "+" }, { val: 3 }, { val: 5.4 }] },
//       14: {
//         linkId: "14",
//         nodes: [{ op: "+" }, { input: "n" }, { input: "n" }, { input: "n" }]
//       },
//       15: {
//         linkId: "15",
//         nodes: [{ ref: 14 }, { val: 4.3 }, { val: 1.7 }, { val: 2.2 }]
//       },
//       16: {
//         linkId: "16",
//         nodes: [{ op: "[" }, { val: 3 }, { val: 5 }, { val: 7 }]
//       },
//       18: {
//         linkId: "18",
//         nodes: [{ op: "." }, { dep: "1" }, { val: "map" }]
//       },
//       19: { linkId: "19", nodes: [{ op: "+" }, { input: "a" }, { val: 5.4 }] },
//       20: {
//         linkId: "20",
//         nodes: [{ ref: "18" }, { ref: "5" }, { ref: "19" }]
//       },
//       21: { linkId: "21", nodes: [{ ref: "1" }, { input: "a" }, { val: 2 }] },
//       22: {
//         linkId: "22",
//         nodes: [{ op: "." }, { ref: "17" }, { val: "spread" }]
//       },
//       23: { linkId: "23", nodes: [{ ref: "22" }, { op: "+" }] },
//       24: { linkId: "24", nodes: [{ op: "+" }, { input: "a" }, { val: 1 }] },
//       25: { linkId: "25", nodes: [{ op: "+" }, { input: "a" }, { val: -1 }] },
//       26: { linkId: "26", nodes: [{ op: "." }, { input: "a" }, { val: "type" }] },
//       27: {
//         linkId: "27",
//         nodes: [{ op: "s" }, { ref: "26" }, { val: "INCREMENT" }, { ref: "24" }, { val: "DECREMENT" }, { ref: "25" }]
//       },
//       28: { linkId: "28", nodes: [{ ref: "27" }, { input: "a" }] },
//       29: { linkId: "29", nodes: [{ op: "==" }, { input: "a" }, { val: null }] },
//       30: {
//         linkId: "30",
//         nodes: [{ op: "?" }, { ref: "29" }, { val: 0 }, { ref: "28" }]
//       },
//       31: { linkId: "31", nodes: [{ op: "+" }, { input: "a" }, { val: 13 }] },
//       32: { linkId: "32", nodes: [{ val: 14 }] },
//       33: {
//         callId: "33",
//         link: "31",
//         inputs: { a: { val: 14 } }
//       },
//       34: { callId: "34", link: "31", inputs: {} }
//     },
//     subs: {
//       0: {
//         subId: "0",
//         nodes: {
//           0: [{ ref: "18" }, { param: 0 }, { ref: "21" }],
//           1: [{ ref: "23" }, { subLink: 0 }],
//           2: [{ ref: "2" }, { subLink: 1 }]
//         }
//       }
//     },
//     posts: {}
//   },
//   { system: SystemJS }
// );

// const { links } = withCalls;
// const getVal = id => graph.links.get(id).val;
// graph.expandSub("0", "24", { ref: "5" });
// const e = getVal("24-2");
// console.log(e);

const testRoot = "15";

const simple = L.Repo.create(simpleSnapshot, { system: SystemJS });

const simpleView = ViewRepoTree.create(
  {
    keyMap: {
      70: "up",
      82: "left",
      83: "down",
      84: "right",
      78: "open",
      69: "open"
    },
    rootLink: testRoot,
    openPaths: {
      7: true
    },
    selectedPath: [testRoot],
    selectedIndex: 0
  },
  {
    repo: simple,
    meta: Meta.create(simpleMetaSnapshot)
  }
);

// const list = ViewRepoList.create();

const params = new Map(
  Object.entries({
    0: 4,
    1: { type: "INCREMENT" }
  })
);

autorun(() => {
  window.a = simple.links.get("14").val;
  // console.log("ope", simpleView.openPaths.toJS());
});

autorun(() => {
  0 &&
    console.table(
      simpleView.boxes.map(n => ({
        key: n.key,
        // x: n.x,
        // y: n.y,
        size: n.size,
        // path: (n.downPath || n.path).join(","),
        text: n.text
        // selected: n.selected ? "X" : null,
        // link: n.category === L.Link ? n.upPath.join(",") : null
      }))
    );
});

// const nodes2 = simple.links.get(5).display();
// console.table(
//   nodes2.map(n => ({
//     key: n.key,
//     grp: n.group,
//     path: n.path.join(","),
//     // path: [...n.path, n.index].join("-"),
//     i: n.index,
//     text: n.text,
//     link: n.link
//   }))
// );

class Test extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <Observer>{() => <Tree nodes={simpleView.boxes} />}</Observer>;
  }
}

storiesOf("Liana", module).add("default", () => <Test />);

// storiesOf("Welcome", module).add("to Storybook", () => (
//   <Welcome showApp={linkTo("Button")} />
// ));

// storiesOf("Button", module)
//   .add("with text", () => (
//     <Button onClick={action("clicked")}>Hello Button</Button>
//   ))
//   .add("with some emoji", () => (
//     <Button onClick={action("clicked")}>😀 😎 👍 💯</Button>
//   ));
