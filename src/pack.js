const packNode = full => {
  if ("val" in full) {
    return [full.val];
  }
  if ("op" in full) {
    return full.op;
  }
  if ("ref" in full) {
    return { r: full.ref };
  }
  if ("arg" in full) {
    return { a: full.arg };
  }
  throw new Error(`Could not pack node. Has no match: ${full}`);
};

// TODO: convert ref/arg paths to/from relative paths

const packDec = full => {
  if (Array.isArray(full)) {
    return full.map(packNode);
  }
  const packed = {};
  for (const id in full) {
    packed[id] = packDec(full[id]);
  }
  return packed;
};

const unpackNode = packed => {
  if (Array.isArray(packed)) {
    return { val: packed[0] };
  }
  if (typeof packed === "string") {
    return { op: packed };
  }
  if ("a" in packed) {
    return { arg: packed.a };
  }
  if ("r" in packed) {
    return { ref: packed.r };
  }
  throw new Error(`Could not unpack node. Has no match: ${packed}`);
};

const unpackDec = packed => {
  if (Array.isArray(packed)) {
    return packed.map(unpackNode);
  }
  const full = {};
  for (const id in packed) {
    full[id] = unpackDec(packed[id]);
  }
  return full;
};

export const unpackDecNew = packed => {
  if (packed instanceof Array) {
    return packed.map(unpackNode);
  }
  const full = [];
  for (const id in packed) {
    full.push(unpackDec(packed[id]));
  }
  return full;
};

export const pack = packDec;
export const unpack = unpackDec;

// export const inflate = (parent, path = [], flat = { args: {}, decs: {} }) => {
//   let dec = parent;
//   if (path.length) {
//     const id = path[path.length - 1];
//     dec = parent[id];
//   }
//   if (Array.isArray(dec)) {
//     flat.decs[path] = { id: String(path), eval: [] };
//     for (const node of dec) {
//       let newNode;
//       if ("arg" in node) {
//         newNode = { arg: String(node.arg) };
//         if (!flat.args[node.arg]) {
//           flat.args[node.arg] = { id: String(node.arg) };
//         }
//       } else if ("ref" in node) {
//         newNode = { ref: String(node.ref) };
//       } else {
//         newNode = node;
//       }
//       flat.decs[path].eval.push(newNode);
//     }
//   } else {
//     for (const id in dec) {
//       inflate(dec, [...path, id], flat);
//     }
//   }
//   return flat;
// };
