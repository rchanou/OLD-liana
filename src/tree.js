import { getType, types } from "mobx-state-tree";

// import { ContextRepo, InputRef, Link, LinkRef, Fn, Op, DepRef, Val } from "./core";
import { uiModel, formatOut } from "./view";

const optionalMap = type => types.optional(types.map(type), {});

const Path = types.array(types.union(types.string, types.number));

export const Tree = uiModel("ViewRepoTree", {
  // rootLink: types.reference(Link),
  openPaths: optionalMap(types.boolean)
}).views(self => {
  const { repo } = self;
  const { links } = repo;

  const getCells = (link, opts = {}) => {
    const { rootLink, openPaths, selectedPath, selectedCellIndex } = self;
    const { linkId, nodes } = link;
    const {
      x = 0,
      y = 0,
      color = link.color,
      immediateNextIsRef = false,
      nextIsRef = false,
      isLast = true,
      path = [linkId],
      linkPath = [linkId],
      root = true,
      siblingCount = 1,
      open = true
    } = opts;

    const allCells = [];

    let currentX = x;

    const siblings = nodes.length;

    for (let i = 0; i < siblings; i++) {
      const childPath = [...linkPath, i];

      const node = nodes[i];
      const category = getType(node);

      const defaultCell = {
        text: node.label,
        fill: node.color,
        path: childPath,
        x: currentX,
        y: y + 1,
        width: 1,
        root: false,
        selectable: true,
        category,
        siblings,
        downPath: linkPath.length < 2 ? linkPath : linkPath.slice(0, -1),
        forNode: node
      };

      const makeRefCells = linkRef => {
        const innerLink = linkRef.ref || linkRef.fn;
        const { color } = linkRef;

        if (false && !openPaths.get(childPath.join("/"))) {
          const { label, out } = innerLink;
          allCells.push({
            ...defaultCell,
            text: `${label}: ${formatOut(out)}`,
            color,
            width: 2
          });
          currentX += 2;
          return;
        }

        const isLast = i === nodes.length - 1;

        let immediateNextIsRef = false;
        let nextIsRef = false; // rename to "followedByRef" or something
        for (let k = i; k < siblings; k++) {
          // TODO: don't do this in loop, precompute instead
          const siblingType = getType(nodes[k]);
          if (siblingType === LinkRef) {
            if (k === i + 1) {
              immediateNextIsRef = true;
            }
            nextIsRef = true;
            break;
          }
        }

        const refChildNodes = getCells(innerLink, {
          root: false,
          path: childPath,
          linkPath: [...linkPath, innerLink.linkId],
          x: currentX,
          y: y + 1,
          color,
          immediateNextIsRef,
          nextIsRef,
          isLast,
          siblingCount: siblings,
          open: openPaths.get(linkPath.join("/"))
        });
        allCells.push(...refChildNodes);

        const { width } = refChildNodes[refChildNodes.length - 1];
        currentX += width;
      };

      switch (category) {
        case LinkRef:
        case Fn:
          makeRefCells(node);
          break;
        case Op:
        case InputRef:
          allCells.push(defaultCell);
          currentX++;
          break;
        case Val:
          const { val } = node;
          const boxSize =
            typeof val === "string" ? Math.ceil(val.length / 6) : 1;
          allCells.push({
            ...defaultCell,
            width: boxSize
          });
          currentX += boxSize;
          break;
        case DepRef:
          allCells.push({
            ...defaultCell,
            width: 2
          });
          currentX += 2;
          break;
        default:
          throw new Error("A wild node type appeared!");
          allCells.push(defaultCell);
          currentX++;
      }
    }

    const { label } = link;
    // TODO: we need some crazy logic to make this more adaptable
    // or perhaps there's a much more elegant way of doing this that I'm not seeing currently
    const thisSize = nextIsRef
      ? Math.max(...allCells.map(n => n.x)) -
        x +
        (immediateNextIsRef ? 2 : allCells[allCells.length - 1].width + 1)
      : Math.max(...allCells.map(n => n.x + n.width)) - x;

    const thisNode = {
      path,
      upPath: linkPath,
      ...(root
        ? {}
        : {
            downPath:
              linkPath.length < 3
                ? linkPath.slice(0, -1)
                : linkPath.slice(0, -2)
          }),
      x,
      y,
      width: thisSize,
      fill: color,
      text: label,
      category: Link,
      selectable: true,
      forNode: link,
      siblings: siblingCount
    };
    allCells.push(thisNode);

    if (root) {
      const existingKeys = {};
      let i = allCells.length;
      while (i--) {
        const box = allCells[i];
        const { path } = box;
        let j = path.length - 1;
        let currentKey =
          "" + (j in path ? (box.link ? path[j] : `I${path[j]}`) : "");
        if (!box.link) {
          j--;
          currentKey += "/" + (j in path ? path[j] : "");
        }
        while (existingKeys[currentKey]) {
          j--;
          currentKey += "/" + (j in path ? path[j] : "");
        }
        existingKeys[currentKey] = true;
        box.key = currentKey;
      }
    }

    return allCells;
  };

  return {
    get treeCells() {
      return getCells(self.rootLink);
    },
    get valueCell() {
      const valueCell = {
        ...self.treeCells[self.selectedCellIndex],
        x: 0,
        y: Math.max(...self.treeCells.map(c => c.y)) + 1,
        key: "VALUE",
        fill: "#333",
        width: 20,
        selectable: false
      };
      const { out } = valueCell.forNode;
      window.t = valueCell.forNode; // TODO: for testing; remove for production or whatever
      valueCell.text = formatOut(out);
      delete valueCell.category;
      return valueCell;
    },
    get baseCells() {
      return self.treeCells.concat(self.valueCell);
    },
    keyMap(exit) {
      return {
        1: { ...self.baseKeyMap[1] },
        2: { ...self.baseKeyMap[2] },
        3: { 6: { label: "Cancel", action: exit } }
      };
    }
  };
});
// .actions(self => ({
//   open() {
//     const { pathKey } = self;
//     const current = self.openPaths.get(pathKey);
//     self.openPaths.set(pathKey, !current);
//     console.log("le key", pathKey);
//   }
// }));

export default Tree;
