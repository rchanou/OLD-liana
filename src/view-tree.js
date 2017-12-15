import { getType, types } from "mobx-state-tree";

import { ContextRepo, InputRef, Link, LinkRef, Op, DepRef, Val } from "./core";

const optionalMap = type => types.optional(types.map(type), {});

const Path = types.array(types.union(types.string, types.number));

export const Tree = types
  .model("ViewRepoTree", {
    repo: ContextRepo.Ref,
    rootLink: types.string,
    openPaths: optionalMap(types.boolean),
    selectedPath: types.optional(Path, []),
    selectedIndex: types.maybe(types.number, 0)
  })
  .views(self => ({
    get selectedCell() {
      const { selectedPath, selectedIndex, boxes } = self;

      if (selectedIndex === null) {
        return true;
      }

      const selectedPathLength = selectedPath.length;

      if (!selectedPathLength) {
        return false;
      }

      return self.boxes.find(
        box =>
          box.path.length === selectedPathLength + 1 &&
          selectedPath.every((x, i) => x === box.path[i]) &&
          box.path[selectedPathLength] === selectedIndex
      );
    },
    get isLinkSelected() {
      const { selectedCell } = self;

      if (!selectedCell) {
        return false;
      }

      return selectedCell.category === Link;
    },
    get pathKey() {
      return self.selectedPath.concat(self.selectedIndex).join("/");
    }
  }))
  .views(self => {
    const { repo } = self;
    const { links } = repo;

    const getCells = (link, opts = {}) => {
      const { rootLink, openPaths, selectedPath, selectedIndex } = self;
      link = link || links.get(rootLink);
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
        selected = false,
        siblingCount = 1,
        open = true
      } = opts;

      const allCells = [];

      const sameAsSelectedPath =
        selectedPath.length === linkPath.length &&
        selectedPath.every((token, j) => token === linkPath[j]);

      let currentX = x;

      const siblings = nodes.length;

      for (let i = 0; i < siblings; i++) {
        const childPath = [...linkPath, i];

        const node = nodes[i];
        const category = getType(node);

        const defaultCell = {
          text: node.label,
          color: node.color,
          path: childPath,
          x: currentX,
          y: y + 1,
          size: 1,
          root: false,
          selected: sameAsSelectedPath && selectedIndex === i,
          category,
          siblings,
          downPath: linkPath.length < 2 ? linkPath : linkPath.slice(0, -1)
        };

        const makeRefCells = linkRef => {
          const innerLink = linkRef.ref;
          const { color } = linkRef;

          if (!openPaths.get(childPath.join("/"))) {
            const { label } = innerLink;
            allCells.push({
              ...defaultCell,
              text: label,
              color,
              size: 2
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
            selected: sameAsSelectedPath && selectedIndex === i,
            siblingCount: siblings,
            open: openPaths.get(linkPath.join("/"))
          });
          allCells.push(...refChildNodes);

          const { size } = refChildNodes[refChildNodes.length - 1];
          currentX += size;
        };

        switch (category) {
          case LinkRef:
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
              size: boxSize
            });
            currentX += boxSize;
            break;
          case DepRef:
            allCells.push({
              ...defaultCell,
              size: 2
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
          (immediateNextIsRef ? 2 : allCells[allCells.length - 1].size + 1)
        : Math.max(...allCells.map(n => n.x + n.size)) - x;

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
        size: thisSize,
        color,
        text: label,
        category: Link,
        selected: selected || (sameAsSelectedPath && selectedIndex === null),
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
      get cells() {
        return getCells();
      }
    };
  })
  .actions(self => ({
    move(dir) {
      const { siblings } = self.selectedCell;
      let newSelectedIndex = self.selectedIndex + dir;
      if (newSelectedIndex < 0) {
        newSelectedIndex = siblings - 1;
      } else if (newSelectedIndex > siblings - 1) {
        newSelectedIndex = 0;
      }
      self.selectedIndex = newSelectedIndex;
    },
    up() {
      const { selectedCell } = self;
      const { upPath } = selectedCell;
      if (upPath) {
        self.selectedPath = upPath;
        self.selectedIndex = 0;
      }
    },
    down() {
      const { selectedCell } = self;
      const { downPath } = selectedCell;
      if (downPath) {
        self.selectedPath = downPath;
        self.selectedIndex = 0;
      }
    },
    open() {
      const { pathKey } = self;
      const current = self.openPaths.get(pathKey);
      self.openPaths.set(pathKey, !current);
      console.log("le key", pathKey);
    }
  }));

export default Tree;
