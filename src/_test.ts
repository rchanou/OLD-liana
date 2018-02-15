import { observable } from "mobx";

import * as C from "./core";
import { strictEqual as se, deepStrictEqual as dse } from "assert";

const g = window as any;

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
  "c,R": [add, { scope: "c" }, { val: 7 }],
  "d,R": [add, { scope: "d" }, { scope: "d", index: 1 }, { val: 11 }],
  "d1,R": [add, { ref: ["d1", "a"] }, { val: 10 }],
  "d1,a": [add, { scope: "d1" }, { val: 20 }],
  e: [{ ref: "d" }, { val: 6 }, { val: 8 }],
  f: [{ ref: "d" }, { val: -5 }, { val: -3 }],
  g: [add, { ref: "e" }, { ref: "f" }],
  "h,R,R": [add, { scope: "h" }, { scope: ["h", "R"] }],
  i: [{ ref: ["h", "R"] }, { val: 13 }],
  j: [{ ref: "i" }, { val: 5 }],
  k: [{ ref: "j" }, { val: 2 }]
};

g.ge = (path: string[]) => C.gen(d, path);
const { ge } = g;

g.e = ge("a");
se(g.e, 1);
se(g.e, ge("a"));

g.f = ge("b");
se(g.f, 5);

g.g = ge("c");
se(g.g(2), 9);

g.h = ge("d");
se(g.h(7, 9), 27);

se(ge("d1")(30), 60);

se(ge("e"), 25);
se(ge("f"), 3);
se(ge("g"), 28);

g.h = ge("h");
