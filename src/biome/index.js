import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import Compy from "./Compy";

const fromUnicode = str => String.fromCharCode(parseInt(str, 16));

const Biome = {
  Input: Symbol()
};

const B = Biome;

const reserved = {
  ".": (a, b) => a[b],
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => a / b,
  g: o => o,
  window: window
};

class Funnel {
  constructor() {
    this._registered = [];
  }
  register(fn) {
    this._registered.push(fn);
  }
  push(value) {
    for (const reg of this._registered) {
      reg(value);
    }
  }
}

const collect = args => {
  const out = new Funnel();

  const params = {};
  const funnelIndexes = [];

  for (const i in args) {
    const arg = args[i];
    //console.log('arg', arg);
    if (arg instanceof Funnel) {
      params[i] = [];
      funnelIndexes.push(i);

      const process = val => {
        params[i].push(val);
        if (funnelIndexes.every(i => params[i].length)) {
          const newArgs = [];
          for (const i in args) {
            const arg = args[i];
            if (arg instanceof Funnel) {
              newArgs.push(params[i].shift());
            } else {
              newArgs.push(arg);
            }
          }
          out.push(newArgs);
        }
      };
      arg.register(process);
    } else {
      params[i] = arg;
    }
  }

  return out;
};

const transform = (input, fn, context = 0) => {
  const out = new Funnel();
  input.register(args =>
    out.push(
      Array.isArray(args) ? fn.apply(context, args) : fn.call(context, args)
    )
  );
  return out;
};

const merge = funnels => {
  const merged = new Funnel();
  merged.register(args => {
    for (const i in args) {
      funnels[i].push(args[i]);
    }
  });
  return merged;
};

const funcify = (input, out) => {
  let holder;
  out.register(val => {
    holder = val;
  });
  return arg => {
    input.push(arg);
    return holder;
  };
};

const copy = (input, out) => {
  const newIn = new Funnel();
  const newOut = new Funnel();
  return [];
};

const input = new Funnel();
const sqIn = collect([input, 2]);
const sqOut = transform(sqIn, Math.pow);

const input2 = new Funnel();
const sqIn2 = collect([input2, 2]);
const sqOut2 = transform(sqIn2, Math.pow);

const sqSumIn = collect([sqOut, sqOut2]);
const sqSumOut = transform(sqSumIn, (a, b) => a + b);
const hypo = transform(sqSumOut, Math.sqrt);
const hypoLog = collect(["hyp", hypo]);
transform(hypoLog, console.log);

const pythag = merge([input, input2]);

const pythFunc = funcify(pythag, hypo);

pythag.push([3, 4]);
pythag.push([5, 12]);

console.log("func", pythFunc([35, 12]));

const parse = (prog, pragma = "/") => {
  const parsed = {};

  for (const key in prog) {
    parsed[key] = prog[key].map(
      s => (typeof s === "string" && s.startsWith(pragma) ? [B, s.slice(1)] : s)
    );
  }

  return parsed;
};

window.__BIOME__ = {
  funcs: {},
  cache: {}
};

let funcCounter = 0;
const pipe = (fn, ...args) => {
  const funcKey = funcCounter;
  funcCounter++;
  window.__BIOME__.funcs[funcKey] = fn;
  const cache = window.__BIOME__.cache;
  cache[funcKey] = {};
  const argChars = args.map((v, i) => String.fromCharCode(i + 97));
  //console.log('fault in', argChars)
  const funcCode = `var cache = window.__BIOME__.cache;
    return window.__BIOME__.funcs[${funcKey}](
    ${args
      .map((v, i) => {
        const argChar = argChars[i];
        if (v === B.Input) {
          return argChar;
        }
        cache[funcKey][argChar] = v;
        return `cache[${funcKey}].${argChar}`;
      })
      .join(",")}
  );`;
  //console.log(funcCode)
  return new Function(
    ...argChars.filter((v, i) => args[i] === B.Input),
    funcCode
  );
};

const read = (prog, token) => {
  if (!Array.isArray(token) || token[0] !== B) {
    return token;
  }

  const keyword = token[1];

  if (reserved[keyword]) {
    //console.log('key', keyword, reserved[keyword])
    return reserved[keyword];
  }

  if (prog[keyword]) {
    return run(prog, keyword);
  }

  return B.Input;
};

