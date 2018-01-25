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
        return `'${val}'`;
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

const LocaleNameSet = types.map(types.string);
const NameSet = types.optional(types.map(LocaleNameSet), {});
const Named = types.model({
  names: NameSet
});

const Op = mixinModel(Named)("Op", {
  op: types.enumeration(ops)
}).views(self => ({
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

const integerType = types.refinement(types.number, n => n >= 0 && !(n % 1));
const Arg = mixinModel(ContextUser.RefType, Named)("Arg", {
  // TODO: type prop
  arg: types.union(integerType, types.refinement(types.array(integerType), path => path.length === 2))
  // names: NameSet
}).views(self => ({
  get name() {
    return `{${self.arg}}`;
    // TODO: look up appropriate name based on user context
    return self[ContextUser.key] || `{${self.arg}}`;
  },
  get color() {
    return Color.input;
  }
}));

const ScopedRef = mixinModel(ContextUser.RefType, Named)("ScopedRef", {
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

const Ref = types.model("Ref", {
  ref: types.union(
    types.string,
    types.refinement(
      types.array(types.union(integerType, types.string)),
      ref => ref.length === 2 && typeof ref[0] === "number" && typeof ref[1] === "string"
    )
  )
});

const Word = types.union(Val, Op, Arg, GlobalRef, ScopedRef, PkgRef, Ref);

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

const Call = mixinModel(ContextUser.RefType, Named)("Call", {
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

const Def = mixinModel(ContextUser.RefType, Named)("Def", {
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

const Proc = types.map(types.union(Line, types.late(() => Proc)));

export const Engine = types
  .model("Engine", {
    main: Proc
  })
  .views(self => ({
    run(...returnPath) {
      const { main } = self;
      const out = {};
      const args = {};
      const gen = path => {
        return function(...params) {
          // if (params.length) {
          let scopeArgs = args;
          for (let i = 0; i < path.length; i++) {
            const key = path[i];
            if (!scopeArgs[key]) {
              scopeArgs[key] = {};
            }
            scopeArgs = scopeArgs[key];
          }
          scopeArgs.S = params;
          // }
          const call = line => {
            const tokens = line.map(word => {
              if ("out" in word) {
                return word.out;
              }
              if ("arg" in word) {
                const { arg } = word;
                if (typeof arg === "number") {
                  return params[arg];
                } else {
                  const [scopeLevel, ...argWalk] = arg;
                  const argPath = walkPath(path, scopeLevel, argWalk);
                  let subArgs = args;
                  let i = 0;
                  for (i; i < argPath.length - 1; i++) {
                    subArgs = subArgs[argPath[i]];
                  }
                  return subArgs.S[argPath[i]];
                }
              }
              if ("ref" in word || isObservableArray(word)) {
                if (typeof word.ref === "number") {
                } else {
                  const [scopeLevel = 0, ...refWalk] = word.ref || word;
                  // console.log(path, scopeLevel, refWalk,out);
                  const outPath = walkPath(path, 1, refWalk);
                  let subOut = out;
                  for (let i = 0; i < outPath.length; i++) {
                    subOut = subOut[outPath[i]];
                  }
                  // debugger;
                  return subOut;
                }
              }
            });
            const [head, ...tail] = tokens;
            return typeof head === "function" ? head(...tail) : head;
          };
          let scope = main;
          let scopeOut = out;
          if (path.length) {
            let i = 0;
            for (i; i < path.length - 1; i++) {
              const id = path[i];
              scope = scope.get(id);
              scopeOut = scopeOut[id];
            }
            const scopeId = path[i];
            scope = scope.get(scopeId);
            scopeOut[scopeId] = {};
            scopeOut = scopeOut[scopeId];
          }
          if (isObservableArray(scope)) {
            return call(scope);
          }
          let lastScopeOut;
          scope.forEach((line, id) => {
            if (isObservableArray(line)) {
              scopeOut[id] = call(line);
            } else if (typeof line === "object") {
              scopeOut[id] = gen([...path, id]);
            } else {
              throw new Error("Naw man");
            }
            lastScopeOut = scopeOut[id];
          });
          // console.log(path, scopeOut, args);
          return lastScopeOut;
        };
      };
      const full = gen([]);
      if (returnPath.length) {
        full();
        let subOut = out;
        for (const id of returnPath) {
          subOut = subOut[id];
          // if (id === "c") debugger;
        }
        return subOut;
        // console.log(returnPath, out);
        // debugger;
      }
      return full;
    },
    get out() {
      return self.run();
    }
  }));

export const ContextEngine = makeContext(Engine);

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
