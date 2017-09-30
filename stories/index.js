import React from "react";
import { autorun } from "mobx";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
// import { linkTo } from "@storybook/addon-links";
// import { Button, Welcome } from "@storybook/react/demo";

import * as L from "../src/liana-core";
import { Tree } from "../src/liana-explorer";

const testDep = "https://unpkg.com/redux@3.7.2/dist/redux.min.js";

const simpleSnapshot = {
  links: {
    0: { linkId: "0", nodes: [{ op: "g" }, { val: "Math" }] },
    1: { linkId: "1", nodes: [{ op: "." }, { ref: "0" }, { val: "pow" }] },
    2: { linkId: "2", nodes: [{ ref: "1" }, { input: "n" }, { val: 2 }] },
    3: { linkId: "3", nodes: [{ ref: "2" }, { val: 5 }] },
    4: { linkId: "4", nodes: [{ ref: "2" }, { val: 12 }] },
    5: { linkId: "5", nodes: [{ op: "+" }, { ref: "3" }, { ref: "4" }] },
    6: { linkId: "6", nodes: [{ op: "." }, { ref: "0" }, { val: "sqrt" }] },
    7: { linkId: "7", nodes: [{ ref: "6" }, { ref: "5" }] }
  },
  linkLabels: {
    0: { labelId: "0", text: "Math" },
    1: { labelId: "1", text: "power" },
    2: { labelId: "2", text: "square" },
    3: { labelId: "3", text: "5²" },
    4: { labelId: "4", text: "12²" },
    5: { labelId: "5", text: "5² + 12²" },
    6: { labelId: "6", text: "√" },
    7: { labelId: "7", text: "hypotenuse for 5 and 12" }
  }
};

const simple = L.Repo.create(simpleSnapshot);

const withCalls = L.Repo.create({
  links: {
    0: { linkId: "0", nodes: [{ op: "g" }, { val: "Math" }] },
    1: { linkId: "1", nodes: [{ op: "." }, { ref: "0" }, { val: "pow" }] },
    2: { linkId: "2", nodes: [{ ref: "1" }, { input: "0" }, { val: 2 }] },
    3: { callId: "3", link: "2", inputs: { 0: { val: 7 } } },
    4: { linkId: "4", nodes: [{ ref: "2" }, { val: 12 }] },
    5: { linkId: "5", nodes: [{ op: "+" }, { ref: "3" }, { ref: "4" }] },
    6: { linkId: "6", nodes: [{ op: "." }, { ref: "0" }, { val: "sqrt" }] },
    7: { linkId: "7", nodes: [{ ref: "6" }, { ref: "5" }] }
  },
  linkLabels: {
    0: { labelId: "0", text: "Math" },
    1: { labelId: "1", text: "power" },
    2: { labelId: "2", text: "square" },
    3: { labelId: "3", text: "square of 5" },
    4: { labelId: "4", text: "square of 12" },
    5: { labelId: "5", text: "sum of squares of 5 and 12" },
    6: { labelId: "6", text: "square root" },
    7: { labelId: "7", text: "hypotenuse of 5 and 12" }
  }
});

