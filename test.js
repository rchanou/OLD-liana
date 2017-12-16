const assert = require("assert");
const { types } = require("mobx-state-tree");

let idCounter = 0;
const optionalId = types.optional(
  types.identifier(types.number),
  () => idCounter++
);

const A = types.model({
  id: optionalId
});

const B = types.compose(
  A,
  types.model({
    num: types.number,
    wtf: types.maybe(types.identifier(types.number))
  })
);

const C = types.compose(
  A,
  types.model({
    string: types.string,
    sub: types.optional(types.array(types.late(() => BC)), [])
  })
);

const BC = types.union(B, C);

const D = types.model({
  selected: types.reference(BC),
  list: types.array(BC)
});

const d = D.create({
  selected: 4,
  list: [
    { num: 2 },
    { string: "tsra", sub: [{ num: 11, wtf: 4 }, { num: 22 }] },
    { num: 444 },
    { string: "arstvxc" }
  ]
});

console.log(d.selected.num);
