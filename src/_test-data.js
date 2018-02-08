import { unpackApp } from "./app";

export const app = {
  repo: {
    m: {
      a: ["+", [1], [2]],
      a2: ["a", [false], [false]],
      a3: ["a", [true], [3]],
      a4: ["a", [0], { r: "INVALID" }],
      a5: ["o", [69], { r: "INVALID" }],
      b: { R: [["fu"]] },
      c: { R: ["+", { a: ["c", 0] }, [2]] },
      d: { R: { R: ["+", { a: ["d", 0] }, { a: ["d", "R", 0] }] } },
      e: {
        R: {
          R: {
            R: [
              "+",
              { a: ["e", 0] },
              { a: ["e", "R", 0] },
              { a: ["e", "R", "R", 0] }
            ]
          }
        }
      },
      f: { R: [{ r: "a" }] },
      h: [".", "g", ["Math"]],
      i: [".", { r: "h" }, ["pow"]],
      j: { R: [{ r: "i" }, { a: ["j", 0] }, [2]] },
      k: [{ r: "j" }, [5]],
      k2: [{ r: "j" }, [12]],
      k3: ["+", { r: "k" }, { r: "k2" }],
      k4: [{ r: "m" }, { r: "k3" }],
      l: [".", { r: "h" }, ["random"]],
      m: [".", { r: "h" }, ["sqrt"]],
      n: {
        a: [{ r: "j" }, { a: ["n", 0] }],
        b: [{ r: "j" }, { a: ["n", 1] }],
        c: ["+", { r: ["n", "a"] }, { r: ["n", "b"] }],
        R: [{ r: "m" }, { r: ["n", "c"] }]
      },
      o: {
        a: ["e", { a: ["o", 0] }, "u"],
        R: ["?", { r: ["o", "a"] }, [0], { r: ["o", "b"] }],
        b: [
          "s",
          { r: ["o", "c"] },
          ["INCREMENT"],
          { r: ["o", "d"] },
          ["DECREMENT"],
          { r: ["o", "e"] },
          { a: ["o", 0] }
        ],
        c: [".", { a: ["o", 1] }, ["type"]],
        d: ["+", { a: ["o", 0] }, [1]],
        e: ["+", { a: ["o", 0] }, [-1]]
      },
      R: [{ a: [0] }]
    },
    params: {},
    groups: {
      a: { name: "test", decs: ["a", "a2", "a3", "a4", "a5", "d"], id: "a" }
    },
    comments: {}
  },
  user: {
    nameSets: {
      "en-US": {
        id: "en-US",
        names: {
          "b,0": "nuthin",
          e: "hof",
          "e,0": "x",
          "e,R,0": "y",
          "e,R,R,0": "z",
          h: "math",
          i: "power",
          j: "x²",
          "j,0": "base",
          m: "√",
          n: "hypotenuse",
          "n,0": "a",
          "n,1": "b",
          "o,0": "state",
          "o,1": "action",
          "o,a": "state is undefined",
          "o,b": "next state",
          "o,c": "action type",
          k4: "hypotenuse",
          k3: "sum sq",
          k2: "12 sq",
          k: "5 sq",
          "n,a": "a sq",
          "n,b": "b sq",
          "n,c": "sum",
          o: "counter",
          "o,d": "add 1",
          "o,e": "sub 1"
        }
      }
    }
  }
};

export const fullApp = unpackApp(app);
