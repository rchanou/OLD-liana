import { types, getEnv, getParent, getType, flow } from "mobx-state-tree";
import { isObservableMap } from "mobx";
import { curry, ary } from "lodash";

import { makeContextModel } from "./context";

const optionalMap = type => types.optional(types.map(type), {});
const optionalString = types.optional(types.string, "");

export const global = "g";

export const access = ".";

export const array = "[";
export const object = "{";

export const add = "+";
export const subtract = "-";
export const multiply = "*";
export const divide = "/";
export const mod = "%";

export const ifOp = "?";
export const switchOp = "s";
export const forOp = "f";
export const importOp = "m";
export const newOp = "n";
export const typeofOp = "t";
export const instanceOfOp = "i";
export const classOp = "c";
export const thisOp = "h";

export const lessThan = "<";
export const greaterThan = ">";
export const lessThanOrEqual = "<=";
export const greaterThanOrEqual = ">=";
export const equal = "==";
export const strictEqual = "===";
export const notEqual = "!=";
export const notStrictEqual = "!==";

export const swap = "@";

const opFuncs = {
  [global](val) {
    return window[val];
    // return eval(val);
  },
  [access](obj, key) {
    return obj[key];
  },
  [add](...nums) {
    let sum = 0;
    for (const num of nums) {
      sum += num;
    }
    return sum;
  },
  [array](...items) {
    return items;
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
  }
};

const Label = types.model("Label", {
  labelId: types.identifier(types.string),
  text: optionalString
});

const LabelSet = types.maybe(types.union(types.string, types.map(Label)));

export const Val = types
  .model("Val", {
    val: types.union(types.string, types.number, types.boolean, types.null)
  })
  .views(self => ({
    with() {
      return self.val;
    }
  }));

export const Op = types
  .model("Op", {
    op: types.enumeration("OpEnum", [
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
      swap
    ])
  })
  .views(self => ({
    get val() {
      return opFuncs[self.op];
    },
    with(inputs) {
      return self.val;
    }
  }));

export const Dependency = types
  .model("Dependency", {
    depId: types.identifier(types.string),
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
      })
    };
  })
  .views(self => {
    const { system } = getEnv(self);

    return {
      get val() {
        if (self.resolved) {
          return system.get(self.path);
        }
        return Dependency;
      },
      with() {
        return self.val;
      }
    };
  });

