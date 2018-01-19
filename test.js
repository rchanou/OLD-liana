const { types } = require("mobx-state-tree");

const B = types.model({
  id: types.identifier(types.number),
  name: types.string,
  ref: types.reference(types.late(() => B))
});

const A = types.model({
  b: B,
  ref: types.reference(B)
});

const a = A.create({
  b: { id: 1, name: "rsttars", ref: 1 },
  ref: 1
});

console.log(a.b.ref.name);

const test = x => y => z => x + y + z;

console.log(test(1)(5)(7));
