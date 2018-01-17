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

const Val = types
  .model("Val", {
    val: types.union(types.number, types.string, types.boolean, types.null)
  })
  .views(self => ({
    get out() {
      return self.val;
    }
  }));

const Op = types
  .model("Op", {
    op: types.enumeration(ops)
  })
  .views(self => ({
    get out() {
      return ops[self.op];
    }
  }));

const Arg = types.model("Arg", {
  arg: types.refinement(types.number, n => n >= 0 && !(n % 1))
});
// .views(self => ({}));

const Fn = types
  .model("Fn", {
    fn: types.reference(types.late(() => Def))
  })
  .views(self => ({
    out(repo) {
      return self.fn.out(repo);
    }
  }));

const Use = types.model("Use", {
  use: types.string
});
// .views(self => ({
//   out(repo) {
//     return;
//   }
// }));

const PkgUse = types.model("Use", {
  pkg: types.reference(Pkg)
});
// .views(self => ({
//   get out() {
//     return;
//   }
// }));

const Word = types.union(Val, Op, Arg, Fn, Use, PkgUse);

const Line = types.array(Word);

const Def = types
  .model("Def", {
    id: types.identifier(types.string),
    decs: types.maybe(types.map(Line)),
    ret: Line
  })
  .views(self => ({
    out(repo) {
      const { decs } = self;
      return (...params) => {
        const parseLine = line => {
          const tokens = line.map(word => {
            if ("val" in word || "op" in word) {
              return word.out;
            }
            if ("arg" in word) {
              return params[word.arg];
            }
            if ("use" in word) {
              const innerLine = decs.get(word.use);
              if (!innerLine) {
                throw new Error("nononononono");
              }
              if (!innerLine.some(ilWord => "use" in ilWord)) {
                const func = (...innerParams) => {
                  // TODO: hoist unchanging (non-param) slots
                  const tokens = innerLine.map(code => {
                    if ("val" in word || "op" in word) {
                      return word.out;
                    }
                    if ("arg" in word) {
                      return innerParams[word.arg];
                    }
                    if ("fn" in word) {
                      return word.fn.out(repo);
                    }
                    throw new Error("No match found for code, brah! " + code);
                  });

                  const [head, ...args] = tokens;
                  return typeof head === "function" ? head(...args) : head;
                };
                return func(...params);
              }
              return parseLine(innerLine)(...params);
            }
            if ("fn" in word) {
              return word.fn.out(repo);
            }
            throw new Error("No match found!");
          });
          const [head, ...args] = tokens;
          return typeof head === "function" ? head(...args) : head;
        };
        return parseLine(self.ret);
      };
    }
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
const a = store.defs.get("a").out(store);
console.log(a());
