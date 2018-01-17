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

const opFuncs = {
  [global](val) {
    return window[val];
    // return eval(val);
  },
  [access](obj, key) {
    try {
      return obj[key];
    } catch (ex) {
      return ex;
    }
  },
  [add](...nums) {
    let sum;
    for (let i = 0; i < nums.length; i++) {
      if (i === 0) {
        sum = nums[i];
      } else {
        sum += nums[i];
      }
    }
    return sum;
  },
  [array](...items) {
    return items;
  },
  [object](...kvs) {
    const obj = {};
    for (let i = 0; i < kvs.length; i = i + 2) {
      obj[kvs[i]] = kvs[i + 1];
    }
    return obj;
  },
  [ifOp](condition, trueVal, falseVal) {
    return condition ? trueVal : falseVal;
  },
  [switchOp](switcher, ...casePairs) {
    // console.log(switcher, ...casePairs, "SWIT");
    const { length } = casePairs;
    for (let i = 0; i < length; i += 2) {
      if (switcher === casePairs[i]) {
        return casePairs[i + 1];
      }
    }
    if (length % 2) {
      return casePairs[length - 1];
    }
  },
  [lessThan](a, b) {
    return a < b;
  },
  [identity](x) {
    return function() {
      return x;
    };
  }
};

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
      const opFunc = opFuncs[self.op];
      if (!opFunc) {
        throw new Error(opFunc + " op not yet implemented!");
      }
      return opFunc;
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

const Call = types
  .model("Call", {
    id: types.identifier(types.string),
    line: Line
  })
  .views(self => ({
    out(repo) {
      const { line } = self;
      const func = (...params) => {
        // TODO: hoist unchanging (non-param) slots
        const tokens = line.map(word => {
          if ("val" in word || "op" in word) {
            return word.out;
          }
          if ("arg" in word) {
            return params[word.arg];
          }
          if ("fn" in word) {
            return word.fn.out(repo);
          }
          throw new Error("No match found for code, brah! " + word);
        });

        const [head, ...args] = tokens;
        return typeof head === "function" ? head(...args) : head;
      };
      if (!line.some(word => "arg" in word)) {
        debugger;
        return func();
      }
      return func;
    }
  }));

const Def = types
  .model("Def", {
    id: types.identifier(types.string),
    lines: types.maybe(types.map(Line)),
    ret: Line
  })
  .views(self => ({
    out(repo) {
      const { lines } = self;
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
              if (!lines) {
                throw new Error("No lines brah!");
              }
              const innerLine = lines.get(word.use);
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

const Repo = types
  .model("Repo", {
    lines: types.map(types.union(Call, Def))
  })
  .views(self => ({
    out(id) {
      return self.lines.get(id).out(self);
    }
  }));

const test = {
  lines: {
    a: { id: "a", ret: [{ val: 0 }] },
    b: { id: "b", ret: [{ op: add }, { arg: 0 }, { val: 1 }] },
    ba: { id: "ba", line: [{ op: add }, { val: 1 }, { val: 2 }] }
  }
};

const store = Repo.create(test);
const a = store.out("a");
const b = store.out("b");
console.log(a(), 0);
console.log(store.out("ba"));
