const { types, getSnapshot } = require("mobx-state-tree");

const B = types.model({
  name: types.string
  // ref: types.reference(types.late(() => B))
});

const A = types
  .model({
    b: B,
    ref: types.frozen
    // ref: types.maybe(types.reference(B))
  })
  .actions(self => ({
    setRef(b) {
      self.ref = b;
    }
  }));

const a = A.create({ b: { name: "fart" } });
a.setRef(getSnapshot(a.b));