const run = (prog, key) => {
  //debugger;
  const line = prog[key];
  const [fn, ...params] = line.map(token => read(prog, token));

  if (params.includes(B.Input)) {
    //const pipe = fn;
    return pipe(fn, ...params);
  }
  //console.log('what', fn, ...params)
  return fn(...params);
};

const buildNodeTree = (prog, key) =>
  prog[key].map(token => {
    if (!Array.isArray(token) || token[0] !== B) {
      return token;
    }

    const keyword = token[1];

    if (reserved[keyword]) {
      return keyword;
    }

    const fromLine = prog[keyword];
    //console.log('fl', fromLine)
    if (!fromLine) {
      return keyword;
    }

    return buildNodeTree(prog, keyword);
  });

const getMaxDepth = node =>
  Array.isArray(node) ? 1 + Math.max(...node.map(n => getMaxDepth(n))) : 0;

const elWidth = 35;
const yUnit = 45;
const borderColor = "steelblue";
const selectedColor = "hsl(120,70%,85%)";

const renderTree = (tree, bounds, mods) => {
  // TODO: merge bounds into mods
  const flatTree = flattenTree(tree, mods);
  console.log("ft", flatTree);
  return renderNodes(flatTree, bounds);
  /*const lines = [];
  const els = [];

  const subRender = tree => {
    els.push(<g key={tree.nodeId}>
      <circle fill='white' stroke={tree.nodeId === selectedNodeId? selectedColor: borderColor}
        strokeWidth={tree.nodeId === selectedNodeId? 3: ''}
        cx={(tree.x + 0.5) * elWidth} cy={bounds.y - (tree.y + 1) * yUnit} r={elWidth / 2 - 2}
      />
      <text x={(tree.x + 0.5) * elWidth} y={bounds.y - (tree.y + 1) * yUnit} textAnchor='middle' alignmentBaseline='middle'>
        {cache.names[tree.id['lookup']] || tree.id}
      </text>
    </g>);

    if (tree.children){
      tree.children.forEach(
        (c, i) => lines.push(<line key={c.nodeId + 'L'}
          x1={(tree.x + 0.5) * elWidth} y1={bounds.y - (tree.y + 1.32) * yUnit} x2={(c.x + 0.5) * elWidth} y2={bounds.y - (c.y + 0.67) * yUnit}
          strokeWidth={3} stroke={c.nodeId === selectedNodeId? 'tomato': `steelblue`}
        />)
      );

      tree.children.forEach(subRender, bounds);
    }
  };
  subRender(tree);

  return [...lines, ...els];*/
};

const renderNodes = (nodes, bounds) => {
  const lines = [];
  const els = [];

  for (const key in nodes) {
    const tree = nodes[key];
    if (tree.from) {
      lines.push(
        <line
          key={tree.nodeId + "L"}
          x1={(nodes[tree.from].x + 0.5) * elWidth}
          y1={bounds.y - (nodes[tree.from].y + 1.32) * yUnit}
          x2={(tree.x + 0.5) * elWidth}
          y2={bounds.y - (tree.y + 0.67) * yUnit}
          strokeWidth={3}
          stroke={tree.selected ? "tomato" : `steelblue`}
        />
      );
    }

    els.push(
      <g key={tree.nodeId}>
        <circle
          fill="white"
          stroke={tree.selected ? selectedColor : borderColor}
          strokeWidth={tree.selected ? 3 : ""}
          cx={(tree.x + 0.5) * elWidth}
          cy={bounds.y - (tree.y + 1) * yUnit}
          r={elWidth / 2 - 2}
        />
        <text
          x={(tree.x + 0.5) * elWidth}
          y={bounds.y - (tree.y + 1) * yUnit}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {cache.names[tree.id["lookup"]] || tree.id}
        </text>
      </g>
    );
  }

  return [...lines, ...els];
};

const flattenTree = tree => {
  const nodes = {};

  const collect = tree => {
    nodes[tree.nodeId] = tree;
    if (tree.children) {
      tree.children.forEach(c => {
        collect(c);
        c.from = tree.nodeId;
      });
    }
  };

  collect(tree);
  nodes[tree.nodeId].selected = true;
  //nodes["￾R￿17"].selected = true; // test
  return nodes;
};

