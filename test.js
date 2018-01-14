const base = {
  0: [{ o: "." }, { o: "g" }, "Math"],
  1: [{ o: "." }, { r: 0 }, "pow"],
  20: 5,
  21: 12,
  2: [{ r: 1 }, { r: 20 }, 2],
  3: [{ r: 1 }, { r: 21 }, 2],
  4: [{ o: "." }, { r: 0 }, "sqrt"],
  5: [{ o: "+" }, { r: 2 }, { r: 3 }],
  6: [{ r: 4 }, { r: 5 }]
};

const calc = (repo, id) => {
  const calcNode = node => {
    if (typeof node !== "object") {
      return node;
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
      default:
        return calc(repo, node.r);
    }
  };

  const nodes = repo[id];

  if (!Array.isArray(nodes)) {
    return calcNode(nodes);
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

const reify = (repo, id, ...argIds) => {
  return (...args) => {
    for (let i = 0; i < argIds.length; i++) {
      repo[argIds[i]] = args[i];
    }

    return calc(repo, id);
  };
};

const a = calc(base, 6);
console.log(a, global.Math.pow(5, 2));

const b = reify(base, 2, 20);
console.log(b(12), Math.pow(12, 2));

const d = reify(base, 6, 20, 21);
console.log("d", d(11, 60), d(7, 24, "hullaballoo"), d(), d(3));
