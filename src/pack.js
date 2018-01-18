const packWord = full => {
  if ("val" in full) {
    return [full.val];
  }
  if ("op" in full) {
    return full.op;
  }
  if ("gRef" in full) {
    return { g: full.gRef };
  }
  if ("arg" in full) {
    return full.arg;
  }
  if ("sRef" in full) {
    return { s: full.sRef };
  }
  throw new Error(`Could not pack word. Has no match: ${full}`);
};

const packDeclaration = full => {
  if (full.line) {
    return full.line.map(packWord);
  }
  const packed = {};
  if (full.lines) {
    for (const id in full.lines) {
      packed[id] = full.lines[id].map(packWord);
    }
  }
  packed.r = full.ret.map(packWord);
  return packed;
};

const packDecSet = full => {
  const packed = {};
  for (const id in full) {
    const packedDec = packDeclaration(full[id]);
    packed[id] = packedDec;
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
  if (typeof packed === "number") {
    return { arg: packed };
  }
  if ("g" in packed) {
    return { gRef: packed.g };
  }
  if ("s" in packed) {
    return { sRef: packed.s };
  }
  throw new Error(`Could not unpack word. Has no match: ${packed}`);
};

const unpackDeclaration = packed => {
  const full = {};
  if (Array.isArray(packed)) {
    full.line = packed.map(unpackWord);
  } else {
    full.lines = {};
    for (const id in packed) {
      const fullLine = packed[id].map(unpackWord);
      if (id === "r") {
        full.ret = fullLine;
      } else {
        full.lines[id] = fullLine;
      }
    }
  }
  return full;
};

const unpackDecSet = packed => {
  const full = {};
  for (const id in packed) {
    const packedDec = packed[id];
    const fullDec = unpackDeclaration(packedDec);
    fullDec.id = id;
    full[id] = fullDec;
  }
  return full;
};

export const pack = ({ decs, ...rest }) => ({ d: packDecSet(decs), ...rest });
export const unpack = ({ d, ...rest }) => ({ decs: unpackDecSet(d), ...rest });
