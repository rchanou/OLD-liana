const test = {
  0: [{ o: "." }, { o: "g" }, "Math"],
  1: [{ o: "." }, { r: 0 }, "pow"],
  2: [{ r: 1 }, 5, 2]
};

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
    default:
      return calc(node.r);
  }
};

const calc = id => {
  const nodes = test[id];
  const [func, ...args] = nodes.map(calcNode);

  return func(...args);
};

const a = calc(2);
console.log(a, global.Math.pow(5, 2));

const reify = (id, ...argSlots) => {
  if (argSlots.some(([slotId]) => slotId == id)) {
    const [head, ...tail] = test[id];
    const headVal = calcNode(head);
    const tailVals = [];
    const argIndices = [];
    for (let i = 0; i < tail.length; i++) {
      if (argSlots.some(([slotId, j]) => slotId == id && j - 1 == i)) {
        argIndices.push(i);
      } else {
        tailVals[i] = calcNode(tail[i]);
      }
    }

    return (...args) => {
      const vals = [...tailVals];
      for (let i = 0; i < args.length; i++) {
        vals[argIndices[i]] = args[i];
      }

      return headVal(...vals);
    };
  }

  return calc(id);
  // const holes = [];

  // const nodes = test[id];

  // const funcArgs =[]
  // for (let i = 0; i < nodes.length; i++) {
  //   if (argSlots.some(([key, j]) => key == id && j == i)) {

  //   } else {
  //     funcArgs[i]=
  //   }

  // if (argSlots.some(([argId])=> id==argId)){

  // }

  // const done = nodes.map(node=>{

  // })
};

const b = reify(2, [2, 1]);
console.log(b(12), Math.pow(12, 2));
