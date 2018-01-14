const produce = require("immer").default;

const base = {
  0: [{ o: "." }, { o: "g" }, "Math"],
  1: [{ o: "." }, { r: 0 }, "pow"],
  2: [{ r: 1 }, 5, 2],
  3: [{ r: 1 }, 12, 2],
  4: [{ o: "." }, { r: 0 }, "sqrt"],
  5: [{ o: "+" }, { r: 2 }, { r: 3 }],
  6: [{ r: 4 }, { r: 5 }]
};

const calc = (repo, id) => {
  const nodes = repo[id];
  const [func, ...args] = nodes.map(node => {
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
  });
  return func(...args);
};

const a = calc(base, 6);
console.log(a, global.Math.pow(5, 2));

const reify = (repo, id, ...argSlots) => {
  return (...args) => {
    const modded = produce(repo, draft => {
      for (let i = 0; i < argSlots.length; i++) {
        const [slotId, slotIndex] = argSlots[i];
        draft[slotId][slotIndex] = args[i];
      }
    });
    return calc(modded, id);
  };

  // const argIndices = [];

  // const subReify = id => {
  //   if (argSlots.some(([slotId]) => slotId == id)) {
  //     const [head, ...tail] = test[id];
  //     const headVal = calcNode(head);
  //     const tailVals = [];
  //     for (let i = 0; i < tail.length; i++) {
  //       if (argSlots.some(([slotId, j]) => slotId == id && j - 1 == i)) {
  //         argIndices.push(i);
  //       } else {
  //         const node = tail[i];
  //         if (typeof node === "object" && node.r) {
  //           const wut = subReify(node.r);
  //         } else {
  //           tailVals[i] = calcNode(tail[i]);
  //         }
  //       }
  //     }
  //   }

  //   return calc(id);
  // };

  // return (...args) => {
  //   const vals = [...tailVals];
  //   for (let i = 0; i < args.length; i++) {
  //     vals[argIndices[i]] = args[i];
  //   }

  //   return headVal(...vals);
  // };
};

const b = reify(base, 2, [2, 1]);
console.log(b(12), Math.pow(12, 2));

const d = reify(base, 6, [2, 1], [3, 1]);
console.log("d", d(11, 60));
