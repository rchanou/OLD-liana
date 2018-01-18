export const main = {
  d: {
    a: { r: [[0]] },
    b: { r: ["+", 0, [1]] },
    b1: { r: ["-", 0, [1]] },
    ba: { l: ["+", [1], [2]] },
    c: {
      l: ["s", 0, ["INCREMENT"], { f: "a" }, ["DECREMENT"], { f: "b1" }, { f: "a" }]
    },
    d: { l: [".", 0, ["type"]] },
    e: { r: [{ f: "c" }, { u: "a" }], l: { a: [{ f: "d" }, 0] } }
  }
};
