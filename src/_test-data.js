export const engine = {
  main: {
    a: [{ op: "+" }, { val: 1 }, { val: 2 }],
    a2: [{ op: "a" }, { val: false }, { val: false }],
    a3: [{ op: "a" }, { val: true }, { val: 3 }],
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
    R: [{ arg: [0] }]
  }
};

export const user = {
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
        "o,c": "action type"
      }
    }
  }
};
