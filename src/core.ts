import { observable, isObservable, extendObservable } from "mobx";

import { User, UserStore } from "./user";

export const makeStore = (store: any, ...more: object[]) => {
  if (!isObservable(store)) {
    store = observable(store);
  }
  for (const props of more) {
    extendObservable(store, props);
  }
  return store;
};

interface Val {
  val?: string | number | boolean;
}

export enum Op {
  Global = "g",
  Dot = ".",
  Add = "+",
  Minus = "-"
}
interface OpRef {
  op: Op;
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

const opFuncs = Object.freeze({
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
  [Op.Add](...nums: any[]) {
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
});

const ops = [];
for (const op in opFuncs) {
  ops.push(op);
}
Object.freeze(ops);

const defaultOpNames = Object.freeze({
  [Op.Dot]: "•",
  [Op.Global]: "🌐",
  [Op.Add]: "+",
  [Op.Minus]: "-"
});

interface Pkg {
  id: string;
}

interface PkgRef {
  pkg: string;
}

export interface Arg {
  scope: string | string[];
  arg?: number;
}

export interface Ref {
  ref: string[];
}

export type Node = Val | OpRef | PkgRef | Arg | Ref;

export function isVal(node: Node): node is Val {
  return (node as Val).val !== undefined;
}
export function isOp(node: Node): node is OpRef {
  return (node as OpRef).op != null;
}
export function isArg(node: Node): node is Arg {
  return (node as Arg).scope != null;
}
export function isRef(node: Node): node is Ref {
  return (node as Ref).ref != null;
}

type Line = Node[] | Dec[];

export interface Dec {
  id: string;
  line: Line;
}

export type FullLine = FullDec[] | Node[];
export interface FullDec {
  path: string[];
  line: FullLine;
}

export interface DecDict {
  [pathKey: string]: Node[];
}

function isDec(node: Node | Dec): node is Dec {
  return (node as Dec).line != null;
}

export function isDecList(line: Line): line is Dec[] {
  const [first] = line;
  if (!first || typeof first !== "object") {
    return false;
  }
  return isDec(first);
}

function isFullDec(node: Node | FullDec): node is FullDec {
  return (node as FullDec).line != null;
}

export function isFullDecList(line: FullLine): line is FullDec[] {
  return isFullDec(line[0]);
}

const parseNode = (repoDict: DecDict, node: Node, scopes: object = {}) => {
  if (isVal(node)) {
    return node.val;
  }
  if (isOp(node)) {
    return opFuncs[node.op];
  }
  if (isRef(node)) {
    return gen(repoDict, node.ref, scopes);
  }
  if (isArg(node)) {
    const { scope, arg } = node;
    const scopeKey = scope instanceof Array ? scope.join(",") : scope;
    const scopeArgs = scopes[scopeKey];
    if (!scopeArgs) {
      return; // TODO: fill in defaults (or some other behavior?)
    }
    return scopeArgs[arg || 0];
  }
  console.warn("how dis happen");
};

export const gen: any = (
  repoDict: DecDict,
  path: string | string[],
  scopes: object = {}
) => {
  const decKey = path instanceof Array ? path.join(",") : path;
  const line: Line = repoDict[decKey];
  if (line) {
    const outs: any[] = line.map((node: Node) =>
      parseNode(repoDict, node, scopes)
    );
    const [head, ...tail] = outs;
    if (typeof head === "function") {
      return head(...tail);
    }
    return head;
  }
  const returnPath = path instanceof Array ? [...path, "R"] : [path, "R"];
  return function(...params: any[]) {
    scopes[decKey] = params;
    return gen(repoDict, returnPath, scopes);
  };
};

// TODO: strongly type
export const makeDict = (
  decList: Dec[],
  currentPath: string[] = [],
  dict = {}
) => {
  for (const dec of decList) {
    const decPath = [...currentPath, dec.id];
    if (isDecList(dec.line)) {
      makeDict(dec.line, decPath, dict);
    } else {
      dict[decPath.join(",")] = dec.line;
    }
  }
  return dict;
};

interface BaseType {
  nullable?: boolean | string[];
  validatorRef: string[];
  defaultRef: string[];
}

type NumType = BaseType & {
  kind: "N";
  integer?: boolean | string[];
  start?: number | string[];
  end?: number | string[];
  default?: number;
};

type BoolType = BaseType & {
  kind: "B";
  default?: boolean;
};

type StringType = BaseType & {
  kind: "S";
  default?: string;
};

type ObjectType = BaseType & {
  kind: "O";
};

type ValType = NumType | BoolType | StringType | ObjectType;

export interface Repo {
  user?: User;
  main: Dec[];
  params?: {
    [pathKey: string]: {
      type?: ValType;
    }[];
  };
}

export type RepoStore = Repo & {
  user: UserStore;
  readonly full: any; // TODO: type
};

export function fillLine(line: Line, currentPath: string[] = []): FullLine {
  if (isDecList(line)) {
    return line.map((subDec: Dec): FullDec => {
      const path = [...currentPath, subDec.id];
      return {
        path,
        line: fillLine(subDec.line, path)
      };
    });
  }
  return line;
}

type NodeStore = {
  readonly key: string;
  readonly name: string;
  readonly repo: RepoStore;
};

export function Node(initial: Node) {
  if (isVal(initial)) {
    const store: Val & NodeStore = makeStore(initial, {
      get name() {
        return store.val;
      }
    });
    return store;
  }
  if (isOp(initial)) {
    const store = makeStore(initial, {
      get name() {
        return store.op;
      }
    });
    return store;
  }
  if (isRef(initial)) {
    const store: Ref & NodeStore = makeStore(initial, {
      get name() {
        return store.repo.user.nameSet[store.ref.join()];
      }
    });
    return store;
  }
  if (isArg(initial)) {
    const store: Arg & NodeStore = makeStore(initial, {
      get key() {
        const { scope, arg } = store;
        return scope instanceof Array ? [...scope, arg] : [scope, arg];
      },
      get name() {
        return store.repo.user.nameSet[store.key];
      }
    });
    return store;
  }
  return makeStore(initial, {
    get name() {
      return "???";
    }
  });
}

export function Repo(initial: Repo) {
  const nodeStoreContext = {
    get repo() {
      return store;
    }
  };
  const Dec = ({ id, line }: Dec): Dec => makeStore({ id, line: Line(line) });
  const Line = (initial: Line) => {
    if (isDecList(initial)) {
      return initial.map(Dec);
    } else {
      return initial.map(node => makeStore(Node(node), nodeStoreContext));
    }
  };
  const store: RepoStore = makeStore({
    main: Line(initial.main),
    get full() {
      return fillLine(store.main);
    },
    get dict() {
      return makeDict(store.main);
    }
  });
  return store;
}
