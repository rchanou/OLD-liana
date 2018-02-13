import { observable } from "mobx";

enum NodeKind {
  Val,
  Op,
  PkgRef,
  DecRef,
  ArgRef
}

// interface Node {
//   kind: NodeKind;
//   code: boolean | number | string | (string | number)[];
// }

interface Val {
  // kind: NodeKind.Val;
  // kind: "val";
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

interface PkgRef {
  path: string;
}

interface Arg {
  arg: (string | number)[];
}

interface Ref {
  ref: (string)[];
}

type Node = Val | Op | PkgRef | Arg | Ref;

function isArg(node: Node): node is Arg {
  if ((<Arg>node).arg === undefined) {
    return false;
  }
  const { arg } = <Arg>node;
  const lastI = arg.length - 1;
  for (let i = 0; i < lastI; i++) {
    if (typeof arg[i] !== "string") {
      return false;
    }
  }
  return typeof arg[lastI] === "number";
}

function isRef(node: Node): node is Ref {
  return (<Ref>node).ref !== undefined;
}

interface Dec {
  line: (Val | Op | PkgRef | Ref)[] | Dec[];
}

interface Repo {
  name: string;
  main: Dec;
}

const A = (snapshot: { name: string }) => {
  const store = observable({
    ...snapshot
  });
  return store;
};

const a = A({ name: "abc" + 1 });

a.name = "whut";

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

const tandem = (array: any[], idKey: string) => {
  (<any>array).obj = {};
  return array;
};
