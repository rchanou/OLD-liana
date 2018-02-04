import { strictEqual, deepStrictEqual } from "assert";
import { types, getSnapshot } from "mobx-state-tree";

import { ContextEngine } from "./core";
import { pack, unpack, inflate } from "./pack";
import { optionalModel, incrementLetterId } from "./model-utils";
import { engine, user } from "./_test-data";

export const strictCreate = (Model, snapshot) => {
  const store = Model.create(snapshot);
  const postSnapshot = getSnapshot(store);
  const validate = (preSnap, postSnap) => {
    for (const prePropKey in preSnap) {
      const subPreSnap = preSnap[prePropKey];
      const subPostSnap = postSnap[prePropKey];
      if (typeof subPreSnap !== "object") {
        if (subPreSnap !== subPostSnap) {
          console.warn(`Possibly invalid: ${prePropKey}: ${subPreSnap}`);
        }
        continue;
      } else if (typeof subPostSnap !== "object") {
        console.warn(`Invalid object: ${prePropKey}`);
      } else {
        validate(subPreSnap, subPostSnap);
      }
    }
  };
  validate(snapshot, postSnapshot);
  return store;
};

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
const unpackStore = ContextEngine.create({ main: unpackTest });
window.u = unpackStore;

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

let idCounter = 0;
const DD = types.model("B", {
  id: types.optional(types.identifier(types.number), () => idCounter++),
  name: types.string
  // ref: types.reference(types.late(() => B))
});
const D = types.model("D", {
  // b: types.reference(B, id => ({ id, name: "flim flam" }))
  b: types.optional(DD, { name: "fuf" }),
  c: types.number,
  e: types.maybe(types.string)
});

const preSnap = { c: 5, na: "bruv", badObj: { zoop: "poop" } };
const d = strictCreate(D, preSnap);
