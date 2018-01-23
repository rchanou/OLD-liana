const p = obj => JSON.stringify(obj, true, 2);

const ops = {
  dot: (o, k) => o[k],
  add(...nums) {
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
  minus: (x, y) => x - y,
  sw: (switcher, ...casePairs) => {
    const { length } = casePairs;
    for (let i = 0; i < length; i += 2) {
      if (switcher === casePairs[i]) {
        return casePairs[i + 1];
      }
    }
    if (length % 2) {
      return casePairs[length - 1];
    }
  },
  eq: (a, b) => a === b,
  iif: (cond, trueVal, falseVal) => (cond ? trueVal : falseVal),
  obj: (...kvs) => {
    const obj = {};
    for (let i = 0; i < kvs.length; i = i + 2) {
      obj[kvs[i]] = kvs[i + 1];
    }
    return obj;
  },
  call: (obj, methodName, ...args) => obj[methodName](...args),
  mutate: (obj, key, value) => (obj[key] = value)
};

const test = {
  z: {
    R: [0] // identity
  },
  a: ["add", 0, [1]], // incrementer
  b: ["minus", 0, [1]], // decrementr
  c: ["sw", 0, ["INCREMENT"], "a", ["DECREMENT"], "b", "z"], // get updater from type
  d: ["dot", 0, ["type"]], // get type
  e: {
    a: ["d", 0], // action type
    R: ["c", { e: "a" }] // get updater from action
  },
  f: {
    a: ["e", 1], // updater
    R: [{ f: "a" }, 0] // counter when not zero
  },
  g: {
    R: [[0]] // get zero
  },
  h: {
    a: ["eq", 0, [undefined]], // is undefined
    b: ["iif", { h: "a" }, "g", "f"], // counter to use
    R: [{ h: "b" }, 1] // counter
  },
  j: ["dot", [window], ["Redux"]], // redux
  k: ["dot", [Redux], ["createStore"]], // create store
  l: ["k", "h"], // counter store
  m: ["dot", 0, ["dispatch"]], // get store dispatch
  n: {
    a: ["m", 0],
    b: ["obj", ["type"], ["INCREMENT"]],
    R: [{ n: "a" }, { n: "b" }] // dispatch inc
  },
  o: {
    a: ["m", 0],
    b: ["obj", ["type"], ["DECREMENT"]],
    R: [{ o: "a" }, { o: "b" }] // dispatch dec
  }
  // p: {
  //   a: {
  //     b: {
  //       R: ["add", { a: 0 }, { b: 0 }, 0]
  //     },
  //     R: ["b"]
  //   },
  //   R: ["a"]
  // }
};

const mergePaths = (base, walk) => {
  const finalPath = [...base];
  for (const token of walk) {
    if (token === "..") {
      finalPath.pop();
    } else {
      finalPath.push(token);
    }
  }
  return finalPath;
};

const walkPath = (base, up, walk) => {
  const finalPath = [...base];
  while (up--) {
    finalPath.pop();
  }
  for (const token of walk) {
    finalPath.push(token);
  }
  return finalPath;
};

const gen = (program, path = [], out = {}, args = {}) => {
  return function(...params) {
    if (params.length) {
      if (!path.length) {
        args.S = params;
      } else {
        let scopeArgs = args;
        let i = 0;
        for (i; i < path.length - 1; i++) {
          const key = path[i];
          if (!scopeArgs[key]) {
            scopeArgs[key] = {};
          }
          scopeArgs = scopeArgs[key];
        }
        scopeArgs[path[i]] = params;
      }
    }
    const call = line => {
      const tokens = line.map(word => {
        if ("V" in word) {
          return word.V;
        }
        if ("O" in word) {
          const op = ops[word.O];
          if (!op) {
            throw new Error("invalid op");
          }
          return op;
        }
        if ("A" in word) {
          if (typeof word.A === "number") {
            return params[word.A];
          } else {
            const [scopeLevel, ...argWalk] = word.A;
            const argPath = walkPath(path, scopeLevel, argWalk);
            let subArgs = args;
            let i = 0;
            for (i; i < argPath.length - 1; i++) {
              subArgs = args[argPath[i]];
            }
            return subArgs.S[argPath[i]];
          }
        }
        if (Array.isArray(word)) {
          const [scopeLevel, ...refWalk] = word;
          const outPath = walkPath(path, scopeLevel, refWalk);
          let subOut = out;
          for (let i = 0; i < outPath.length; i++) {
            subOut = subOut[outPath[i]];
          }
          console.log(path, word, outPath, subOut, out);
          return subOut;
        }
      });
      const [head, ...tail] = tokens;
      return typeof head === "function" ? head(...tail) : head;
    };
    let scope;
    if (!path.length) {
      scope = program;
    } else {
      for (const id of path) {
        scope = program[id];
      }
    }
    for (const id in scope) {
      const line = scope[id];
      if (typeof line === "string") {
        out[id] = out[line];
      } else if (Array.isArray(line)) {
        out[id] = call(line);
      } else if (typeof line === "object") {
        out[id] = gen(scope, [...path, id], out, args);
      } else {
        out[id] = line;
      }
    }
    // console.log(path, p(args), "args");
    window.o = out;
    window.a = args;
    return out.R;
  };
};

const t2 = {
  a: [{ O: "add" }, { V: 1 }, { V: 2 }],
  b: {
    R: [{ V: "fu" }]
  },
  c: [["b"]],
  d: {
    R: [{ O: "add" }, { A: 0 }, { V: 1 }]
  },
  e: {
    R: [{ O: "minus" }, { A: 0 }, { V: 1 }]
  },
  f: {
    b: [{ V: 7 }],
    a: {
      b: [{ O: "add" }, { A: [1, 0] }, { A: 0 }, [1, "b"]],
      R: "b"
    },
    R: "a"
  },
  g: [["f"], { V: 8 }],
  h: [["g"], { V: 9 }],
  i: [["d"], { V: 4 }],
  j: { R: [{ O: "dot" }, { A: 0 }, { V: "type" }] },
  R: [{ v: "foo" }]
};

const cTest = gen(t2);
// console.log(cTest(1, 2, 3));
const dTest = gen(t2.f);
console.log("hmm", dTest(3)(5));
console.log(gen(t2.j)({ type: "WUT" }));

// console.log(parse(test, "a")(3), 4);

// const zTest = parse(test, "z");
// console.log(zTest(321), 321);

// const updater = parse(test, "e");
// console.log(updater({ type: "INCREMENT" })(4), 5);

// const reducer = parse(test, "f");
// console.log(
//   reducer(0, { type: "INCREMENT" }),
//   1,
//   reducer(3, { type: "DECREMENT" }),
//   2,
//   reducer(5, { type: "INCREMENT" }),
//   6
// );

// const counter = parse(test, "h");
// console.log(counter(), 0);
// console.log(counter(3, { type: "INCREMENT" }), 4);
// console.log(counter(3, { type: "DECREMENT" }), 2);

// const store = parse(test, "l");
// const dispatchInc = parse(test, "n");
// const dispatchDec = parse(test, "o");
// store.dispatch({ type: "INCREMENT" });
// dispatchInc(store);
// dispatchInc(store);
// store.dispatch({ type: "DECREMENT" });
// dispatchInc(store);
// dispatchInc(store);
// dispatchInc(store);
// dispatchInc(store);
// dispatchDec(store);
// dispatchInc(store);
// console.log(store.getState(), 6);