const renderView = (bounds, prog, key) => {
  const tree = mapLayoutTree([B, key], prog);
  saveNavKeys(tree);
  console.log("tre", tree);
  const els = renderTree(tree, bounds);

  return (
    <svg width={bounds.x} height={bounds.y} style={{ background: "#ccc" }}>
      {els}
    </svg>
  );
};

const typeCodes = {
  start: fromUnicode("6FFFE"),
  end: fromUnicode("6FFFF")
};

const encodeToken = token =>
  Array.isArray(token) && token[0] === B
    ? `${typeCodes.start}R${typeCodes.end}${token[1]}`
    : typeof token === "number"
      ? `${typeCodes.start}N${typeCodes.end}${token}`
      : typeof token === "string"
        ? `${typeCodes.start}S${typeCodes.end}${token}`
        : typeof token === "boolean"
          ? `${typeCodes.start}B${typeCodes.end}${token}`
          : token === undefined
            ? `${typeCodes.start}U${typeCodes.end}`
            : token === null
              ? `${typeCodes.start}O${typeCodes.end}null`
              : `${typeCodes.start}O${typeCodes.end}${JSON.stringify(token)}`;

const saveNavKeys = node => {
  node.nav = node.nav || {};
  if (node.children) {
    node.nav.up = node.children[0].nodeId;
    for (const stringI in node.children) {
      const i = parseInt(stringI);
      const kidNode = node.children[i];
      kidNode.nav = {
        down: node.nodeId,
        left: i === 0 ? node.children.length - 1 : i - 1,
        right: i === node.children.length - 1 ? 0 : i + 1
      };
      saveNavKeys(kidNode);
    }
  }
};

const mapLayoutTree = (token, prog, baseX = 0, baseY = 0) => {
  const idMap = {};

  const getUniqueId = path => {
    let runningId = "";
    for (const encodedToken of path) {
      runningId += encodedToken;
      continue;
      if (!idMap[runningId]) {
        idMap[runningId] = true;
        return runningId;
      }
    }
    return runningId;
  };

  const nodePath = [encodeToken(token)];

  const subMapLayoutTree = (token, prog, baseX, baseY, nodePath) => {
    if (!Array.isArray(token) || token[0] !== B) {
      return {
        id: token,
        nodeId: getUniqueId(nodePath),
        x: baseX,
        y: baseY,
        width: 1
      };
    }

    const keyword = token[1];

    if (reserved[keyword]) {
      return {
        id: keyword,
        nodeId: getUniqueId(nodePath),
        x: baseX,
        y: baseY,
        width: 1
      };
    }

    const fromLine = prog[keyword];
    if (!fromLine) {
      return {
        id: keyword,
        nodeId: getUniqueId(nodePath),
        x: baseX,
        y: baseY,
        width: 1
      };
    }

    const kids = [];
    const kidY = baseY + 1;
    let currentKidX = baseX;
    let currentKidWidth = 0;
    for (const stringI in fromLine) {
      const i = parseInt(stringI);
      const kidToken = fromLine[i];
      const kid = subMapLayoutTree(kidToken, prog, currentKidX, kidY, [
        encodeToken(kidToken),
        ...nodePath
      ]);
      currentKidX += kid.width;
      currentKidWidth += kid.width;
      kids.push(kid);
    }
    console.log(keyword);
    return {
      id: { lookup: keyword },
      nodeId: getUniqueId(nodePath),
      x: (kids[0].x + kids[kids.length - 1].x) / 2,
      y: baseY,
      children: kids,
      width: currentKidWidth
    };
  };

  return subMapLayoutTree(token, prog, baseX, baseY, nodePath);
};

