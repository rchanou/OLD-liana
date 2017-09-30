import { types, getEnv, getRoot, getType, resolveIdentifier, process } from "mobx-state-tree";
import { isObservableMap } from "mobx";
import { curry, ary } from "lodash";

export const reserved = "􂳰";
export const linkKey = "􂳰L";
export const opKey = "􂳰O";
export const valKey = "􂳰V";
export const inputKey = "􂳰I";
export const linkRefKey = "􂳰R";
export const packageKey = "􂳰P";

export const lodash = "_";

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
  [lodash]() {
    return _;
  },
  ifOp(condition, trueVal, falseVal) {
    return condition ? trueVal : falseVal;
  },
  switchOp(context, switcher, ...casePairs) {
    for (let i = 0; i < casePairs.length; i += 2) {
      if (switcher === casePairs[i]) {
        return casePairs[i + 1](context);
      }
    }
  }
};

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
      lodash,
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
    with() {
      return self.val;
    }
  }));

export const Package = types
  .model("Package", {
    id: types.identifier(types.number),
    path: types.string,
    resolved: false
  })
  .actions(self => {
    const { system } = getEnv(self);

    return {
      afterCreate: process(function*() {
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
        return Package;
      },
      with() {
        return self.val;
      }
    };
  });

export const PackageRef = types
  .model("PackageRef", {
    pkg: types.reference(Package)
  })
  .views(self => ({
    get val() {
      return self.pkg.val;
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
export const InputType = types.enumeration("InputType", [stringType, numType, boolType, anyType]);

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
    input: types.identifier(types.string),
    type: types.maybe(InputType, anyType)
  })
  .views(self => ({
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

export const Node = types.union(Val, Op, Input, types.late(() => LinkRef), types.late(() => SubRef), PackageRef);

const identity = x => x;

const baseColor = ",66%,55%)";
const opColor = `hsl(150${baseColor}`;
const valColor = `hsl(210${baseColor}`;
const inputColor = `hsl(25${baseColor}`;
const packageColor = `hsl(315${baseColor}`;
const pendingColor = `hsl(270${baseColor}`;
const unknownColor = `hsl(0${baseColor}`;

export const Link = types
  .model("Link", {
    linkId: types.identifier(types.string),
    nodes: types.array(Node)
  })
  .views(self => ({
    derive(nodeVals) {
      // NOTE: this is a pure function, would it be better to pull this out of the model?
      if (nodeVals.indexOf(Package) !== -1) {
        return Package;
      }

      const [head, ...nodeInputs] = nodeVals;

      if (typeof head === "function") {
        const inputs = nodeInputs.filter(input => input === Input);
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
    with() {
      return self.val;
    }
  }));

export const Call = types
  .model("Call", {
    callId: types.identifier(types.string),
    link: types.reference(Link),
    inputs: types.optional(types.map(Node), {})
  })
  .views(self => ({
    get val() {
      const linkVal = self.link.with(self.inputs);
      if (linkVal instanceof Hole) {
        const inputEntries = self.inputs.entries().slice();
        const holeInputIds = Object.keys(linkVal.inputs);

        return (...newInputs) => {
          const newInputEntries = newInputs.map((input, i) => [holeInputIds[i], input]);
          const allInputEntries = [...inputEntries, ...newInputEntries];
          const allInputs = new Map(allInputEntries);
          return self.nodes.with(allInputs);
        };
      }

      return linkVal;
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

export const SubNode = types.union(Val, Op, Input, LinkRef, SubParam, SubLink, types.late(() => SubRef));

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

export const Label = types.model("Label", {
  id: types.identifier(types.string), // TODO: labels should have own id, not that of link!
  label: types.string
  // linkRef: types.reference(Link) // TODO: use this for link id
});

export const Post = types.model("Post", {
  id: types.identifier(types.string),
  linkRef: types.reference(Link)
});

const getRefPaths = refs => {};

const getLinkDependents = (links, link) => {
  const dependents = new Map();
  links.forEach(linkToCheck => {
    if (linkToCheck.node.some(node => node.ref === linkToCheck)) {
      dependents.set(linkToCheck.linkId, true);
    }
  });
  return dependents;
};

export const Viewport = types
  .model("Viewport", {
    rootLink: types.string,
    expandedLinks: types.optional(types.map(types.boolean), {})
  })
  .views(self => ({
    get isPending() {
      for (const node of self.nodes) {
        const nodeType = getType(node);
        if (nodeType === Input) {
          return true;
        }
        if (nodeType === LinkRef && node.ref.isPending) {
          return true;
        }
      }
      return false;
    },
    display(
      domain,
      link = domain.links.get(self.rootLink),
      base = {
        x: 0,
        y: 10,
        nextIsRef: false,
        isLast: true,
        root: true
      }
    ) {
      // TODO: move to separate model!
      const { linkId, nodes } = link;
      let { x, y, nextIsRef, isLast, path = [linkId], root } = base;

      let allNodes = [];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodeType = getType(node);
        const base = {
          path: [...path, `I${i}`],
          x,
          y: y - 1,
          size: 1,
          root: false
        };

        switch (nodeType) {
          case Op:
            allNodes.push({
              ...base,
              color: opColor,
              text: node.op
            });
            x++;
            break;
          case Val:
            const { val } = node;
            allNodes.push({
              ...base,
              color: valColor,
              text: typeof val === "string" ? `"${val}"` : val
            });
            x++;
            break;
          case Input:
            allNodes.push({
              ...base,
              color: inputColor,
              text: node.input
            });
            x++;
            break;
          case PackageRef:
            allNodes.push({
              ...base,
              color: packageColor,
              text: node.path
            });
            x++;
            break;
          case LinkRef:
            const isLast = i === nodes.length - 1;
            const innerPath = [...path, node.ref.linkId];
            console.log("dat ref doe", node.ref);
            const refChildNodes = self.display(domain, node.ref, {
              path: innerPath,
              x,
              y: y - 1,
              nextIsRef: !isLast && getType(nodes[i + 1]) === LinkRef,
              isLast
            });
            allNodes.push(...refChildNodes);

            const { size } = refChildNodes[refChildNodes.length - 1];
            x += size;
            break;
          default:
            allNodes.push({ ...base, color: unknownColor });
            x++;
        }
      }

      const label = resolveIdentifier(Label, link, link.linkId);

      const thisSize = nextIsRef
        ? Math.max(...allNodes.map(n => n.x)) - base.x + 2
        : isLast ? Math.max(...allNodes.map(n => n.x + n.size)) - base.x : 1;

      const thisNode = {
        path,
        x: base.x,
        y,
        size: thisSize,
        color: pendingColor, //self.isPending ? pendingColor : valColor,
        text: (label && label.label) || `(${self.linkId})`,
        link: true
      };
      allNodes.push(thisNode);

      if (root) {
        const existingKeys = {};
        let i = allNodes.length;
        while (i--) {
          const node = allNodes[i];
          const { path } = node;
          let j = path.length - 1;
          let currentKey = "" + (j in path ? path[j] : "");
          while (existingKeys[currentKey]) {
            j--;
            currentKey += "/" + (j in path ? path[j] : "");
          }
          existingKeys[currentKey] = true;
          node.key = currentKey;
        }
      }

      return allNodes;
    }
  }));

export const Graph = types
  .model("Graph", {
    packages: types.optional(types.map(Package), {}),
    links: types.optional(types.map(types.union(Link, Call)), {}),
    calls: types.optional(types.map(Call), {}),
    subs: types.optional(types.map(Sub), {}),
    labels: types.optional(types.map(Label), {})
    // viewport: Viewport
  })
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

const RefToLink = types.maybe(types.reference(Link));
