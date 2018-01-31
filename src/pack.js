const packWord = full => {
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
  throw new Error(`Could not pack word. Has no match: ${full}`);
};

const packProc = full => {
  if (Array.isArray(full)) {
    return full.map(packWord);
  }
  const packed = {};
  for (const id in full) {
    packed[id] = packProc(full[id]);
  }
  return packed;
};

const unpackWord = packed => {
  if (Array.isArray(packed)) {
    return { val: packed[0] };
  }
  if (typeof packed === "string") {
    return { op: packed };
  }
  // if (typeof packed === "number") {
  if ("a" in packed) {
    return { arg: packed.a };
  }
  if ("r" in packed) {
    return { ref: packed.r };
  }
  throw new Error(`Could not unpack word. Has no match: ${packed}`);
};

const unpackProc = packed => {
  if (Array.isArray(packed)) {
    return packed.map(unpackWord);
  }
  const full = {};
  for (const id in packed) {
    full[id] = unpackProc(packed[id]);
  }

  return full;
};

export const pack = packProc;
export const unpack = unpackProc;
