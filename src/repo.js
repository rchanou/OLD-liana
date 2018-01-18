import { types, flow } from "mobx-state-tree";

import { pack, unpack } from "./pack";

const gRef = "g";
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
const lessThanOrEqual = "v";
const greaterThanOrEqual = "^";

const equal = "=";
const strictEqual = "e";
const notEqual = "!";
const notStrictEqual = "n";

const importOp = "m";
const newOp = "w";
const typeofOp = "t";
const instanceOfOp = "i";
const classOp = "c";
const thisOp = "h";

const opFuncs = {
  [gRef]: typeof window !== "undefined" ? window : gRef,
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
  gRef,
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

const Pkg = types
  .model("Pkg", {
    id: types.identifier(types.string),
    path: types.string,
    resolved: types.optional(types.boolean, false)
  })
  .actions(self => {
    const { system } = getEnv(self);
    return {
      afterCreate: flow(function*() {
        yield system.import(self.path);
        // TODO: error handling (retry?)
        self.resolved = true;
      }),
      postProcessSnapshot(snapshot) {
        delete self.resolved;
        return snapshot;
      }
    };
  })
  .views(self => ({
    get out() {
      if (resolved) {
        return system.get(self.path);
      }
      return Pkg;
    }
  }));

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

const RepoUser = types
  .model("RepoUser", {
    repo: types.optional(types.reference(types.late(() => Repo)), 0)
  })
  .actions(self => ({
    postProcessSnapshot(snapshot) {
      delete self.repo;
      return snapshot;
    }
  }));

const repoModel = (...args) => types.compose(RepoUser, types.model(...args));

const Arg = types.model("Arg", {
  arg: types.refinement(types.number, n => n >= 0 && !(n % 1))
});
// .views(self => ({}));

const ScopedRef = repoModel("ScopedRef", {
  sRef: types.string
}).views(self => ({
  calc(lines, params) {
    if (!lines) {
      throw new Error("No lines brah!");
    }
    const { repo } = self;
    const innerLine = lines.get(self.sRef);
    if (!innerLine) {
      throw new Error("nononononono line");
    }
    if (!innerLine.some(ilWord => "sRef" in ilWord)) {
      return parseCallLine(repo, innerLine)(...params);
    }
    return parseLine(innerLine)(...params);
  }
}));

const PkgRef = types.model("PkgRef", {
  pkg: types.reference(Pkg)
});
// .views(self => ({
//   get out() {
//     return;
//   }
// }));

const Word = types.union(
  Val,
  Op,
  Arg,
  types.late(() => GlobalRef),
  ScopedRef,
  PkgRef
);

const Line = types.refinement(types.array(Word), l => l.length);

const Call = repoModel("Call", {
  id: types.identifier(types.string),
  line: Line
}).views(self => ({
  get out() {
    return parseCallLine(self.repo, self.line);
  }
}));

const Declaration = types.union(types.late(() => Call), types.late(() => Def));

const GlobalRef = types
  .model("GlobalRef", {
    gRef: types.reference(Declaration)
  })
  .views(self => ({
    get out() {
      return self.gRef.out;
    }
  }));

const parseCallLine = (repo, line) => {
  const func = (...params) => {
    // TODO: hoist unchanging (non-param) slots
    const tokens = line.map(word => {
      if ("arg" in word) {
        return params[word.arg];
      }
      return word.out;
      // throw new Error("No match found for word, brah! " + word);
    });
    const [head, ...args] = tokens;
    return typeof head === "function" ? head(...args) : head;
  };
  if (!line.some(word => "arg" in word)) {
    return func();
  }
  return func;
};

const Def = repoModel("Def", {
  argLabels: types.optional(types.array(types.string), []),
  id: types.identifier(types.string),
  lines: types.maybe(types.map(Line)),
  ret: Line
})
  .actions(self => ({
    postProcessSnapshot(snapshot) {
      if (!snapshot.argLabels.length) {
        delete snapshot.argLabels;
      }
      return snapshot;
    }
  }))
  .views(self => ({
    get out() {
      const { repo } = self;
      const { lines } = self;
      return (...params) => {
        const parseLine = line => {
          const tokens = line.map(word => {
            if ("arg" in word) {
              return params[word.arg];
            }
            if ("sRef" in word) {
              return word.calc(lines, params);
            }
            return word.out;
            throw new Error("No match found!");
          });
          const [head, ...args] = tokens;
          return typeof head === "function" ? head(...args) : head;
        };
        return parseLine(self.ret);
      };
    }
  }));

const LabelMap = types.map(types.string);

const LabelSet = types.model("LabelSet", {
  id: types.identifier(types.string),
  decs: types.optional(
    types.map(types.union(types.map(LabelMap), LabelMap)),
    {}
  )
});

const usLocale = "en-US";
const User = types.model("User", {
  labelSets: types.optional(types.map(LabelSet), {
    [usLocale]: { id: usLocale }
  }),
  currentLabelSet: types.optional(types.reference(LabelSet), usLocale)
});

export const Repo = types
  .model("Repo", {
    _id: types.optional(types.identifier(types.number), 0),
    decs: types.map(Declaration),
    user: types.optional(User, {})
  })
  .preProcessSnapshot(snapshot => {
    if (snapshot.d) {
      return unpack(snapshot);
    }
    return snapshot;
  })
  .actions(self => ({
    postProcessSnapshot(snapshot) {
      return pack(snapshot);
    }
  }))
  .views(self => ({
    out(id) {
      return self.decs.get(id).out;
    }
  }));
