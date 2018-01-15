const util = require("util");

const base = {
  // i: { 0: 3, 1: 5, 2: 12 },
  i: {},
  _d: {},
  0: [{ o: "." }, { o: "g" }, "Math"],
  1: [{ o: "." }, { r: 0 }, "pow"],
  2: [{ r: 1 }, { i: 0 }, 2],
  3: [{ r: 1 }, { i: 1 }, 2],
  4: [{ o: "." }, { r: 0 }, "sqrt"],
  5: [{ o: "+" }, { r: 2 }, { r: 3 }],
  6: [{ r: 4 }, { r: 5 }],
  7: [{ r: 1 }, { i: 2 }, 3],
  9: [{ f: 6 }, 29, 420],
  11: [{ f: 6 }, 13, 84],
  12: [{ o: "." }, { o: "g" }, "setInterval"],
  13: [{ o: "." }, { o: "g" }, "console"],
  14: [{ o: "." }, { r: 13 }, "log"]
  // 15:[{]
};

const findInputs = (repo, nodes) => {
  const foundInputs = [];
  for (const node of nodes) {
    if (typeof node === "object") {
      if ("i" in node) {
        foundInputs.push(node.i);
      } else if ("r" in node) {
        const innerNodes = repo[node.r];
        const innerInputs = findInputs(repo, innerNodes);
        foundInputs.push(...innerInputs);
      }
    }
  }
  return foundInputs;
};

const calc = (repo, id, root = true) => {
  const calcNode = node => {
    if (typeof node !== "object") {
      return node;
    }

    if ("i" in node) {
      return repo.i[node.i];
    }

    if ("f" in node) {
      return defn(repo, node.f);
    }

    switch (node.o) {
      case "g":
        return global;
      case ".":
        return function(a, b) {
          return a[b];
        };
      case "+":
        return function(a, b) {
          return a + b;
        };
    }

    return calc(repo, node.r, false);
  };

  const nodes = repo[id];

  if (root && nodes.some(node => typeof node === "object" && "i" in node)) {
    return defn(repo, id);
  }
  const [funcNode, ...argNodes] = nodes;
  const funcVal = calcNode(funcNode);

  if (typeof funcVal !== "function") {
    // TODO: could this possibly have different behavior?
    return funcVal;
  }

  const argVals = argNodes.map(calcNode);
  return funcVal(...argVals);
};

const defn = (repo, id, ...argIds) => {
  if (!argIds.length) {
    const nodes = repo[id];
    const defaultArgIds = findInputs(repo, nodes);
    return defn(repo, id, ...defaultArgIds);
  }

  if (!repo._d[id]) {
    repo._d[id] = [];
  }
  const past = repo._d[id];

  return (...args) => {
    const latest = { i: args };
    past.push(latest);
    for (let i = 0; i < argIds.length; i++) {
      repo.i[argIds[i]] = args[i];
    }
    const out = calc(repo, id, false);
    latest.o = out;
    return out;
  };
};

const a = calc(base, 2);
console.log(a(3), global.Math.pow(3, 2));

const b = defn(base, 7, 2);
console.log(b(9), Math.pow(9, 3));

const d = calc(base, 6);
console.log(d, 61);
// console.log(d(7, 24), 25);
// console.log(d());
// console.log(d(3));

const e = calc(base, 9);
console.log(e, 421);

const f = defn(base, 2);
console.log(f(7), 49);
console.log(calc(base, 11), 85);

console.log(util.inspect(base._d, { depth: null }));
