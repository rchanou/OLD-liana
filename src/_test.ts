import { observable } from "mobx";

import * as C from "./core";
import { strictEqual as se, deepStrictEqual as dse } from "assert";

const glob = window as any;

dse(1, 1);

const a = observable({ a: 1 });
const b = observable({
  b: 2,
  a
});
se(a, b.a);

const add = { op: C.OpEnum.Add };

const d = {
  a: [{ val: 1 }],
  b: [add, { val: 2 }, { val: 3 }],
  "c,R": [add, { scope: ["c"] }, { val: 7 }],
  "d,R": [add, { scope: ["d"] }, { scope: ["d"], index: 1 }, { val: 11 }],
  e: [{ ref: ["d", "R"] }, { val: 6 }, { val: 8 }],
  f: [{ ref: ["d", "R"] }, { val: -5 }, { val: -3 }],
  g: [add, { ref: ["e"] }, { ref: ["f"] }],
  // h: [],
  // "h,R": [],
  "h,R,R": [add, { scope: ["h"] }, { scope: ["h", "R"] }],
  i: [{ ref: ["h"] }, { val: 13 }],
  j: [{ ref: ["i"] }, { val: 5 }],
  k: [{ ref: ["j"] }, { val: 2 }]
};

const ge = (path: string[]) => C.gen(d, path);
glob.ge = ge;

const e = ge(["a"]);
se(e, 1);

const f = ge(["b"]);
se(f, 5);

const g = ge(["c", "R"]);
se(g(2), 9);

const h = ge(["d", "R"]);
se(h(7, 9), 27);

se(ge(["e"]), 25);
se(ge(["f"]), 3);
se(ge(["g"]), 28);

// const i = ge(["i"]);
// glob.j = ge(["j"]);
// glob.k = ge(["k"]);
// console.log(glob.k);
glob.h = ge(["h"]);
