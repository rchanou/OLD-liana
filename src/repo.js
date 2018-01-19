import { types, flow } from "mobx-state-tree";

import { ContextUser } from "./user";
import { makeContext } from "./context";
import { pack, unpack } from "./pack";
import * as Color from "./color";

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

export const Pkg = types
  .model("Pkg", {
    id: types.identifier(types.string),
    path: types.string,
    resolved: false
  })
  .actions(self => {
    const { system } = getEnv(self);
    return {
      afterCreate: flow(function*() {
        yield system.import(self.path);
        // TODO: error handling (retry?)
        self.resolved = true;
      }),
      postProcessSnapshot({ resolved, ...rest }) {
        return rest;
      }
    };
  })
  .views(self => ({
    get out() {
      if (resolved) {
        return system.get(self.path);
      }
      return Pkg;
    },
    equivalent(other) {
      return other === self || other.pkg === self;
    },
    get name() {
      return self.path.replace("https://unpkg.com/", "").split("/")[0];
    },
    get color() {
      return Color.dep;
    }
  }));

const PkgRef = types
  .model("PkgRef", {
    pkg: types.reference(Pkg)
  })
  .views(self => ({
    get out() {
      return self.pkg.out;
    },
    get name() {
      return self.pkg.name;
    },
    get color() {
      return self.pkg.color;
    }
  }));

const Val = types
  .model("Val", {
    val: types.union(types.number, types.string, types.boolean, types.null)
  })
  .views(self => ({
    get out() {
      return self.val;
    },
    get name() {
      const { val } = self;
      if (typeof val === "string") {
        return `"${val}"`;
      } else {
        return String(val);
      }
    },
    get color() {
      return Color.val;
    }
  }))
  .actions(self => ({
    select(val) {
      if (typeof self.val === "number") {
        const numVal = Number(val);

        if (isNaN(numVal)) {
          return;
        }

        self.val = numVal;
        return;
      }

      self.val = val;
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
    },
    get name() {
      // TODO: look up from context user
      return self.op;
    },
    get color() {
      return Color.op;
    }
  }));

const Arg = types
  .model("Arg", {
    // TODO: type prop
    arg: types.refinement(types.number, n => n >= 0 && !(n % 1))
  })
  .views(self => ({
    get name() {
      // TODO: look up appropriate name based on user context
      return `{${self.arg}}`;
    },
    get color() {
      return Color.input;
    }
  }));

const ScopedRef = ContextUser.refModel("ScopedRef", {
  sRef: types.string
}).views(self => ({
  calc(lines, params) {
    if (!lines) {
      throw new Error("No lines brah!");
    }
    const innerLine = lines.get(self.sRef);
    if (!innerLine) {
      throw new Error("nononononono line");
    }
    if (!innerLine.some(ilWord => "sRef" in ilWord)) {
      return parseCallLine(innerLine)(...params);
    }
    return parseLine(innerLine)(...params);
  },
  get name() {
    // TODO: look up from user
    return `(${self.sRef})`;
  },
  get color() {
    return Color.reified;
  }
}));

const GlobalRef = types
  .model("GlobalRef", {
    gRef: types.reference(types.late(() => Declaration))
  })
  .views(self => ({
    get out() {
      return self.gRef.out;
    },
    get name() {
      return self.gRef.name;
    },
    get color() {
      return Color.pending;
      // return self.gRef.color;
    }
  }));

const Word = types.union(Val, Op, Arg, GlobalRef, ScopedRef, PkgRef);

const Line = types.refinement(types.array(Word), l => l.length);

const getDecNameViews = self => ({
  get name() {
    const { decs } = self[ContextUser.key].currentNameSet;
    if (!decs) {
      return `{${self.id}}`;
    }
    const nameRecord = decs.get(self.id);
    if (typeof nameRecord === "string") {
      return nameRecord;
    }
    return nameRecord.get("r") || `{${self.id}}`;
  }
});

const Call = ContextUser.refModel("Call", {
  id: types.identifier(types.string),
  line: Line
})
  .views(self => ({
    get out() {
      return parseCallLine(self.line);
    },
    get color() {
      return Color.reified;
    }
  }))
  .views(getDecNameViews);

const Def = ContextUser.refModel("Def", {
  id: types.identifier(types.string),
  lines: types.maybe(types.map(Line)),
  ret: Line
})
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
    },
    get color() {
      return Color.pending;
    },
    lineName(lineId) {
      // TODO: this isn't getting hit and it feels dirty
      const { decs } = self[ContextUser.key].currentNameSet;
      if (!decs) {
        return `{${self.id}}`;
      }
      const nameRecord = decs.get(self.id);
      const name = nameRecord.get(lineId);
      return name;
    }
  }))
  .views(getDecNameViews);

export const Declaration = types.union(Call, Def);

const parseCallLine = line => {
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

export const Repo = types
  .model("Repo", {
    decs: types.map(Declaration),
    user: ContextUser.Type
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

export const ContextRepo = makeContext(Repo);