export const DepRef = types
  .model("DepRef", {
    dep: types.reference(Dependency)
  })
  .views(self => ({
    get val() {
      return self.dep.val;
    },
    with() {
      return self.val;
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
class Hole {
  constructor(...inputSets) {
    this.inputs = {};

    for (const inputSet of inputSets) {
      for (const input in inputSet) {
        this.inputs[input] = true;
      }
    }
  }
}

export const Input = types
  .model("Input", {
    inputId: types.identifier(types.string),
    type: types.maybe(InputType, anyType),
    labelSet: types.maybe(types.union(types.string, types.map(Label)))
  })
  .views(self => ({
    get label() {
      return self.labelSet;
    },

    get val() {
      return Input;
    },
    with(inputs) {
      const { input } = self;
      if (inputs && inputs.has(input)) {
        const mapValue = inputs.get(input);
        if (isObservableMap(inputs)) {
          return mapValue.val;
        } else {
          return mapValue;
        }
      } else {
        return new Hole({ [input]: true });
      }
    }
  }));

curry.placeholder = Input;

export const InputRef = types
  .model("InputRef", {
    input: types.reference(Input)
  })
  .views(self => ({
    get label() {
      return self.input.label;
    },
    get val() {
      return Input;
    },
    with(inputs) {
      return self.input.with(inputs);
    }
  }));

export const Node = types.union(
  Val,
  Op,
  InputRef,
  types.late(() => LinkRef),
  types.late(() => CallRef),
  types.late(() => SubRef),
  DepRef
);

export const Link = types
  .model("Link", {
    linkId: types.identifier(types.string),
    nodes: types.array(Node),
    labelSet: LabelSet
  })
  .views(self => ({
    get label() {
      // TODO: handle maps for localization, icon labels, etc.
      return self.labelSet;
    },
    derive(nodeVals) {
      // NOTE: this is a pure function, would it be better to pull this out of the model?
      if (nodeVals.indexOf(Dependency) !== -1) {
        return Dependency;
      }

      const [head, ...nodeInputs] = nodeVals;

      if (typeof head === "function") {
        const inputs = nodeInputs.filter(input => input === InputRef);
        if (inputs.length) {
          const curried = curry(head, nodeInputs.length);
          return ary(curried(...nodeInputs), inputs.length);
        }
        return head(...nodeInputs);
      } else {
        return head;
      }
    },
    get val() {
      const nodeVals = self.nodes.map(node => node.val);
      return self.derive(nodeVals);
    },
    with(inputs) {
      const nodeVals = self.nodes.map(node => node.with(inputs));

      const holes = nodeVals.filter(val => val instanceof Hole);

      if (holes.length) {
        return new Hole(...holes.map(hole => hole.inputs));
      }

      return self.derive(nodeVals);
    }
  }));

export const LinkRef = types
  .model("LinkRef", {
    ref: types.reference(Link)
  })
  .views(self => ({
    get val() {
      return self.ref.val;
    },
    with(inputs) {
      return self.ref.with(inputs);
    }
  }));

export const Call = types
  .model("Call", {
    callId: types.identifier(types.string),
    link: types.reference(Link),
    inputs: optionalMap(Node)
  })
  .views(self => ({
    get val() {
      const linkVal = self.link.with(self.inputs);
      if (linkVal instanceof Hole) {
        const inputEntries = self.inputs.entries().slice();
        const holeInputIds = Object.keys(linkVal.inputs);

        return (...newInputs) => {
          const newInputEntries = newInputs.map((input, i) => [
            holeInputIds[i],
            input
          ]);
          const allInputEntries = [...inputEntries, ...newInputEntries];
          const allInputs = new Map(allInputEntries);
          return self.link.with(allInputs);
        };
      }

      return linkVal;
    },
    with() {
      return self.val;
    }
  }));

export const CallRef = types
  .model("CallRef", {
    call: types.reference(Call)
  })
  .views(self => ({
    get val() {
      return self.call.val;
    },
    with() {
      return self.val;
    }
  }));

export const SubParam = types
  .model("SubParam", {
    param: types.number
  })
  .views(self => ({
    get val() {
      return self.param;
    },
    with() {
      return self.val;
    }
  }));

export const SubLink = types
  .model("SubLink", {
    subLink: types.number
  })
  .views(self => ({
    get val() {
      return self.subLink;
    },
    with() {
      return self.val;
    }
  }));

export const SubNode = types.union(
  Val,
  Op,
  InputRef,
  LinkRef,
  CallRef,
  SubParam,
  SubLink,
  types.late(() => SubRef)
);

export const Sub = types
  .model("Sub", {
    subId: types.identifier(types.string),
    nodes: types.map(types.array(SubNode))
  })
  .views(self => ({
    get val() {
      return self;
    },
    with() {
      return self.val;
    }
  }));

export const SubRef = types
  .model("SubRef", {
    subRef: types.reference(Sub)
  })
  .views(self => ({
    get val() {
      return self.subRef;
    },
    with() {
      return self.val;
    }
  }));

const Repo = types
  .model("Repo", {
    dependencies: optionalMap(Dependency),
    inputs: optionalMap(Input),
    links: optionalMap(types.union(Link, Call)),
    subs: optionalMap(Sub),
    linkLabelSets: optionalMap(LabelSet),
    selectedLabelSet: types.maybe(types.reference(LabelSet))
  })
  .views(self => ({
    linkLabel(link) {}
  }))
  .actions(self => ({
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

export const ContextRepo = makeContextModel(Repo);
