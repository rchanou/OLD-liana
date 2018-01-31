import { types, flow } from "mobx-state-tree";
import { isObservableArray } from "mobx";

import { ContextUser } from "./user";
import { makeContext, mixinModel } from "./context";
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
const undef = "u";

const opFuncs = {
  [gRef]: typeof window !== "undefined" ? window : global,
  [undef]: undefined,
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
  },
  [strictEqual](a, b) {
    return a === b;
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
  identity,
  undef
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
        return `'${val}'`;
      } else {
        return String(val);
      }
    },
    get color() {
      return Color.val;
    },
    get width() {
      return Math.ceil((self.name.length + 3) / 6);
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

const LocaleNameSet = types.map(types.string);
const NameSet = types.optional(types.map(LocaleNameSet), {});
const Named = types.model({
  names: NameSet
});

const defaultOpNames = {
  [gRef]: "🌐",
  [dot]: "•",
  [ifOp]: "IF",
  [switchOp]: "SW",
  [strictEqual]: "===",
  [undef]: "U"
};

const Op = mixinModel(Named)("Op", {
  op: types.enumeration(ops)
}).views(self => ({
  get out() {
    const { op } = self;
    if (!(op in opFuncs)) {
      throw new Error(self.op + " op not yet implemented!");
    }
    const opFunc = opFuncs[op];
    return opFunc;
  },
  get name() {
    // TODO: look up from context user
    const { op } = self;
    return defaultOpNames[op] || op;
  },
  get color() {
    return Color.op;
  },
  get width() {
    return Math.ceil((self.name.length + 3) / 6);
  }
}));

const integerType = types.refinement(types.number, n => n >= 0 && !(n % 1));
const Arg = mixinModel(ContextUser.RefModel)("Arg", {
  // TODO: type prop
  arg: types.union(
    integerType,
    types.refinement(
      types.array(types.union(integerType, types.string)),
      path => {
        const { length } = path;
        if (typeof path[0] === "number" && typeof path[1] === "number") {
          return length === 2;
        } else {
          for (let i = 0; i < length; i++) {
            if (i === length - 1) {
              if (typeof path[i] !== "number") {
                return false;
              }
            } else if (typeof path[i] !== "string") {
              return false;
            }
          }
        }
        return true;
      }
    )
  )
  // names: NameSet
}).views(self => ({
  get name() {
    // TODO: look up appropriate name based on user context
    const { arg } = self;
    if (isObservableArray(arg)) {
      const pathName = self[ContextUser.key].pathName(self.arg);
      if (pathName) {
        return pathName;
      }
      return `{${arg.join(",")}}`;
    }
    return `{${arg}}`;
  },
  get color() {
    return Color.input;
  },
  get width() {
    return Math.ceil((self.name.length + 3) / 6);
  }
}));

const Ref = mixinModel(ContextUser.RefModel)("Ref", {
  ref: types.union(
    types.string,
    types.refinement(
      types.array(types.union(integerType, types.string)),
      ref => {
        const { length } = ref;
        if (typeof ref[0] === "number") {
          return length === 2 && typeof ref[1] === "string";
        }
        for (let i = 0; i < length; i++) {
          if (typeof ref[i] !== "string") {
            return false;
          }
        }
        return true;
      }
    )
  )
}).views(self => ({
  get name() {
    const { ref } = self;
    return self[ContextUser.key].pathName(ref) || `(${ref.slice()})`;
  },
  get color() {
    return Color.pending;
  },
  get width() {
    return Math.ceil((self.name.length + 3) / 6);
  }
}));

const Word = types.union(Val, Op, Arg, PkgRef, Ref);

const Line = types.refinement(types.array(Word), l => l.length);

const walkPath = (base, up, walk) => {
  const finalPath = [...base];
  while (up--) {
    finalPath.pop();
  }
  for (const token of walk) {
    finalPath.push(token);
  }
  return finalPath;
};

const Proc = types.map(types.union(types.string, Line, types.late(() => Proc)));

export const Engine = types
  .model("Engine", {
    main: Proc
  })
  .views(self => ({
    get out() {
      return self.run();
    },
    run(...initialPath) {
      const { main } = self;
      const gen = (path = [], scopes = {}) => {
        let proc = main;
        for (const id of path) {
          proc = proc.get(id);
        }
        if (isObservableArray(proc)) {
          // TODO: short-circuit if, and, or, switch, and possibly for
          const outs = proc.map(word => {
            if ("out" in word) {
              return word.out;
            } else if ("ref" in word) {
              const { ref } = word;
              if (typeof ref === "string") {
                return gen([ref], scopes);
              } else {
                return gen(ref, scopes);
              }
            } else if ("arg" in word) {
              const { arg } = word;
              const path = [];
              let index;
              for (let i = 0; i < arg.length; i++) {
                if (i < arg.length - 1) {
                  path.push(arg[i]);
                } else {
                  index = arg[i];
                }
              }
              return scopes[path][index];
            }
          });
          const [head, ...args] = outs;
          return typeof head === "function" ? head(...args) : head;
        }
        return function(...params) {
          scopes[path] = params;
          const retLine = gen([...path, "R"], scopes);
          return retLine;
        };
      };
      return gen(initialPath);
    }
  }));

export const ContextEngine = makeContext(Engine);
