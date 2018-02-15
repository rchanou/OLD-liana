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
  b: [{ op: C.OpEnum.Add }, { val: 2 }, { val: 3 }]
};

const e = C.gen(d, ["a"]);
se(e, 1);

const f = C.gen(d, ["b"]);
se(f, 5);
