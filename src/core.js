import {
  types,
  getEnv,
  getParent,
  getType,
  flow,
  getSnapshot
} from "mobx-state-tree";
import { isObservableMap } from "mobx";
import { curry, ary } from "lodash";

import { setupContext } from "./context";
import { unminify } from "./minify";
import * as Color from "./color";

const optionalMap = type => types.optional(types.map(type), {});
const optionalString = types.optional(types.string, "");

export const global = "g";
export const access = ".";
export const array = "[";
export const object = "{";
export const mutate = "@";

export const add = "+";
export const subtract = "-";
export const multiply = "*";
export const divide = "/";
export const mod = "%";

export const ifOp = "?";
export const switchOp = "s";
export const forOp = "f";

export const lessThan = "<";
export const greaterThan = ">";
export const lessThanOrEqual = "<=";
export const greaterThanOrEqual = ">=";

export const equal = "==";
export const strictEqual = "===";
export const notEqual = "!=";
export const notStrictEqual = "!==";

export const importOp = "m";
export const newOp = "n";
export const typeofOp = "t";
export const instanceOfOp = "i";
export const classOp = "c";
export const thisOp = "h";

const opFuncs = {
  [global](val) {
    return window[val];
    // return eval(val);
  },
  [access](obj, key) {
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
    for (let i = 0; i < casePairs.length; i += 2) {
      if (switcher === casePairs[i]) {
        return casePairs[i + 1];
      }
    }
  },
  [lessThan](a, b) {
    return a < b;
  }
};

const findInputs = link => {
  const foundInputs = [];
  const { nodes } = link;
  for (const node of nodes) {
    if ("input" in node) {
      foundInputs.push(node.input);
    } else if (node.ref) {
      foundInputs.push(...node.inputs);
    }
  }
  return foundInputs;
};

const Label = types.model("Label", {
  labelId: types.identifier(types.string),
  text: optionalString
});

const LabelSet = types.maybe(types.union(types.string, types.map(Label)));

