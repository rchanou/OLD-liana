const { types, getSnapshot } = require("mobx-state-tree");

let idCounter = 0;
const B = types.model("B", {
  id: types.optional(types.identifier(types.number), () => idCounter++),
  name: types.string
  // ref: types.reference(types.late(() => B))
});

const A = types
  .model({
    id: types.refinement(types.identifier(types.string), id => id.length > 3),
    b: B,
    // ref: types.frozen
    ref: types.maybe(types.reference(types.late(() => A)))
  })
  .actions(self => ({
    setRef(b) {
      self.ref = b;
    }
  }));

const C = types.model({ as: types.map(A) });

const a = A.create({
  id: "smart",
  b: { name: "fart" }
});

const c = C.create({
  as: {
    aaaa: { id: "aaaa", b: { name: "sam" }, ref: "bbbbb" },
    bbbbb: { id: "bbbbb", b: { name: "jam" } }
  }
});

console.log(c.as.get("aaaa").ref.b.name);

const D = types.model("D", {
  b: types.reference(B, id => ({ id, name: "flim flam" }))
});

const d = D.create({
  b: 1
});
