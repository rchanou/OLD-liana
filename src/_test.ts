import { observable } from "mobx";

import * as C from "./core";
import { strictEqual as se, deepStrictEqual as dse } from "assert";

dse(1, 1);

const a = observable({ a: 1 });
const b = observable({
  b: 2,
  a
});
se(a, b.a);

const d = {
  a: [{ val: 1 }],
  b: [{ op: C.OpEnum.Add }, { val: 2 }, { val: 3 }],
  "c,R": [{ op: C.OpEnum.Add }, { scope: ["c"], index: 0 }, { val: 7 }]
};

const ge = (path: string[]) => C.gen(d, path);

const e = ge(["a"]);
se(e, 1);

const f = ge(["b"]);
se(f, 5);

const g = ge(["c", "R"]);
se(g(2), 9);