export const Val = types
  .model("Val", {
    val: types.union(
      types.string,
      types.number,
      types.boolean,
      types.null
      // types.undefined
    )
  })
  .views(self => ({
    get out() {
      return self.val;
    },
    with() {
      return self.out;
    },
    equivalent(other) {
      return self.val === other.val;
    },
    get label() {
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

export const ops = [
  global,
  access,
  array,
  object,
  add,
  subtract,
  multiply,
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
  mutate
];

export const OpEnum = types.enumeration("OpEnum", ops);

export const Op = types
  .model("Op", {
    op: OpEnum
  })
  .views(self => ({
    get out() {
      return opFuncs[self.op];
    },
    with(inputs) {
      return self.out;
    },
    equivalent(other) {
      return self.op === other.op;
    },
    get label() {
      // TODO: look up?
      return self.op;
    },
    get color() {
      return Color.op;
    }
  }));

export const Dependency = types
  .model("Dependency", {
    depId: types.identifier(types.string),
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
        delete snapshot.resolved;
        return snapshot;
      }
    };
  })
  .views(self => {
    const { system } = getEnv(self);

    return {
      get out() {
        if (self.resolved) {
          return system.get(self.path);
        }

        return Dependency;
      },
      with() {
        return self.out;
      },
      equivalent(other) {
        return other === self || other.dep === self;
      },
      get label() {
        return self.path.replace("https://unpkg.com/", "").split("/")[0];
      },
      get color() {
        return Color.dep;
      }
    };
  });

export const DepRef = types
  .model("DepRef", {
    dep: types.reference(Dependency)
  })
  .views(self => ({
    get out() {
      return self.dep.out;
    },
    with() {
      return self.out;
    },
    equivalent(other) {
      return self.dep === other || self.dep === other.dep;
    },
    get label() {
      return self.dep.label;
    },
    get color() {
      return self.dep.color;
    }
  }));

// TYPE-CEPTION
export const stringType = "s";
export const numType = "n";
export const boolType = "b";
export const anyType = "a";
export const InputType = types.enumeration("InputType", [
  stringType,
  numType,
  boolType,
  anyType
]);

// is there a better way of doing this?
export class Hole {
  constructor(...inputSets) {
    this.inputs = {};

    for (const inputSet of inputSets) {
      for (const input in inputSet) {
        this.inputs[input] = true;
      }
    }
  }
}

window._inputs = {};
export const Input = types
  .model("Input", {
    inputId: types.identifier(types.string),
    type: types.maybe(InputType, anyType),
    labelSet: types.maybe(types.union(types.string, types.map(Label)))
  })
  .actions(self => ({
    afterCreate() {
      window._inputs[self.inputId] = {};
    },
    postProcessSnapshot(snapshot) {
      delete snapshot.hack;
      if (!snapshot.labelSet) {
        delete snapshot.labelSet;
      }
      if (!snapshot.type) {
        delete snapshot.type;
      }
      return snapshot;
    }
  }))
  .views(self => {
    const callMap = {};

    return {
      call(callId) {
        return window._inputs[self.inputId][callId];
      },
      get out() {
        // return window._inputs[self.inputId];
      },
      with(inputs) {
        const { input } = self;
        if (inputs && inputs.has(input)) {
          const mapValue = inputs.get(input);
          if (isObservableMap(inputs)) {
            return mapValue.out;
          } else {
            return mapValue;
          }
        } else {
          return new Hole({ [input]: true });
        }
      },
      equivalent(other) {
        return other === self || other.input === self;
      },
      get label() {
        // TODO: look up appropriate label based on user context
        return self.labelSet || `{${self.inputId}}`;
      },
      get color() {
        return Color.input;
      }
    };
  });

export const InputRef = types
  .model("InputRef", {
    input: types.reference(Input)
  })
  .views(self => ({
    call(callId) {
      return self.input.call(callId);
    },
    get out() {
      return self.input.out;
      // return Input;
    },
    with(inputs) {
      return self.input.with(inputs);
    },
    equivalent(other) {
      return self.input === other || self.input === other.input;
    },
    get label() {
      return self.input.label;
    },
    get color() {
      return self.input.color;
    }
  }));

curry.placeholder = Input;

export const Node = types.union(
  Val,
  Op,
  InputRef,
  types.late(() => LinkRef),
  types.late(() => Fn),
  DepRef
);

const derive = nodeOuts => {
  if (nodeOuts.indexOf(Dependency) !== -1) {
    return Dependency;
  }

  const [head, ...args] = nodeOuts;

  if (typeof head !== "function") {
    return head;
  }

  return head(...args);
  // const inputs = nodeInputs.filter(input => input === Input);
  // if (inputs.length) {
  //   const curried = curry(head, nodeInputs.length);
  //   return ary(curried(...nodeInputs), inputs.length);
  // }
};

export const Link = types
  .model("Link", {
    linkId: types.identifier(types.string),
    nodes: types.maybe(types.array(Node)),
    // fun: types.maybe(types.reference(types.late(() => Link))),
    // params: types.maybe(types.array(types.reference(Input))),
    labelSet: LabelSet,
    tags: types.optional(types.array(types.string), [])
  })
  .actions(self => ({
    postProcessSnapshot(snapshot) {
      if (!snapshot.labelSet) {
        delete snapshot.labelSet;
      }
      if (!snapshot.tags.length) {
        delete snapshot.tags;
      }
      return snapshot;
    }
  }))
  .views(self => ({
    call(callId) {
      const { nodes } = self;
      const nodeOuts = nodes.map(
        node => (node.call ? node.call(callId) : node.out)
      );
      if (nodeOuts.indexOf(Dependency) !== -1) {
        return Dependency;
      }
      const [head, ...args] = nodeOuts;
      if (typeof head !== "function") {
        return head;
      }
      return head(...args);
    },
    get inputs() {
      return findInputs(self);
    },
    get out() {
      if (self.inputs.length) {
        const callId = "BASE";
        const { inputs } = self;
        const { length } = inputs;
        const inputIds = inputs.map(input => input.inputId);
        return function(...args) {
          for (let i = 0; i < length; i++) {
            // console.log(inputIds[i], args[i]);
            window._inputs[inputIds[i]][callId] = args[i];
          }
          return self.call(callId);
        };
      }

      const { nodes } = self;
      const nodeOuts = nodes.map(node => node.out);
      if (nodeOuts.indexOf(Dependency) !== -1) {
        return Dependency;
      }
      const [head, ...args] = nodeOuts;
      if (typeof head !== "function") {
        return head;
      }
      return head(...args);
    },
    with(inputs) {
      const nodeOuts = self.nodes.map(node => node.with(inputs));

      const holes = nodeOuts.filter(val => val instanceof Hole);

      if (holes.length) {
        return new Hole(...holes.map(hole => hole.inputs));
      }

      return derive(nodeOuts);
    },
    equivalent(other) {
      return other === self || other.ref === self;
    },
    get label() {
      if (self.labelSet) {
        // TODO: handle maps for localization, icon labels, etc.
        return self.labelSet;
      }

      return `(${self.linkId})`;
    },
    get color() {
      return Color.pending;
    }
  }))
  .actions(self => ({
    addNode(newNode = { val: "🍆" }) {
      // TODO: extend functionality, remove test string
      const { nodes } = self;
      nodes.push(newNode);
      return nodes.length - 1;
    },
    setNode(index, newNode) {
      self.nodes[index] = newNode;
    },
    deleteNode(index) {
      if (self.nodes.length > 1) {
        self.nodes.splice(index, 1);
      }
    },
    setVal(index, val) {
      self.nodes[index].select(val);
    },
    setLabel(text) {
      // TODO: allowing setting for specific label set
      self.labelSet = text;
    }
  }));

export const LinkRef = types
  .model("LinkRef", {
    ref: types.reference(Link)
    // TODO: inputs may be replace-able with simple boolean
    // inputs: types.maybe(types.map(Node))
  })
  .actions(self => ({
    postProcessSnapshot(snapshot) {
      if (!snapshot.inputs) {
        delete snapshot.inputs;
      }
      return snapshot;
    }
  }))
  .views(self => ({
    get inputs() {
      return findInputs(self.ref);
    },
    call(callId) {
      return self.ref.call(callId);
    },
    get out() {
      return self.ref.out;
    },
    with() {
      return self.out;
    },
    equivalent(other) {
      return self.ref === other || self.ref === other.ref;
    },
    get label() {
      return self.ref.label;
    },
    get color() {
      return self.ref.color;
    }
  }));

export const SubParam = types
  .model("SubParam", {
    param: types.number
  })
  .views(self => ({
    get out() {
      return self.param;
    },
    with() {
      return self.out;
    }
  }));

let callIdCounter = 0;
export const Fn = types
  .model("Fn", {
    fn: types.reference(Link),
    callId: types.optional(
      types.identifier(types.number),
      () => callIdCounter++
    )
    // inputs: types.array(types.reference(Input))
  })
  .views(self => ({
    get inputs() {
      return findInputs(self.fn);
    },
    get out() {
      const { inputs, callId } = self;
      const { length } = inputs;
      const inputIds = inputs.map(input => input.inputId);
      return function(...args) {
        for (let i = 0; i < length; i++) {
          // console.log(inputIds[i], args[i]);
          window._inputs[inputIds[i]][callId] = args[i];
        }
        return self.fn.call(callId);
      };
    },
    get label() {
      return self.fn.label;
    },
    get color() {
      return Color.reified;
    }
  }));

// export const SubLink = types
//   .model("SubLink", {
//     subLink: types.number
//   })
//   .views(self => ({
//     get out() {
//       return self.subLink;
//     },
//     with() {
//       return self.out;
//     }
//   }));

// export const SubNode = types.union(
//   Val,
//   Op,
//   InputRef,
//   LinkRef,
//   Fn,
//   SubParam,
//   SubLink,
//   types.late(() => SubRef)
// );

// export const Sub = types
//   .model("Sub", {
//     subId: types.identifier(types.string),
//     nodes: types.map(types.array(SubNode))
//   })
//   .views(self => ({
//     get out() {
//       return self;
//     },
//     with() {
//       return self.out;
//     }
//   }));

// export const SubRef = types
//   .model("SubRef", {
//     subRef: types.reference(Sub)
//   })
//   .views(self => ({
//     get out() {
//       return self.subRef;
//     },
//     with() {
//       return self.out;
//     }
//   }));

let newLinkIdCounter = 0;

export const Repo = types
  .model("Repo", {
    dependencies: optionalMap(Dependency),
    inputs: optionalMap(Input),
    links: optionalMap(Link),
    // subs: optionalMap(Sub),
    linkLabelSets: optionalMap(LabelSet)
  })
  .preProcessSnapshot(
    snapshot => (!snapshot || snapshot.links ? snapshot : unminify(snapshot))
  )
  .views(self => ({
    get linkList() {
      return self.links.values(); //.map(link => ({ value: link.linkId, label: link.label }));
    },
    get inputList() {
      return self.inputs
        .values()
        .map(input => ({ value: input.inputId, label: input.label }));
    },
    get depList() {
      return self.dependencies
        .values()
        .map(dep => ({ value: dep.depId, label: dep.label }));
    }
  }))
  .actions(self => ({
    addLink() {
      const linkId = `N${newLinkIdCounter++}`;

      self.links.put({
        linkId,
        nodes: [{ op: "+" }]
      });

      return linkId;
    },
    putLink(newLink) {
      self.links.put(newLink);
    },
    expandSub(subId, baseId, ...params) {
      const { nodes } = self.subs.get(subId);

      let inputCounter = 0;
      nodes.forEach((subLink, i) => {
        const linkNodes = subLink.map(node => {
          const nodeType = getType(node);
          const { val } = node;
          switch (nodeType) {
            case SubParam:
              return params[val];
            case SubLink:
              return { ref: `${baseId}-${val}` };
            case LinkRef:
              const retVal = { ref: node.ref.linkId };
              return retVal;
            default:
              return val;
          }
        });

        self.links.put({ linkId: `${baseId}-${i}`, nodes: linkNodes });
      });
    }
  }));

export const ContextRepo = setupContext(Repo);
