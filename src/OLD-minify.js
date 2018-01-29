export const minify = repo => {
  const { dependencies, inputs, links } = repo;

  const packed = { d: [], i: [], l: [] };
  const { d, i, l } = packed;

  for (const key in dependencies) {
    const { depId, path } = dependencies[key];
    const packedDep = {
      i: depId,
      p: path
    };
    d.push(packedDep);
  }

  for (const key in inputs) {
    const { inputId, labelSet } = inputs[key];
    const packedInput = {
      i: inputId
    };
    if (labelSet) {
      packedInput.l = labelSet;
    }
    i.push(packedInput);
  }

  for (const key in links) {
    const { linkId, nodes, labelSet } = links[key];

    const n = [];
    for (const node of nodes) {
      const packedNode = {};
      if ("val" in node) {
        packedNode.v = node.val;
      }
      if ("op" in node) {
        packedNode.o = node.op;
      }
      if ("ref" in node) {
        // debugger;
        packedNode.l = node.ref;
        if (node.inputs) {
          packedNode.r = 1;
        }
      }
      if ("input" in node) {
        packedNode.i = node.input;
      }
      if ("dep" in node) {
        packedNode.d = node.dep;
      }
      n.push(packedNode);
    }

    const packedLink = {
      i: linkId,
      n
    };

    if (labelSet) {
      packedLink.l = labelSet;
    }

    l.push(packedLink);
  }

  return packed;
};

export const unminify = packed => {
  const repo = {
    dependencies: {},
    inputs: {},
    links: {}
  };
  const { dependencies, inputs, links } = repo;

  const { d, i, l } = packed;

  for (const dep of d) {
    dependencies[dep.i] = { depId: dep.i, path: dep.p };
  }

  for (const input of i) {
    inputs[input.i] = { inputId: input.i, labelSet: input.l };
  }

  for (const link of l) {
    links[link.i] = {
      linkId: link.i,
      labelSet: link.l,
      nodes: link.n.map(packedNode => {
        const node = {};
        if ("v" in packedNode) {
          node.val = packedNode.v;
        }
        if ("o" in packedNode) {
          node.op = packedNode.o;
        }
        if ("l" in packedNode) {
          node.ref = packedNode.l;
          if (packedNode.r) {
            node.inputs = {};
          }
        }
        if ("i" in packedNode) {
          node.input = packedNode.i;
        }
        if ("d" in packedNode) {
          node.dep = packedNode.d;
        }
        return node;
      })
    };
  }

  return repo;
};

window.u = unminify;
