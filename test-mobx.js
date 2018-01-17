const { types } = require("mobx-state-tree");

const global = "g";
const access = ".";
const array = "[";
const object = "{";
const mutate = "@";
const identity = "#";

const add = "+";
const subtract = "-";
const multiply = "*";
const divide = "/";
const mod = "%";

const ifOp = "?";
const switchOp = "s";
const forOp = "f";

const lessThan = "<";
const greaterThan = ">";
const lessThanOrEqual = "<=";
const greaterThanOrEqual = ">=";

const equal = "==";
const strictEqual = "===";
const notEqual = "!=";
const notStrictEqual = "!==";

const importOp = "m";
const newOp = "n";
const typeofOp = "t";
const instanceOfOp = "i";
const classOp = "c";
const thisOp = "h";

const ops = [
  global,
  access,
  array,
  object,
  add,
  subtract,
  multiply,
  divide,
  mod,
  ifOp,
  switchOp,
  forOp,
  importOp,
  newOp,
  typeofOp,
  instanceOfOp,
  classOp,
  thisOp,
  lessThan,
  greaterThan,
  lessThanOrEqual,
  greaterThanOrEqual,
  equal,
  strictEqual,
  notEqual,
  notStrictEqual,
  mutate,
  identity
];

const Pkg = types.model("Pkg", {
  id: types.identifier(types.string),
  path: types.string,
  resolved: types.optional(types.boolean, false)
});

const Val = types.model("Val", {
  val: types.union(types.number, types.string, types.boolean, types.null)
});

const Op = types.model("Op", {
  op: types.enumeration(ops)
});

const Arg = types.model("Arg", {
  arg: types.refinement(types.number, n => n >= 0 && !(n % 1))
});

const Fn = types.model("Fn", {
  fn: types.reference(types.late(() => Def))
});

const Use = types.model("Use", {
  use: types.string
});

const PkgUse = types.model("Use", {
  pkg: types.reference(Pkg)
});

const Word = types.union(Val, Op, Arg, Fn, Use, PkgUse);

const Line = types.array(Word);

const Def = types
  .model("Def", {
    id: types.identifier(types.string),
    decs: types.maybe(types.map(Line)),
    ret: Line
  })
  .views(self => ({
    get out() {}
  }));

const Repo = types.model("Repo", {
  defs: types.map(Def)
});

const test = {
  defs: {
    a: { id: "a", ret: [{ val: 0 }] }
  }
};

const store = Repo.create(test);
console.log(store.defs.get("a").ret[0].val);
