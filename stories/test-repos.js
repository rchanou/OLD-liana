export const main = {
  d: {
    a: { r: [[0]] },
    a1: [["INCREMENT"]],
    a2: [["DECREMENT"]],
    b: { r: ["+", 0, [1]] },
    b1: { r: ["-", 0, [1]] },
    ba: ["+", [1], [2]],
    c: ["s", 0, { g: "a1" }, { g: "a" }, { g: "a2" }, { g: "b1" }, { g: "a" }],
    d: [".", 0, ["type"]],
    e: {
      a: [{ g: "d" }, 0],
      r: [{ g: "c" }, { s: "a" }]
    }
  }
};

const user = {
  labelSets: {
    "en-US": {
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
      e: {}
    }
  }
};
