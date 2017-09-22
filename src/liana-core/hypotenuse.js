const graph = {
  m0: {
    0: ["/1", "/i.0", "/i.2"],
    1: ["/1", "/i.1", "/i.2"],
    2: ["/+", "/.0", "/.1"],
    3: ["/2", "/.2"]
  },
  m1: {
    0: [
      "/l",
      "/i.0",
      {
        0: ["/1", "/x", 2] // does this need to be assigned to an id? what about multi-step cases?
      }
    ],
    1: ["/4", "/+", "/.0"],
    2: ["/2", "/.1"]
  },
  m2: {
    // map
    0: ["/.", "/i.0", "map"],
    1: ["/.0", "/i.1"]
  },
  m3: {
    // apply
    0: ["/.", "/i.0", "apply"],
    1: ["/.0", "/i.1", "/i.2"]
  },
  m4: {
    // nth-dimension pythagorean
    0: ["/m2", "/i.0", "/11"], // map list to squares
    1: ["/4", "/+", "/.0"], // sum squares
    2: ["/2", "/.1"] // root of sum of squares
  },
  0: ["/.", "/g", "Math"],
  1: ["/.", "/0", "pow"],
  2: ["/.", "/0", "sqrt"],
  3: ["/.", "/g", "console"],
  4: ["/m3", "/i1", null, "/i2"], // apply with null context
  5: ["/4", "/+", [1, 2, 3]],
  6: ["/<", "/i2", 3],
  7: ["+", "/i3", 1],
  8: ["/for", 0, "/6", "/7"], // would this know that it's "fulfilled"? how? inherent to the primitive, probably
  9: ["/for", 0, "/<", "/7"], // does this make sense, too? will this work?
  10: ["/9", 5], // test of the above
  11: ["/1", "/i4", 2], // to power of 2
  12: ["/m4", [3, 4, 5]]
};

/*
-- Insights --
- Should inputs be explicitly required for functional "primitives"?
*/
