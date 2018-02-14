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
