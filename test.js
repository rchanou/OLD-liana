const assert = require("assert");
const { types } = require("mobx-state-tree");
const { autorun } = require("mobx");

const A = types.model({
  test: types.optional(types.number, 0)
});

const makeActions = self => ({
  doIt() {
    self.a.test = self.num;
  }
});

const B = types
  .model({
    num: types.optional(types.number, 1),
    a: types.optional(A, {})
  })
  .actions(self => ({
    setNum(num) {
      self.num = num;
    }
  }))
  .actions(makeActions);

const b = B.create();

autorun(() => {
  console.log(b.a.test);
});

b.doIt();
b.setNum(3);
b.doIt();
