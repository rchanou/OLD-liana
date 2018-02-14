import { observable, IObservableObject } from "mobx";

enum NodeKind {
  Val,
  Op,
  PkgRef,
  DecRef,
  ArgRef
}

interface Val {
  val?: string | number | boolean;
}

enum OpEnum {
  Global,
  Dot,
  Add,
  Minus
}
interface Op {
  op: OpEnum;
}

interface Pkg {
  id: string;
}

interface PkgRef {
  pkg: string;
}

interface Arg {
  scope: string[];
  index: number;
}

interface Ref {
  ref: string[];
}

type Node = Val | Op | PkgRef | Arg | Ref;

function isArg(node: Node): node is Arg {
  return (node as Arg).scope != null;
}

function isRef(node: Node): node is Ref {
  return (node as Ref).ref !== undefined;
}

type Line = (Val | Op | PkgRef | Ref)[] | Dec[];
interface Dec {
  path: string[];
  line: Line;
  getRepo: { (): Repo };
  mainDict: Object;
}

function isDec(node: Node | Dec): node is Dec {
  return (node as Dec).line != null;
}

function isDecList(line: Line): line is Dec[] {
  return isDec(line[0]);
}

interface Repo {
  main: Dec[];
  dict: Object;
}

const gen = (dec: Dec, scopes = {}) => {
  const { line, mainDict } = dec;
};

const Dec = (initial: Dec) => {
  const store: Dec & IObservableObject = observable({
    ...initial,
    get mainDict() {
      return initial.getRepo().dict;
    },
    get out() {
      return gen(store);
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

const Repo = (initial: Repo) => {
  const store: Repo & IObservableObject = observable({
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

const parseNode = (node: Node) => {
  if (isArg(node)) {
  }
};