const graph = L.Repo.create(
  {
    packages: {
      0: { id: 0, path: testDep }
    },
    links: {
      0: { linkId: "0", nodes: [{ op: "g" }, { val: "Math" }] },
      1: { linkId: "1", nodes: [{ op: "." }, { ref: "0" }, { val: "pow" }] },
      2: { linkId: "2", nodes: [{ op: "." }, { ref: "0" }, { val: "sqrt" }] },
      3: { linkId: "3", nodes: [{ op: "g" }, { val: "console" }] },
      "3b": { linkId: "3b", nodes: [{ op: "." }, { ref: "3" }, { val: "log" }] },
      "3a": { linkId: "3a", nodes: [{ ref: "3b" }, { val: "hello world" }] },
      4: {
        linkId: "4",
        nodes: [{ subRef: "0" }, { input: "a" }, { val: null }, { input: "a" }]
      },
      5: {
        linkId: "5",
        nodes: [{ op: "[" }, { val: 1 }, { val: 3 }, { val: 5 }]
      },
      6: { linkId: "6", nodes: [{ ref: "4" }, { op: "+" }] },
      7: { linkId: "7", nodes: [{ ref: "1" }, { val: 3 }, { val: 2 }] },
      8: { linkId: "8", nodes: [{ ref: "1" }, { input: "a" }, { val: 4 }] },
      9: { linkId: "9", nodes: [{ ref: "8" }, { val: 3 }] },
      11: { linkId: "11", nodes: [{ val: 4 }] },
      12: {
        linkId: "12",
        nodes: [{ ref: "1" }, { ref: "11" }, { ref: "11" }]
      },
      13: { linkId: "13", nodes: [{ op: "+" }, { val: 3 }, { val: 5.4 }] },
      14: {
        linkId: "14",
        nodes: [{ op: "+" }, { input: "n" }, { input: "n" }, { input: "n" }]
      },
      15: {
        linkId: "15",
        nodes: [{ ref: 14 }, { val: 4.3 }, { val: 1.7 }, { val: 2.2 }]
      },
      16: {
        linkId: "16",
        nodes: [{ op: "[" }, { val: 3 }, { val: 5 }, { val: 7 }]
      },
      17: { linkId: "17", nodes: [{ op: "_" }] },
      18: {
        linkId: "18",
        nodes: [{ op: "." }, { ref: "17" }, { val: "map" }]
      },
      19: { linkId: "19", nodes: [{ op: "+" }, { input: "a" }, { val: 5.4 }] },
      20: {
        linkId: "20",
        nodes: [{ ref: "18" }, { ref: "5" }, { ref: "19" }]
      },
      21: { linkId: "21", nodes: [{ ref: "1" }, { input: "a" }, { val: 2 }] },
      22: {
        linkId: "22",
        nodes: [{ op: "." }, { ref: "17" }, { val: "spread" }]
      },
      23: { linkId: "23", nodes: [{ ref: "22" }, { op: "+" }] },
      24: { linkId: "24", nodes: [{ op: "+" }, { input: "a" }, { val: 1 }] },
      25: { linkId: "25", nodes: [{ op: "+" }, { input: "a" }, { val: -1 }] },
      26: { linkId: "26", nodes: [{ op: "." }, { input: "a" }, { val: "type" }] },
      27: {
        linkId: "27",
        nodes: [{ op: "s" }, { ref: "26" }, { val: "INCREMENT" }, { ref: "24" }, { val: "DECREMENT" }, { ref: "25" }]
      },
      28: { linkId: "28", nodes: [{ ref: "27" }, { input: "a" }] },
      29: { linkId: "29", nodes: [{ op: "==" }, { input: "a" }, { val: null }] },
      30: {
        linkId: "30",
        nodes: [{ op: "?" }, { ref: "29" }, { val: 0 }, { ref: "28" }]
      },
      31: { linkId: "31", nodes: [{ op: "+" }, { input: "a" }, { val: 13 }] },
      32: { linkId: "32", nodes: [{ val: 14 }] },
      33: {
        callId: "33",
        link: "31",
        inputs: { a: { val: 14 } }
      },
      34: { callId: "34", link: "31", inputs: {} }
    },
    subs: {
      0: {
        subId: "0",
        nodes: {
          0: [{ ref: "18" }, { param: 0 }, { ref: "21" }],
          1: [{ ref: "23" }, { subLink: 0 }],
          2: [{ ref: "2" }, { subLink: 1 }]
        }
      }
    },
    posts: {}
  },
  { system: SystemJS }
);

const { links } = withCalls;
console.log("hmm", links.get(2).val(12));
console.log("hmm", links.get(3).val);
// console.log("dep", simple.dependents("2"));
const getVal = id => graph.links.get(id).val;
// const a = getVal(18);
// const b = getVal(5);
// const c = getVal(19);
// const d = getVal(23);
// const subLink = graph.subs.get(0).sub.get(0)[0].ref.link;
// console.log(subLink, 'le link')
graph.expandSub("0", "24", { ref: "5" });
const e = getVal("24-2");
console.log(e);

const simpleView = L.Viewport.create({
  // ...simpleSnapshot,
  rootLink: "7",
  expandedLinks: {}
});

// console.log(getVal("32"));
// const f = graph.calls.get(0).val;
// console.log("fff", f);
// const g = graph.calls.get(1).val;
// console.log("say what", g, g(37));
// const snap = getSnapshot(graph.links);
// console.log(JSON.stringify(snap));
// console.log("le test", testPkg);
// autorun(() => {
//   console.log("le pkg", graph.packages.get(0).with());
// });

const nodes = simpleView.display(simple);

console.table(
  nodes.map(n => ({
    key: n.key,
    path: n.path.join(","),
    text: n.text,
    link: n.link
  }))
);

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
    return <Tree nodes={nodes} />;
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
