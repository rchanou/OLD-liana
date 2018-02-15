import { observable, IObservableObject } from "mobx";

interface Val {
  val?: string | number | boolean;
}

export enum OpEnum {
  Global = "g",
  Dot = ".",
  Add = "+",
  Minus = "-"
}
interface Op {
  op: OpEnum;
}

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
  [dot](obj: any, key: any) {
    try {
      return obj[key];
    } catch (ex) {
      return ex;
    }
  },
  [OpEnum.Add](...nums: any[]) {
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
  [minus](...nums: any[]) {
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
  [array](...items: any[]) {
    return items;
  },
  [object](...kvs: any[]) {
    const obj = {};
    for (let i = 0; i < kvs.length; i = i + 2) {
      obj[kvs[i]] = kvs[i + 1];
    }
    return obj;
  },
  [lessThan](a: any, b: any) {
    return a < b;
  },
  [strictEqual](a: any, b: any) {
    return a === b;
  }
};

const ops = [];
for (const op in opFuncs) {
  ops.push(op);
}

interface Pkg {
  id: string;
}

interface PkgRef {
  pkg: string;
}

interface Arg {
  scope: string[];
  index?: number;
}

interface Ref {
  ref: string[];
}

type Node = Val | Op | PkgRef | Arg | Ref;
function isVal(node: Node): node is Val {
  return (node as Val).val !== undefined;
}
function isOp(node: Node): node is Op {
  return (node as Op).op != null;
}
function isArg(node: Node): node is Arg {
  return (node as Arg).scope != null;
}
function isRef(node: Node): node is Ref {
  return (node as Ref).ref != null;
}

// type Line = Node[] | Dec[];
type Line = (Node | Dec)[];

interface Dec {
  path: string[];
  line: Line;
  getRepo: { (): Repo };
  repoDict: DecDict;
}

interface DecDict {
  [id: string]: Line;
}

function isDec(node: Node | Dec): node is Dec {
  return (node as Dec).line != null;
}

function isDecList(line: Line): line is Dec[] {
  return isDec(line[0]);
}

interface Repo {
  main: Dec[];
  dict: DecDict;
}

const parseNode = (repoDict: DecDict, node: Node, scopes: Object = {}) => {
  if (isVal(node)) {
    return node.val;
  }
  if (isOp(node)) {
    return opFuncs[node.op];
  }
  if (isRef(node)) {
    const { ref } = node;
    if (typeof ref === "string") {
      return gen(repoDict, [ref], scopes);
    } else {
      return gen(repoDict, ref, scopes);
    }
  }
  if (isArg(node)) {
    const { scope, index } = node;
    const scopeArgs = scopes[scope.join(",")];
    if (!scopeArgs) {
      return; // TODO: fill in defaults (or some other behavior?)
    }
    return scopeArgs[index || 0];
  }
  console.warn("how dis happen");
};

export const gen: any = (repoDict: DecDict, path: string[], scopes: Object = {}) => {
  const decKey = path.join(",");
  const line: Line = repoDict[decKey];
  if (line) {
    const outs: any[] = line.map((node: Node) => parseNode(repoDict, node, scopes));
    const [head, ...tail] = outs;
    if (typeof head === "function") {
      return head(...tail);
    }
    return head;
  }
  return function(...params: any[]) {
    scopes[path.join(",")] = params;
    return gen(repoDict, [...path, "R"], scopes);
  };
};

const Dec = (initial: Dec) => {
  const store: Dec = observable({
    ...initial,
    get mainDict() {
      return initial.getRepo().dict;
    },
    get out() {
      return gen(store.repoDict, store.path);
    }
  });
  return store;
};

export const fillDict = (decList: Dec[], dict = {}) => {
  for (const dec of decList) {
    if (isDecList(dec.line)) {
      fillDict(dec.line, dict);
    } else {
      dict[dec.path.join(",")] = dec.line;
    }
  }
  return dict;
};

export const Repo = (initial: Repo) => {
  const store: Repo = observable({
    main: initial.main.map(dec => Dec({ getRepo: () => store, ...dec })),
    get dict() {
      return fillDict(store.main);
    }
  });
  return store;
};

// const A = (snapshot: { name: string }) => {
//   const store = observable({
//     ...snapshot
//   });
//   return store;
// };

// const a = A({ name: "abc" + 1 });

// a.name = "whut";

// const b: Dec = {
//   line: [{ line: [1, "fiv", 2, 3] }]
// };

const d: Node = { op: OpEnum.Global };
const e: Node = { val: 5 };
const f = d.op === e.val;
