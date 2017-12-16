const assert = require("assert");
const { types } = require("mobx-state-tree");

let idCounter = 0;
const optionalId = types.optional(types.identifier(types.number), () => idCounter++);

const A = types.model({
  id: optionalId
});

const E = types.model("E", { id: optionalId, txt: types.string });

const B = types.compose(
  A,
  types
    .model({
      num: types.number,
      e: types.maybe(E),
      ref: types.maybe(types.reference(E))
    })
    .actions(self => ({
      setE() {
        self.ref = self.e;
      }
    }))
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
    { num: 2, e: { txt: "fart" } },
    { string: "tsra", sub: [{ num: 11 }, { num: 22 }] },
    { num: 444 },
    { string: "arstvxc" }
  ]
});

d.list[0].setE();
console.log(d.list[0].e.txt);
console.log(d.selected.num);
