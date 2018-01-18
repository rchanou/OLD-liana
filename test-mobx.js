const { types } = require("mobx-state-tree");
const process = require("immer").default;
const util = require("util");

const global = "g";
const dot = ".";
const array = "[";
const object = "{";
const mutate = "@";
const identity = "#";

const add = "+";
const minus = "-";
const times = "*";
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
  [global]: typeof window !== "undefined" ? window : global,
  [dot](obj, key) {
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
  [minus](...nums) {
    let sum;
    for (let i = 0; i < nums.length; i++) {
      if (i === 0) {
        sum = nums[i];
      } else {
        sum -= nums[i];
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
  dot,
  array,
  object,
  add,
  minus,
  times,
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
        throw new Error(self.op + " op not yet implemented!");
      }
      return opFunc;
    }
  }));

const Arg = types.model("Arg", {
  arg: types.refinement(types.number, n => n >= 0 && !(n % 1))
});
// .views(self => ({}));

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

const Word = types.union(Val, Op, Arg, types.late(() => Fn), Use, PkgUse);

const Line = types.refinement(types.array(Word), l => l.length);

const Call = types
  .model("Call", {
    id: types.identifier(types.string),
    line: Line
  })
  .views(self => ({
    out(repo) {
      return parseCallLine(repo, self.line);
    }
  }));

const Declaration = types.union(types.late(() => Call), types.late(() => Def));

const Fn = types
  .model("Fn", {
    fn: types.reference(Declaration)
  })
  .views(self => ({
    out(repo) {
      return self.fn.out(repo);
    }
  }));

const parseCallLine = (repo, line) => {
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
    return func();
  }
  return func;
};

const Def = types
  .model("Def", {
    id: types.identifier(types.string),
    lines: types.maybe(types.map(Line)),
    ret: Line
  })
  // .preProcessSnapshot(snapshot =>
  //   process(snapshot, draft => {
  //     const { i, l, r } = draft;
  //     if (i) {
  //       draft.id = i;
  //     }
  //     if (l) {
  //       draft.lines = l;
  //     }
  //     if (r) {
  //       draft.ret = r;
  //     }
  //   })
  // )
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
                throw new Error("nononononono line");
              }
              if (!innerLine.some(ilWord => "use" in ilWord)) {
                return parseCallLine(repo, innerLine)(...params);
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
    decs: types.map(Declaration)
  })
  .views(self => ({
    out(id) {
      return self.decs.get(id).out(self);
    }
  }));

const test = {
  decs: {
    a: { id: "a", ret: [{ arg: 0 }] },
    b: { id: "b", ret: [{ op: add }, { arg: 0 }, { val: 1 }] },
    b1: { id: "b1", ret: [{ op: minus }, { arg: 0 }, { val: 1 }] },
    ba: { id: "ba", line: [{ op: add }, { val: 1 }, { val: 2 }] },
    c: {
      id: "c",
      line: [
        { op: switchOp },
        { arg: 0 },
        { val: "INCREMENT" },
        { fn: "a" },
        { val: "DECREMENT" },
        { fn: "b1" },
        { fn: "a" }
      ]
    },
    d: { id: "d", line: [{ op: dot }, { arg: 0 }, { val: "type" }] },
    e: {
      id: "e",
      lines: { a: [{ fn: "d" }, { arg: 0 }] },
      ret: [{ fn: "c" }, { use: "a" }]
    }
  }
};

const packWord = full => {
  if ("val" in full) {
    return [full.val];
  }
  if ("op" in full) {
    return full.op;
  }
  if ("fn" in full) {
    return { f: full.fn };
  }
  if ("arg" in full) {
    return full.arg;
  }
  if ("use" in full) {
    return { u: full.use };
  }
  throw new Error(`Could not pack word. Has no match: ${full}`);
};

const packDeclaration = full => {
  const packed = { i: full.id };
  if (full.line) {
    packed.l = full.line.map(packWord);
  } else {
    packed.r = full.ret.map(packWord);
    if (full.lines) {
      packed.l = {};
      for (const id in full.lines) {
        packed.l[id] = full.lines[id].map(packWord);
      }
    }
  }
  return packed;
};

const packDecSet = full => {
  const packed = [];
  for (const id in full) {
    const packedDec = packDeclaration(full[id]);
    packed.push(packedDec);
  }
  return packed;
};

const unpackWord = packed => {
  if (Array.isArray(packed)) {
    return { val: packed[0] };
  }
  if (typeof packed === "string") {
    return { op: packed };
  }
  if (typeof packed === "number") {
    return { arg: packed };
  }
  if ("f" in packed) {
    return { fn: packed.f };
  }
  if ("u" in packed) {
    return { use: packed.u };
  }
  throw new Error(`Could not unpack word. Has no match: ${packed}`);
};

const unpackDeclaration = packed => {
  const full = { id: packed.i };
  if (packed.r) {
    full.ret = packed.r.map(unpackWord);
    if (packed.l) {
      full.lines = {};
      for (const id in packed.l) {
        full.lines[id] = packed.l[id].map(unpackWord);
      }
    }
  } else {
    full.line = packed.l.map(unpackWord);
  }
  return full;
};

const unpackDecSet = packed => {
  const full = {};
  for (const dec of packed) {
    const fullDec = unpackDeclaration(dec);
    full[fullDec.id] = fullDec;
  }
  return full;
};

const packTest = packDecSet(test.decs);
const unpackTest = unpackDecSet(packTest);
console.log(util.inspect(packTest, { depth: null }));
console.log(util.inspect(unpackTest, { depth: null }));
const before = JSON.stringify(test.decs).length;
const after = JSON.stringify(packTest).length;
const unpacked = JSON.stringify(unpackTest).length;
console.log(before, after, unpacked, after / before * 100);

const store = Repo.create(test);
const a = store.out("a");
const b = store.out("b");
console.log(a(1), 1);
console.log(store.out("ba"));

const c = store.out("d");
console.log(c({ type: "INCREMENT" }), "INCREMENT");

const e = store.out("e");
console.log(e({ type: "DECREMENT" })(5));