const rawHypotenuse = {
  // 12/28/16
  0: ["/.", "/window", "Math"],
  1: ["/.", "/0", "pow"],
  2: ["/.", "/0", "sqrt"],
  3: ["/.", "/window", "console"],
  4: ["/.", "/3", "log"],
  5: ["/1", "/i", 2],
  6: ["/5", "/i"],
  7: ["/5", 3],
  8: ["/5", 4],
  9: ["/+", "/7", "/8"],
  10: ["/2", "/9"],
  11: ["/4", "/10"],
  12: ["/5", 12],
  13: ["/5", 5],
  14: ["/+", "/12", "/13"],
  15: ["/4", "/14"],
  16: ["/5", "/i"],
  17: ["/+", "/6", "/16"],
  18: ["/funnel"],
  19: ["/funnel"],
  20: ["/pipe", "/1", "/18", 2],
  21: ["/pipe", "/1", "/19", 2],
  22: ["/pipe", "/+", "/20", "/21"],
  23: ["/pipe", "/2", "/22"],
  24: ["/merge", "/18", "/19"],
  25: ["/group", "/24", "/23"],
  26: ["/push", "/25", 5, 12],
  27: ["/save", "/26"],
  28: ["/replaceIn", "/25", "/20.3", 4], // ugly
  29: ["/copy", "/25"],
  30: ["/copy", "/25"],
  31: ["/pipe", "/*", "/30", 2]
  /*18:['/g', '/5', '/6', '/17'],
  19:['/18', 8, 15],
  20:['/18', 7, 24],
  21:['/3', '/10', '/19', '/20'],
  22:['/r', '/18', '/2', '/1'],
  23:['/1', 3, 4],
  24:['/i', '/5', '/6']*/
};

const cache = {
  backMap: {
    0: { 1: 1, 2: 1 },
    1: { 5: 0, 6: 0 }
  },
  results: {},
  names: {
    0: "➗",
    1: (
      <tspan textAnchor="middle" alignmentBaseline="middle">
        x
        <tspan baselineShift="super" style={{ fontSize: 11 }}>
          y
        </tspan>
      </tspan>
    ),
    2: "√",
    3: "w.console",
    4: "c.log",
    5: (
      <tspan textAnchor="middle" alignmentBaseline="middle">
        x
        <tspan baselineShift="super" style={{ fontSize: 11 }}>
          2
        </tspan>
      </tspan>
    ),
    6: (
      <tspan textAnchor="middle" alignmentBaseline="middle">
        y
        <tspan baselineShift="super" style={{ fontSize: 11 }}>
          2
        </tspan>
      </tspan>
    ),
    7: (
      <tspan textAnchor="middle" alignmentBaseline="middle">
        3
        <tspan baselineShift="super" style={{ fontSize: 11 }}>
          2
        </tspan>
      </tspan>
    ),
    8: (
      <tspan textAnchor="middle" alignmentBaseline="middle">
        4
        <tspan baselineShift="super" style={{ fontSize: 11 }}>
          2
        </tspan>
      </tspan>
    ),
    9: (
      <tspan textAnchor="middle" alignmentBaseline="middle">
        3
        <tspan baselineShift="super" style={{ fontSize: 11 }}>
          2
        </tspan>
        + 4
        <tspan baselineShift="super" style={{ fontSize: 11 }}>
          2
        </tspan>
      </tspan>
    ),
    10: "hyp",
    16: (
      <tspan textAnchor="middle" alignmentBaseline="middle">
        z
        <tspan baselineShift="super" style={{ fontSize: 11 }}>
          2
        </tspan>
      </tspan>
    ),
    17: "c",
    window: "🗔"
  }
};

const state = {
  views: {
    0: {
      baseNode: [B, 17],
      selectedNode: "￾17",
      collapse: {}
    }
  },
  menuLevel: 0
};

export const hypotenuse = parse(rawHypotenuse);
window.h = hypotenuse;

//console.log( mapLayoutTree( [B, 17], hypotenuse) );

const hypNodes = buildNodeTree(hypotenuse, 17);

console.log(hypNodes, getMaxDepth(hypNodes));

const Editor = ({ program }) => (
  <Compy>
    {renderView({ x: window.innerWidth, y: window.innerHeight }, program, 17)}
  </Compy>
);

export default Editor;

// ReactDOM.render(
//   <Editor program={hypotenuse} />,
//   document.body.firstElementChild
// );

window.t = run(hypotenuse, 17);
console.log(window.t);
//console.log( run( hypotenuse, 20) )
//const testPow = run(hypotenuse, 5)
//console.log( testPow(13) )
//const testSamePow = run(hypotenuse, 24);
//console.log( testSamePow(5, 3) );
