export const main = {
  main: {
    a: [{ op: "+" }, { val: 1 }, { val: 2 }],
    b: {
      R: [{ val: "fu" }]
    },
    c: {
      R: [{ op: "+" }, { arg: ["c", 0] }, { val: 2 }]
    },
    d: {
      R: {
        R: [{ op: "+" }, { arg: ["d", 0] }, { arg: ["d", "R", 0] }]
      }
    },
    e: {
      R: {
        R: {
          R: [
            { op: "+" },
            { arg: ["e", 0] },
            { arg: ["e", "R", 0] },
            { arg: ["e", "R", "R", 0] }
          ]
        }
      }
    },
    f: {
      R: [{ ref: "a" }]
    },
    h: [{ op: "." }, { op: "g" }, { val: "Math" }],
    i: [{ op: "." }, { ref: "h" }, { val: "pow" }],
    j: {
      R: [{ ref: "i" }, { arg: ["j", 0] }, { val: 2 }]
    },
    k: [{ ref: "j" }, { val: 5 }],
    k2: [{ ref: "j" }, { val: 12 }],
    k3: [{ op: "+" }, { ref: "k" }, { ref: "k2" }],
    k4: [{ ref: "m" }, { ref: "k3" }],
    l: [{ op: "." }, { ref: "h" }, { val: "random" }],
    m: [{ op: "." }, { ref: "h" }, { val: "sqrt" }],
    n: {
      a: [{ ref: "j" }, { arg: ["n", 0] }],
      b: [{ ref: "j" }, { arg: ["n", 1] }],
      c: [{ op: "+" }, { ref: ["n", "a"] }, { ref: ["n", "b"] }],
      R: [{ ref: "m" }, { ref: ["n", "c"] }]
    },
    o: {
      a: [{ op: "e" }, { arg: ["o", 0] }, { op: "u" }],
      R: [{ op: "?" }, { ref: ["o", "a"] }, { val: 0 }, { ref: ["o", "b"] }],
      b: [
        { op: "s" },
        { ref: ["o", "c"] },
        { val: "INCREMENT" },
        { ref: ["o", "d"] },
        { val: "DECREMENT" },
        { ref: ["o", "e"] },
        { arg: ["o", 0] }
      ],
      c: [{ op: "." }, { arg: ["o", 1] }, { val: "type" }],
      d: [{ op: "+" }, { arg: ["o", 0] }, { val: 1 }],
      e: [{ op: "+" }, { arg: ["o", 0] }, { val: -1 }]
    },
    // o: [{ ref: "n" }, { val: 5 }, { val: 12 }],
    R: [{ arg: 0 }]
  }
};

export const user = {
  nameSets: {
    "en-US": {
      id: "en-US",
      decs: {
        a: "always zero",
        a1: "inc constant",
        a2: "dec constant",
        b: { 0: "x", r: "increment" },
        b1: { 0: "x", r: "decrement" },
        ba: "test sum",
        c: "get updater by action type",
        d: {
          0: "action",
          r: "action type"
        },
        e: {
          0: "action",
          a: "action type",
          r: "updater from type"
        }
      }
    }
  }
};
