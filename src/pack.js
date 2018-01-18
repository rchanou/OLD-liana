const packWord = full => {
  if ("val" in full) {
    return [full.val];
  }
  if ("op" in full) {
    return full.op;
  }
  if ("fn" in full) {
    return { f: full.fn };
  }
  if ("arg" in full) {
    return full.arg;
  }
  if ("use" in full) {
    return { u: full.use };
  }
  throw new Error(`Could not pack word. Has no match: ${full}`);
};

const packDeclaration = full => {
  if (full.line) {
    return full.line.map(packWord);
  }
  const packed = {};
  packed.r = full.ret.map(packWord);
  if (full.lines) {
    packed.l = {};
    for (const id in full.lines) {
      packed.l[id] = full.lines[id].map(packWord);
    }
  }
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
  if ("f" in packed) {
    return { fn: packed.f };
  }
  if ("u" in packed) {
    return { use: packed.u };
  }
  throw new Error(`Could not unpack word. Has no match: ${packed}`);
};

const unpackDeclaration = packed => {
  const full = {};
  if (Array.isArray(packed)) {
    full.line = packed.map(unpackWord);
  } else {
    full.ret = packed.r.map(unpackWord);
    if (packed.l) {
      full.lines = {};
      for (const id in packed.l) {
        full.lines[id] = packed.l[id].map(unpackWord);
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

export const pack = full => ({ d: packDecSet(full.decs) });
export const unpack = packed => ({ decs: unpackDecSet(packed.d) });
