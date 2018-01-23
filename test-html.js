const p = obj => JSON.stringify(obj, true, 2);

const ops = {
  dot: (o, k) => o[k],
  add: (x, y) => x + y,
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

const { dot, add } = ops;

let math = dot(window, "Math");
let pow = dot(math, "pow");
let sqrt = dot(math, "sqrt");
let sq5 = pow(5, 2);
let sq12 = pow(12, 2);
let sumsq5n12 = add(sq5, sq12);
let hyp5n12 = sqrt(sumsq5n12);
let hyp = (a, b) => {
  let sqA = pow(a, 2);
  let sqB = pow(b, 2);
  let sumsq = add(sqA, sqB);
  return sqrt(sumsq);
};

console.log(hyp5n12, hyp(5, 12), hyp(60, 11));

const out = {};

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

const getVar = (root, path) => {
  const pathType = typeof path;
  if (pathType === "string") {
    return root[path];
  }
  if (Array.isArray(path)) {
    if (!path.length) {
      return root;
    }
    const [key, ...subPath] = path;
    if (!subPath.length) {
      return root[key];
    }
    return getVar(root[key], subPath);
  }
  if (pathType !== "object") {
    throw new Error("Invalid path type: " + JSON.stringify(path));
  }
  const [[key, subPath]] = Object.entries(path);
  return getVar(root[key], subPath);
};

const gen = (root, path = [], out = {}, args = {}) => {
  // const getVar = (root, path) => {
  //   const pathType = typeof path;
  //   if (pathType === "string") {
  //     return root[path];
  //   }
  //   if (Array.isArray(path)) {
  //     if (!path.length) {
  //       return root;
  //     }
  //     const [key, ...subPath] = path;
  //     if (!subPath.length) {
  //       return root[key];
  //     }
  //     return getVar(root[key], subPath);
  //   }
  //   if (pathType !== "object") {
  //     throw new Error("Invalid path type: " + JSON.stringify(path));
  //   }
  //   const [[key, subPath]] = Object.entries(path);
  //   return getVar(root[key], subPath);
  // };

  const scope = root;
  return (...params) => {
    // TODO: work on this
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
            const argPath = word.A;
            const finalPath = [...path];
            for (const token of argPath) {
              if (token === "..") {
                finalPath.pop();
              } else {
                finalPath.push(token);
              }
            }
            // if (!argPath.length) {
            //   return;
            // }
            let subArgs = args;
            let i = 0;
            for (i; i < finalPath.length - 1; i++) {
              subArgs = args[finalPath[i]];
            }
            return subArgs.S[finalPath[i]];
          }
        }
        if (Array.isArray(word)) {
          let subOut = out;
          for (let i = 0; i < word.length; i++) {
            subOut = subOut[word[i]];
          }
          return subOut;
        }
      });
      const [head, ...tail] = tokens;
      return typeof head === "function" ? head(...tail) : head;
    };
    for (const id in scope) {
      const line = scope[id];
      if (typeof line === "string") {
        out[id] = out[line];
      } else if (Array.isArray(line)) {
        out[id] = call(line);
      } else if (typeof line === "object") {
        out[id] = gen(line, [...path, id], out, args);
      } else {
        out[id] = line;
      }
    }
    // console.log("out", out, args);
    console.log(path, p(args), "args");
    window.o = out;
    window.a = args;
    return out.R;
  };
  // const dec = getVar(repo, path);
  // if (Array.isArray(dec)) {
  //   const argWords = dec.filter(word => typeof word === "number");
  //   if (!argWords.length) {
  //   }
  //   let genCode = "function(";
  // }
};

const t2 = {
  a: [{ O: "add" }, { V: 1 }, { V: 2 }],
  b: {
    R: "fu"
  },
  c: [["b"]],
  d: {
    R: [{ O: "add" }, { A: 0 }, { V: 1 }]
  },
  e: {
    R: [{ O: "minus" }, { A: 0 }, { V: 1 }]
  },
  f: {
    a: {
      b: [{ O: "add" }, { A: ["..", 0] }, { A: 0 }],
      // a: [{ A: ["R", 0] }],
      R: "b"
    },
    R: "a"
  },
  g: [["f"], { V: 8 }],
  h: [["g"], { V: 9 }],
  i: [["d"], { V: 4 }],
  R: "foo"
};

const cTest = gen(t2);
// console.log(cTest(1, 2, 3));
const dTest = gen(t2.f);
console.log("hmm", dTest(3)(5));

const parse = (repo, id) => {
  if (!(id in repo)) {
    throw new Error("You done goofed! Could not find ID in repo: " + id);
  }

  out[id] = {};

  const parseLambda = lambda => {
    const func = (...params) => {
      // TODO: hoist unchanging (non-param) slots
      const tokens = lambda.map(code => {
        if (Array.isArray(code)) {
          return code[0];
        }

        const op = ops[code];
        if (op) {
          return op;
        }

        if (typeof code === "number") {
          out[id][code] = params[code];
          return params[code];
        }

        if (code in repo) {
          return parse(repo, code);
        }

        throw new Error("No match found for code, brah! " + code);
      });

      const [head, ...args] = tokens;
      return typeof head === "function" ? head(...args) : head;
    };

    out[id].R = func;
    return func;
  };

  const line = repo[id];

  if (Array.isArray(line)) {
    const func = parseLambda(line);
    if (line.some(code => typeof code === "number")) {
      return func;
    }
    return func();
  }

  const sub = line;
  const subRet = sub.R;

  return (...params) => {
    const parseSubLine = subLine => {
      const tokens = subLine.map(code => {
        if (Array.isArray(code)) {
          return code[0];
        }

        const op = ops[code];
        if (op) {
          return op;
        }

        if (typeof code === "number") {
          out[id][code] = params[code];
          return params[code];
        }

        if (typeof code === "object") {
          const scopePath = Object.keys(code);

          const refSubLine = sub[i];
          if (
            !refSubLine.some(code => typeof code === "object" && "i" in code)
          ) {
            return parseLambda(refSubLine)(...params);
          }
          const refSubVal = parseSubLine(refSubLine)(...params);
          out[id]["i" + i] = refSubVal;
          return refSubVal;
        }

        if (code in repo) {
          return parse(repo, code);
        }

        throw new Error("No match found for code, brah! " + code);
      });

      const [head, ...args] = tokens;
      return typeof head === "function" ? head(...args) : head;
    };

    const subRetVal = parseSubLine(subRet);
    out[id].R = subRetVal;
    return subRetVal;
  };
};

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
