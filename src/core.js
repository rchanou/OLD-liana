import { types, getEnv, getSnapshot, flow } from "mobx-state-tree";
import { observable, toJS } from "mobx";
import produce, { setAutoFreeze } from "immer";
setAutoFreeze(false);

import { ContextUserReader } from "./user";
import {
  asContext,
  mixinModel,
  optionalModel,
  IndexType,
  incrementLetterId
} from "./model-utils";
import { pack, unpack } from "./pack";
import * as Color from "./color";

const gRef = "g";
const dot = ".";
const array = "[";
const object = "{";
const mutate = "@";

const and = "a";
const or = "o";

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

const throwOp = () => {
  throw new Error("Special-cased op...this shouldn't be run!");
};
const opFuncs = {
  [ifOp]: throwOp,
  [switchOp]: throwOp,
  [and]: throwOp,
  [or]: throwOp,
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
  [lessThan](a, b) {
    return a < b;
  },
  [strictEqual](a, b) {
    return a === b;
  }
};

const ops = [];
for (const op in opFuncs) {
  ops.push(op);
}

export const Pkg = mixinModel(optionalModel({ resolved: false }))("Pkg", {
  id: types.identifier(types.string),
  path: types.string
})
  .actions(self => {
    const { system = SystemJS } = getEnv(self);
    return {
      afterCreate: flow(function*() {
        yield system.import(self.path);
        // TODO: error handling (retry?)
        self.resolved = true;
      })
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
  .model("PkgRef", { pkg: types.reference(Pkg) })
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
const Named = optionalModel({
  names: types.optional(types.map(LocaleNameSet), {})
});

const defaultOpNames = {
  [gRef]: "🌐",
  [dot]: "•",
  [ifOp]: "IF",
  [switchOp]: "SW",
  [and]: "&&",
  [or]: "||",
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

const Arg = mixinModel(ContextUserReader)("Arg", {
  arg: types.refinement(
    types.array(types.union(types.string, IndexType)),
    path => {
      const { length } = path;
      if (typeof path[0] === "number" && typeof path[1] === "number") {
        return length === 2;
      }
      for (let i = 0; i < length; i++) {
        if (i === length - 1) {
          if (typeof path[i] !== "number") {
            return false;
          }
        } else if (typeof path[i] !== "string") {
          return false;
        }
      }
      return true;
    }
  )
}).views(self => ({
  get name() {
    return self.user.pathName(self.arg);
  },
  get color() {
    return Color.input;
  },
  get width() {
    return Math.ceil((self.name.length + 3) / 6);
  }
}));

// TODO: cleanup, refine this type definition
export const RefPath = types.union(
  types.string,
  types.refinement(types.array(types.union(IndexType, types.string)), ref => {
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
  })
);

const Ref = mixinModel(ContextUserReader)("Ref", {
  ref: RefPath
}).views(self => ({
  get name() {
    const { ref } = self;
    return self.user.pathName(ref) || `(${ref.slice()})`;
  },
  get color() {
    return Color.pending;
  },
  get width() {
    return Math.ceil((self.name.length + 3) / 6);
  }
}));

const Node = types.union(Val, Op, Arg, Ref, PkgRef);

const Line = types.array(Node);

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

const Dec = types.map(types.union(types.string, Line, types.late(() => Dec)));

const paramTypeEnum = {
  any: "A",
  num: "N",
  string: "S",
  bool: "B"
};

const paramTypeEnumList = [];
for (const enumKey in paramTypeEnum) {
  paramTypeEnumList.push(paramTypeEnum[enumKey]);
}

const ParamType = types.maybe(
  types.enumeration("ParamType", paramTypeEnumList)
);

const Param = optionalModel("Param", {
  type: types.maybe(types.string),
  validator: types.maybe(RefPath),
  rest: false
});

export const Group = mixinModel(
  optionalModel({
    name: types.maybe(types.string),
    decs: types.optional(types.array(types.string), [])
  })
)("Group", {
  id: types.identifier(types.string)
}).actions(self => ({
  add(decId) {
    const { decs } = self;
    const current = decs.find(d => d === decId);
    if (current === undefined) {
      decs.push(decId);
    }
  },
  moveUp(index) {
    const { decs } = self;
    if (index < 1) {
      return;
    }
    const swapIndex = index - 1;
    const swapItem = decs[swapIndex];
    decs[swapIndex] = decs[index];
    decs[index] = swapItem;
  },
  moveDown(index) {
    const { decs } = self;
    if (index >= decs.length - 1) {
      return;
    }
    const swapIndex = index + 1;
    const swapItem = decs[swapIndex];
    decs[swapIndex] = decs[index];
    decs[index] = swapItem;
  }
}));

export const ParamAspect = types
  .compose(
    "ParamAspect",
    ContextUserReader,
    optionalModel({
      params: types.optional(types.map(types.array(types.maybe(Param))), {})
    })
  )
  .views(self => ({
    get fullParams() {
      const plainParams = getSnapshot(self.params);
      return produce(plainParams, draft => {
        const fillParamsFrom = dec => {
          if (dec instanceof Array) {
            for (const node of dec) {
              if ("arg" in node) {
                const { arg } = node;
                const scopePath = arg.slice(0, -1);
                const index = arg[arg.length - 1];
                if (!draft[scopePath]) {
                  draft[scopePath] = [];
                }
                if (!draft[scopePath][index]) {
                  draft[scopePath][index] = {};
                  draft[scopePath][index].name = self.user.pathName(arg);
                }
              }
            }
            return;
          }
          dec.forEach((_, id) => {
            fillParamsFrom(dec.get(id));
          });
        };
        fillParamsFrom(self.main);
      });
    }
  }))
  .actions(self => ({
    addParam(path) {
      const pathKey = path.join(",");
      const { params } = self;
      if (!params.has(pathKey)) {
        params.set(pathKey, []);
      }
      params.get(pathKey).splice(0, 0, {});
    }
  }));

window.j = toJS;
export const SampleAspect = optionalModel("SampleAspect", {
  sampleLists: types.optional(
    types.map(types.array(types.array(types.union(Val, Ref, Op, PkgRef)))),
    {}
  )
}).views(self => ({
  fullSample(mainId, sampleIndex = 0) {
    const { getDec, main, sampleLists } = self;
    const sampleList = sampleLists.get(mainId);
    if (!sampleList) {
      return null;
    }
    const sample = sampleList[sampleIndex];
    const sampleKey = `${mainId}-${sampleIndex}`;
    const copyFromDec = decToCopy => {
      const subCopyFromDec = (parent, sampleParent, id) => {
        // const sampleMainKey = `${id}${sampleKey}`;
        let thisDec;
        if (id == null) {
          thisDec = parent;
        } else {
          thisDec = parent.get(id);
        }
        if (thisDec instanceof Array) {
          if (id == null) {
            throw new Error("naw girl");
          }
          sampleParent.set(id, []);
          const sampleDec = sampleParent.get(id);
          for (let i = 0; i < thisDec.length; i++) {
            const node = thisDec[i];
            if ("arg" in node) {
              const { arg } = node;
              // if (arg.slice(0, -1).join(",") === mainId.join(",")) {
              if (arg[0] === mainId) {
                sampleDec[i] = sample[arg[arg.length - 1]];
              }
            } else if ("ref" in node && node.ref[0] === mainId) {
              sampleDec[i] = { ref: [sampleKey, ...node.ref.slice(1)] };
            } else {
              sampleDec[i] = node;
            }
          }
          return;
        }
        // sampleParent.set(id, new Map());
        if (id != null) {
          sampleParent.set(id, observable.map());
        }
        thisDec.forEach((_, subId) => {
          subCopyFromDec(thisDec, sampleParent, subId);
        });
      };
      const sampleResult = observable.map();
      subCopyFromDec(decToCopy, sampleResult);
      return sampleResult;
    };
    const decToCopy = getDec(mainId);
    // console.log("copying dec", decToCopy.toJSON());
    return copyFromDec(decToCopy);
  }
}));

export const Repo = mixinModel(ParamAspect, SampleAspect)("Repo", {
  main: Dec,
  packages: types.optional(types.map(Pkg), {}),
  groups: types.optional(types.map(Group), {}),
  comments: types.optional(types.map(types.array(types.string)), {})
})
  .views(self => ({
    get full() {
      const { main, fullSample } = self;
      const testSample = fullSample("o");
      const full = observable.map(main);
      full.set("o-0", testSample);
      return full;
    },
    getDec(path) {
      let dec = self.main;
      for (const id of path) {
        dec = dec.get(id);
      }
      return dec;
    },
    get out() {
      return self.run();
    },
    run(...initialPath) {
      const { main } = self;
      const gen = (path = [], scopes = {}) => {
        let dec = main;
        for (const id of path) {
          dec = dec.get(id);
        }
        if (dec instanceof Array) {
          if (!dec.length) {
            return undefined; // maybe return some special "pending" symbol instead?
          }
          const parseNode = node => {
            if ("out" in node) {
              return node.out;
            } else if ("ref" in node) {
              const { ref } = node;
              if (typeof ref === "string") {
                return gen([ref], scopes);
              } else {
                return gen(ref, scopes);
              }
            } else if ("arg" in node) {
              const { arg } = node;
              const scopePath = arg.length === 1 ? "" : arg.slice(0, -1);
              const index = arg[arg.length - 1];
              return scopes[scopePath][index];
            }
          };
          // special-case handling of conditional ops
          // for short-circuiting ("lazy evaluation") flow control behavior
          // as would be expected in plain JS
          const [{ op }] = dec;
          switch (op) {
            case ifOp:
              const cond = parseNode(dec[1]);
              if (cond) {
                return parseNode(dec[2]);
              } else {
                return parseNode(dec[3]);
              }
              break;
            case and:
              let andResult;
              for (let i = 1; i < dec.length; i++) {
                andResult = parseNode(dec[i]);
                if (!andResult) {
                  return andResult;
                }
              }
              return andResult;
              break;
            case or:
              let orResult;
              for (let i = 1; i < dec.length; i++) {
                orResult = parseNode(dec[i]);
                if (orResult) {
                  return orResult;
                }
              }
              return orResult;
              break;
            case switchOp:
              // TODO: try to generate a proper switch statement
              // but this requires "eval" or the Function constructor
              const [, switcherNode, ...casePairs] = dec;
              const { length } = casePairs;
              const switcher = parseNode(switcherNode);
              for (let i = 0; i < length; i += 2) {
                if (switcher === parseNode(casePairs[i])) {
                  return parseNode(casePairs[i + 1]);
                }
              }
              if (length % 2) {
                return parseNode(casePairs[length - 1]);
              }
              // throwing for now, but maybe that's too strict
              throw new Error(
                "Switch case not matched. No default case defined."
              );
              break;
          }
          // TODO: short-circuit "for"?
          const outs = dec.map(parseNode);
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
  }))
  .actions(self => {
    const { getDec } = self;
    return {
      addToDec(scopePath, item = []) {
        const scope = getDec(scopePath);
        const ids = scope.keys();
        const lastId = ids[ids.length - 1];
        let newId = incrementLetterId(lastId);
        while (scope.get(newId)) {
          newId = incrementLetterId(newId);
        }
        scope.set(newId, item);
        return [...scopePath, newId];
      },
      addNode(item, path, index) {
        const dec = getDec(path);
        if (index === undefined) {
          index = dec.length - 1;
        }
        dec.splice(index, 0, item);
      },
      deleteFromDec(path, index) {
        if (index === undefined) {
          const scope = getDec(path.slice(0, -1));
          scope.delete(path[path.length - 1]);
          return;
        }
        const dec = getDec(path);
        dec.splice(index, 1);
      }
    };
  });

export const ContextRepo = asContext(Repo);
