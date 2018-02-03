import { strictEqual, deepStrictEqual } from "assert";
import { types } from "mobx-state-tree";

import { ContextEngine } from "./core";
import { pack, unpack, inflate } from "./pack";
import { optionalModel, incrementLetterId } from "./model-utils";
import { engine, user } from "./_test-data";

const t = ContextEngine.create(engine);
window.t = t;
strictEqual(t.run("c")(3), 5);
strictEqual(t.run("e")(3)(5)(7), 15);
strictEqual(t.run("n")(11, 60), 61);
const counter = t.run("o");
strictEqual(counter(), 0);
strictEqual(counter(5), 5);
strictEqual(counter(5, { type: "INCREMENT" }), 6);
strictEqual(counter(5, { type: "DECREMENT" }), 4);
strictEqual(counter(5, { type: "Invalid action!" }), 5);

const packTest = pack(engine.main);
// console.log(packTest);
const unpackTest = unpack(packTest);
// console.log(unpackTest);
// window.n = Engine.create({ main: unpackTest });
const packLen = JSON.stringify(packTest).length;
const fullLen = JSON.stringify(unpackTest).length;
console.log(fullLen, packLen, packLen / fullLen);

strictEqual(incrementLetterId("a"), "b");
strictEqual(incrementLetterId("z"), "a0");
strictEqual(incrementLetterId("a0"), "a1");
strictEqual(incrementLetterId("a1"), "a2");
strictEqual(incrementLetterId("zz"), "a00");
strictEqual(incrementLetterId("a0z"), "a10");
strictEqual(incrementLetterId("dog"), "doh");

const B = types.model("B", { a: types.string, z: types.number });
const PrivTest = optionalModel("A", {
  b: "default",
  c: 3,
  d: NaN,
  e: types.optional(types.number, () => 7),
  f: types.optional(types.array(types.string), ["a", "b", "c"]),
  g: 0,
  h: types.optional(types.string, ""),
  i: types.optional(B, { z: 5, a: "what" }),
  j: false,
  k: true
});
const privStore = PrivTest.create({ d: 2 });
const privSnapshot = privStore.toJSON();
strictEqual(privStore.b, "default");
deepStrictEqual(privSnapshot, { d: 2, e: 7 });
// TODO: assert throws for erroneous private models
