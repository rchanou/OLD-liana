const testRepo = {
  dependencies: {
    "0": {
      depId: "0",
      path: "https://unpkg.com/redux@3.7.2/dist/redux.min.js"
    }
  },
  inputs: {
    "0": { inputId: "0", labelSet: "state" },
    "1": { inputId: "1", labelSet: "action" },
    "2": { inputId: "2", labelSet: "x" },
    "3": { inputId: "3" },
    n: { inputId: "n", labelSet: "base" }
  },
  links: {
    "0": {
      linkId: "0",
      nodes: [{ op: "g" }, { val: "Math" }],
      labelSet: "Math"
    },
    "1": {
      linkId: "1",
      nodes: [{ op: "." }, { ref: "0" }, { val: "pow" }],
      labelSet: "power"
    },
    "2": {
      linkId: "2",
      nodes: [{ ref: "1" }, { input: "n" }, { val: 2 }],
      labelSet: "square"
    },
    "3": {
      linkId: "3",
      nodes: [{ fn: "2" }, { val: 5 }],
      labelSet: "5²"
    },
    "4": {
      linkId: "4",
      nodes: [{ fn: "2" }, { val: 12 }],
      labelSet: "12²"
    },
    "5": {
      linkId: "5",
      nodes: [{ op: "+" }, { ref: "3" }, { ref: "4" }],
      labelSet: "5²+12²"
    },
    "6": {
      linkId: "6",
      nodes: [{ op: "." }, { ref: "0" }, { val: "sqrt" }],
      labelSet: "√"
    },
    "7": {
      linkId: "7",
      nodes: [{ ref: "6" }, { ref: "5" }],
      labelSet: "hypotenuse for 5 & 12"
    },
    a: {
      linkId: "a",
      nodes: [{ op: "." }, { dep: "0" }, { val: "createStore" }],
      labelSet: "create store"
    },
    b: {
      linkId: "b",
      nodes: [{ op: "." }, { input: "1" }, { val: "type" }],
      labelSet: "action type"
    },
    c: {
      linkId: "c",
      nodes: [{ op: "+" }, { input: "2" }, { val: 1 }],
      labelSet: "increment"
    },
    d: {
      linkId: "d",
      nodes: [{ op: "+" }, { input: "3" }, { val: -1 }],
      labelSet: "decrement"
    },
    da: { linkId: "da", nodes: [{ op: "#" }, { val: 0 }] },
    ea: {
      linkId: "ea",
      nodes: [{ op: "?" }, { input: "0" }, { ref: "e" }, { ref: "da" }]
    },
    eb: { linkId: "eb", nodes: [{ ref: "ea" }, { input: "0" }] },
    // '11b':{
    //   linkId:'11b',nodes
    // },
    e: {
      linkId: "e",
      nodes: [
        { op: "s" },
        // { val: undefined },
        { ref: "b" },
        { val: "INCREMENT" },
        { fn: "c" },
        { val: "DECREMENT" },
        { fn: "d" },
        { op: "#" }
      ],
      labelSet: "updater"
    },
    f: {
      linkId: "f",
      nodes: [{ ref: "e" }, { input: "0" }],
      // inputOrder: ["0", "1"],
      labelSet: "counter reducer"
    },
    // "14": {
    //   linkId: "14",
    //   nodes: [{}],
    //   labelSet: "updated state"
    // },
    g: {
      linkId: "g",
      nodes: [{ ref: "a" }, { fn: "f", inputOrder: ["0", "1"] }],
      labelSet: "counter store"
    },
    "16": {
      linkId: "16",
      nodes: [{ op: "+" }, { val: "lol" }, { val: "no" }],
      labelSet: "test"
    },
    "17": { linkId: "17", nodes: [{ op: "." }], labelSet: "error" },
    "18": {
      linkId: "18",
      nodes: [{ op: "[" }, { val: "a" }, { val: 1 }, { val: "c" }, { val: 2 }],
      labelSet: "array"
    }
  },
  subs: {}
};

export default testRepo;
