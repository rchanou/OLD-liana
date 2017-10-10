import { types, getEnv, getRoot, getType, resolveIdentifier, process } from "mobx-state-tree";
import { isObservableMap } from "mobx";
import { curry, ary } from "lodash";

const optionalString = types.optional(types.string, "");
const optionalMap = type => types.optional(types.map(type), {});

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
    // TODO: remove
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

export const Dependency = types
  .model("Dependency", {
    depId: types.identifier(types.string),
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
        return Dependency;
      },
      with() {
        return self.val;
      }
    };
  });

export const PackageRef = types
  .model("PackageRef", {
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
      if (nodeVals.indexOf(Dependency) !== -1) {
        return Dependency;
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
    inputs: optionalMap(Node)
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
  labelId: types.identifier(types.string), // TODO: labels should have own id, not that of link!
  text: optionalString,
  targetId: optionalString,
  groupId: optionalString,
  locale: optionalString
});

export const Comment = types.model("Post", {
  postId: types.identifier(types.string),
  text: optionalString,
  targetId: optionalString
});

const Path = types.array(types.union(types.string, types.number));

const Box = types.model("Box", {
  x: types.number,
  y: types.number,
  path: Path,
  dependents: types.map(Path)
});

export const makeRepoViewModel = repo =>
  types
    .model("RepoView", {
      rootLink: types.string,
      openPaths: optionalMap(types.boolean),
      labelGroup: types.optional(types.string, "standard"),
      selectedPath: types.optional(Path, []),
      selectedIndex: types.maybe(types.number, 0)
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
      get selectedBox() {
        const { selectedPath, selectedIndex, boxes } = self;

        if (selectedIndex === null) return true;

        const selectedPathLength = selectedPath.length;

        if (!selectedPathLength) {
          return false;
        }

        return boxes().find(
          box =>
            box.path.length === selectedPathLength + 1 &&
            selectedPath.every((x, i) => x === box.path[i]) &&
            box.path[selectedPathLength] === selectedIndex
        );
      },
      get isLinkSelected() {
        const { selectedBox } = self;

        if (!selectedBox) {
          return false;
        }

        return selectedBox.category === Link;
      },
      get pathKey() {
        return self.selectedPath.concat(self.selectedIndex).join("/");
      },
      boxes(link, opts = {}) {
        const { links } = repo;
        const { rootLink, openPaths, selectedPath, selectedIndex } = self;
        link = link || links.get(rootLink);
        const { linkId, nodes } = link;
        const {
          x = 0,
          y = 0,
          nextIsRef = false,
          isLast = true,
          path = [linkId],
          linkPath = [linkId],
          root = true,
          selected = false,
          siblingCount = 1,
          open = true
        } = opts;

        const allBoxes = [];

        const sameAsSelectedPath =
          selectedPath.length === linkPath.length && selectedPath.every((token, j) => token === linkPath[j]);

        let currentX = x;

        const siblings = nodes.length;
        for (let i = 0; i < siblings; i++) {
          const childPath = [...linkPath, i];

          const node = nodes[i];
          const category = getType(node);

          const defaultBox = {
            path: childPath,
            x: currentX,
            y: y + 1,
            size: 1,
            root: false,
            selected: sameAsSelectedPath && selectedIndex === i,
            category,
            siblings,
            downPath: linkPath.slice(0, -1)
          };

          switch (category) {
            case LinkRef:
              if (!openPaths.get(childPath.join("/"))) {
                const label = resolveIdentifier(Label, repo, node.ref.linkId);
                allBoxes.push({
                  ...defaultBox,
                  text: (label && label.text) || `(${self.linkId})`,
                  color: pendingColor
                });
                currentX++;
                break;
              }
              const isLast = i === nodes.length - 1;
              const refChildNodes = self.boxes(node.ref, {
                root: false,
                path: childPath,
                linkPath: [...linkPath, node.ref.linkId],
                x: currentX,
                y: y + 1,
                nextIsRef: !isLast && getType(nodes[i + 1]) === LinkRef,
                isLast,
                selected: sameAsSelectedPath && selectedIndex === i,
                siblingCount: siblings,
                open: openPaths.has(linkPath.join("/"))
              });
              allBoxes.push(...refChildNodes);

              const { size } = refChildNodes[refChildNodes.length - 1];
              currentX += size;
              break;
            case Op:
              allBoxes.push({
                ...defaultBox,
                color: opColor,
                text: node.op
              });
              currentX++;
              break;
            case Val:
              const { val } = node;
              allBoxes.push({
                ...defaultBox,
                color: valColor,
                text: typeof val === "string" ? `"${val}"` : val
              });
              currentX++;
              break;
            case Input:
              allBoxes.push({
                ...defaultBox,
                color: inputColor,
                text: node.input
              });
              currentX++;
              break;
            case PackageRef:
              allBoxes.push({
                ...defaultBox,
                color: packageColor,
                text: node.dep.path.replace("https://unpkg.com/", "").slice(0, 9)
              });
              currentX++;
              break;
            default:
              allBoxes.push({ ...defaultBox, color: unknownColor });
              currentX++;
          }
        }

        const label = resolveIdentifier(Label, repo, link.linkId);
        const thisSize = nextIsRef
          ? Math.max(...allBoxes.map(n => n.x)) - x + 2
          : isLast ? Math.max(...allBoxes.map(n => n.x + n.size)) - x : 1;

        const thisNode = {
          path,
          upPath: linkPath,
          ...(root ? {} : { downPath: linkPath.slice(0, -23) }),
          x,
          y,
          size: thisSize,
          color: pendingColor, //self.isPending ? pendingColor : valColor,
          text: (label && label.text) || `(${link.linkId})`,
          category: Link,
          selected: selected || (sameAsSelectedPath && selectedIndex === null),
          siblings: siblingCount
        };
        allBoxes.push(thisNode);

        if (root) {
          const existingKeys = {};
          let i = allBoxes.length;
          while (i--) {
            const box = allBoxes[i];
            const { path } = box;
            let j = path.length - 1;
            let currentKey = "" + (j in path ? (box.link ? path[j] : `I${path[j]}`) : "");
            if (!box.link) {
              j--;
              currentKey += "/" + (j in path ? path[j] : "");
            }
            while (existingKeys[currentKey]) {
              j--;
              currentKey += "/" + (j in path ? path[j] : "");
            }
            existingKeys[currentKey] = true;
            box.key = currentKey;
          }
        }

        return allBoxes;
      }
    }))
    .actions(self => ({
      move(dir) {
        const { siblings } = self.selectedBox;
        let newSelectedIndex = self.selectedIndex + dir;
        if (newSelectedIndex < 0) {
          newSelectedIndex = siblings - 1;
        } else if (newSelectedIndex > siblings - 1) {
          newSelectedIndex = 0;
        }
        self.selectedIndex = newSelectedIndex;
      },
      up() {
        const { selectedBox } = self;
        const { upPath } = selectedBox;
        if (upPath) {
          self.selectedPath = upPath;
          self.selectedIndex = 0;
        }
      },
      down() {
        const { selectedBox } = self;
        const { downPath } = selectedBox;
        if (downPath) {
          self.selectedPath = downPath;
          self.selectedIndex = 0;
        }
      },
      open() {
        const { pathKey } = self;
        const current = self.openPaths.get(pathKey);
        self.openPaths.set(pathKey, !current);
        console.log("le key", pathKey);
      }
    }))
    .actions(self => {
      const context = getEnv(self);
      const { keyMap } = context;

      const handleKeyUp = e => {
        e.preventDefault();

        const { keyCode } = e;
        const actionName = keyMap[keyCode];
        switch (actionName) {
          case "left":
            self.move(-1);
            break;
          case "right":
            self.move(+1);
            break;
          case "up":
            self.up();
            break;
          case "down":
            self.down();
            break;
          case "open":
            self.open();
            break;
          default:
            const action = self[actionName];
            if (typeof action === "function") {
              action(context);
            }
            console.log(keyCode);
        }
      };

      return {
        afterCreate() {
          document.addEventListener("keyup", handleKeyUp);
        },
        beforeDestroy() {
          document.removeEventListener("keyup", handleKeyUp);
        }
      };
    });

export const Repo = types
  .model("Repo", {
    dependencies: optionalMap(Dependency),
    links: optionalMap(types.union(Link, Call)),
    subs: optionalMap(Sub),
    linkLabelSets: optionalMap(optionalMap(Label)),
    linkComments: optionalMap(Comment),
    subLabels: optionalMap(Label),
    subComments: optionalMap(Comment),
    branchLabels: optionalMap(Label),
    branchComments: optionalMap(Comment)
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
