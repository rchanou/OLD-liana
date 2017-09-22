import { getSnapshot } from "mobx-state-tree";
import { autorun } from "mobx";

import * as L from "./liana-core";
// import { pull } from "./liana-core/utils";
// import { import as pull } from "systemjs";
const system = require("systemjs");

// Error.stackTraceLimit = 100;
// it("pulls and caches deps", async () => {
//   return;
//   const depIds = ["https://unpkg.com/redux@3.7.2/dist/redux.min.js"];
//   const deps = await pull(depIds);
// });

it("does stuff", async () => {
  const testDep = "https://unpkg.com/redux@3.7.2/dist/redux.min.js";
  // const testPkg = await pull(testDep);
  const graphView = L.GraphView.create(
    {
      graph: {
        packages: {
          0: { id: 0, path: testDep }
        },
        links: {
          0: { id: "0", link: [{ op: "g" }, { val: "Math" }] },
          1: { id: "1", link: [{ op: "." }, { ref: "0" }, { val: "pow" }] },
          2: { id: "2", link: [{ op: "." }, { ref: "0" }, { val: "sqrt" }] },
          3: { id: "3", link: [{ op: "g" }, { val: "console" }] },
          4: {
            id: "4",
            link: [{ subRef: "0" }, { in: "0" }, { val: null }, { in: "1" }]
          },
          5: {
            id: "5",
            link: [{ op: "[" }, { val: 1 }, { val: 3 }, { val: 5 }]
          },
          6: { id: "6", link: [{ ref: "4" }, { op: "+" }] },
          7: { id: "7", link: [{ ref: "1" }, { val: 3 }, { val: 2 }] },
          8: { id: "8", link: [{ ref: "1" }, { in: "2" }, { val: 4 }] },
          9: { id: "9", link: [{ ref: "8" }, { val: 3 }] },
          11: { id: "11", link: [{ val: 4 }] },
          12: { id: "12", link: [{ ref: "1" }, { ref: "11" }, { ref: "11" }] },
          13: { id: "13", link: [{ op: "+" }, { val: 3 }, { val: 5.4 }] },
          14: {
            id: "14",
            link: [{ op: "+" }, { in: "5" }, { in: "5" }, { in: "6" }]
          },
          15: {
            id: "15",
            link: [{ ref: 14 }, { val: 4.3 }, { val: 1.7 }, { val: 2.2 }]
          },
          16: {
            id: "16",
            link: [{ op: "[" }, { val: 3 }, { val: 5 }, { val: 7 }]
          },
          17: { id: "17", link: [{ op: "_" }] },
          18: { id: "18", link: [{ op: "." }, { ref: "17" }, { val: "map" }] },
          19: { id: "19", link: [{ op: "+" }, { in: "11" }, { val: 5.4 }] },
          20: { id: "20", link: [{ ref: "18" }, { ref: "5" }, { ref: "19" }] },
          21: { id: "21", link: [{ ref: "1" }, { in: "12" }, { val: 2 }] },
          22: {
            id: "22",
            link: [{ op: "." }, { ref: "17" }, { val: "spread" }]
          },
          23: { id: "23", link: [{ ref: "22" }, { op: "+" }] }
          // 24:{id:'24',link:[{ref:'23'},]}
        },
        subs: {
          0: {
            id: "0",
            sub: {
              0: [{ ref: "18" }, { param: 0 }, { ref: "21" }],
              1: [{ ref: "23" }, { subLink: 0 }],
              2: [{ ref: "2" }, { subLink: 1 }]
            }
          }
        }
      }
    },
    { system }
  );

  const { graph } = graphView;

  const getVal = id => graph.links.get(id).val;
  const a = getVal(18);
  const b = getVal(5);
  const c = getVal(19);
  const d = getVal(23);

  const subLink = graph.subs.get(0).sub.get(0)[0].ref.link;
  // console.log(subLink, 'le link')
  graphView.graph.expandSub("0", "24", { ref: "5" });
  const e = getVal("24-2");
  // console.log(e);

  // const snap = getSnapshot(graph.links);
  // console.log(JSON.stringify(snap));
  // console.log("le test", testPkg);
  autorun(() => {
    console.log("le pkg", graph.packages.get(0).val);
  });
});
