import { types, getType, getEnv } from "mobx-state-tree";

import { Repo, CallRef, Input, Link, LinkRef, Op, DepRef, Val } from "../core";
import { Meta } from "../meta";

const optionalMap = type => types.optional(types.map(type), {});

const Path = types.array(types.union(types.string, types.number));

const baseColor = ",66%,55%)";
const opColor = `hsl(150${baseColor}`;
const valColor = `hsl(210${baseColor}`;
const inputColor = `hsl(30${baseColor}`;
const packageColor = `hsl(190${baseColor}`;
const pendingColor = `hsl(270${baseColor}`;
const callColor = `hsl(300${baseColor}`;
const unknownColor = `hsl(0${baseColor}`;

const ViewRepoTree = types
  .model("ViewRepoTree", {
    keyMap: optionalMap(types.string), // this might be better as map of enum
    rootLink: types.string,
    openPaths: optionalMap(types.boolean),
    labelGroup: types.optional(types.string, "standard"),
    selectedPath: types.optional(Path, []),
    selectedIndex: types.maybe(types.number, 0)
  })
  .views(self => ({
    get selectedBox() {
      const { selectedPath, selectedIndex, boxes } = self;

      if (selectedIndex === null) return true;

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
      const { selectedBox } = self;

      if (!selectedBox) {
        return false;
      }

      return selectedBox.category === Link;
    },
    get pathKey() {
      return self.selectedPath.concat(self.selectedIndex).join("/");
    }
  }))
  .views(self => {
    const { repo, meta } = getEnv(self);
    const { links } = repo;

    const getBoxes = (link, opts = {}) => {
      const { rootLink, openPaths, selectedPath, selectedIndex } = self;
      link = link || links.get(rootLink);
      const { linkId, nodes } = link;
      const {
        x = 0,
        y = 0,
        color = pendingColor,
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

      const allBoxes = [];

      const sameAsSelectedPath =
        selectedPath.length === linkPath.length && selectedPath.every((token, j) => token === linkPath[j]);

      let currentX = x;

      const siblings = nodes.length;

      for (let i = 0; i < siblings; i++) {
        const childPath = [...linkPath, i];

        const node = nodes[i];
        const category = getType(node);

        const defaultBox = {
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

        const makeLinkBoxes = linkOrCallRef => {
          const childNodeType = getType(linkOrCallRef);
          const innerLink = childNodeType === LinkRef ? linkOrCallRef.ref : linkOrCallRef.call.link;
          const color = childNodeType === LinkRef ? pendingColor : callColor;

          if (!openPaths.get(childPath.join("/"))) {
            const label = meta.linkLabelSet.get(innerLink.linkId);
            allBoxes.push({
              ...defaultBox,
              text: (label && label.text) || `(${self.linkId})`,
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
            if (siblingType === LinkRef || siblingType === CallRef) {
              if (k === i + 1) {
                immediateNextIsRef = true;
              }
              nextIsRef = true;
              break;
            }
          }

          const refChildNodes = getBoxes(innerLink, {
            root: false,
            path: childPath,
            linkPath: [...linkPath, innerLink.linkId],
            x: currentX,
            y: y + 1,
            color,
            immediateNextIsRef,
            nextIsRef, //: !isLast && getType(nodes[i + 1]) === LinkRef,
            isLast,
            selected: sameAsSelectedPath && selectedIndex === i,
            siblingCount: siblings,
            open: openPaths.has(linkPath.join("/"))
          });
          allBoxes.push(...refChildNodes);

          const { size } = refChildNodes[refChildNodes.length - 1];
          currentX += size;
        };

        switch (category) {
          case LinkRef:
          case CallRef:
            makeLinkBoxes(node);
            break;
          case Op:
            allBoxes.push({
              ...defaultBox,
              color: opColor,
              text: node.op
            });
            currentX++;
            break;
          case Val:
            const { val } = node;
            const isString = typeof val === "string";
            const boxSize = isString ? Math.ceil(val.length / 6) : 1;
            allBoxes.push({
              ...defaultBox,
              color: valColor,
              text: isString ? `"${val}"` : val,
              size: boxSize
            });
            currentX += boxSize;
            break;
          case Input:
            const inputLabel = meta.inputLabelSet.get(node.input);

            allBoxes.push({
              ...defaultBox,
              color: inputColor,
              text: inputLabel ? inputLabel.text : `{${node.input}}`
            });
            currentX++;
            break;
          case DepRef:
            allBoxes.push({
              ...defaultBox,
              color: packageColor,
              size: 2,
              text: node.dep.path.replace("https://unpkg.com/", "").split("/")[0]
            });
            currentX += 2;
            break;
          default:
            allBoxes.push({ ...defaultBox, color: unknownColor });
            currentX++;
        }
      }

      const label = meta.linkLabelSet.get(link.linkId);
      // TODO: we need some crazy logic to make this more adaptable
      // or perhaps there's a much more elegant way of doing this that I'm not seeing currently
      const thisSize = nextIsRef
        ? Math.max(...allBoxes.map(n => n.x)) - x + (immediateNextIsRef ? 2 : allBoxes[allBoxes.length - 1].size + 1)
        : Math.max(...allBoxes.map(n => n.x + n.size)) - x;

      const thisNode = {
        path,
        upPath: linkPath,
        ...(root ? {} : { downPath: linkPath.length < 3 ? linkPath.slice(0, -1) : linkPath.slice(0, -2) }),
        x,
        y,
        size: thisSize,
        color,
        text: (label && label.text) || `(${link.linkId})`,
        category: Link,
        selected: selected || (sameAsSelectedPath && selectedIndex === null),
        siblings: siblingCount
      };
      allBoxes.push(thisNode);

      if (root) {
        const existingKeys = {};
        let i = allBoxes.length;
        while (i--) {
          const box = allBoxes[i];
          const { path } = box;
          let j = path.length - 1;
          let currentKey = "" + (j in path ? (box.link ? path[j] : `I${path[j]}`) : "");
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

      return allBoxes;
    };

    return {
      get boxes() {
        return getBoxes();
      }
    };
  })
  .actions(self => ({
    move(dir) {
      const { siblings } = self.selectedBox;
      let newSelectedIndex = self.selectedIndex + dir;
      if (newSelectedIndex < 0) {
        newSelectedIndex = siblings - 1;
      } else if (newSelectedIndex > siblings - 1) {
        newSelectedIndex = 0;
      }
      self.selectedIndex = newSelectedIndex;
    },
    up() {
      const { selectedBox } = self;
      const { upPath } = selectedBox;
      if (upPath) {
        self.selectedPath = upPath;
        self.selectedIndex = 0;
      }
    },
    down() {
      const { selectedBox } = self;
      const { downPath } = selectedBox;
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
  }))
  .actions(self => {
    const { keyMap } = self;

    const handleKeyUp = e => {
      e.preventDefault();

      const { keyCode } = e;
      const actionName = keyMap.get(keyCode);
      switch (actionName) {
        case "left":
          self.move(-1);
          break;
        case "right":
          self.move(+1);
          break;
        case "up":
          self.up();
          break;
        case "down":
          self.down();
          break;
        case "open":
          self.open();
          break;
        default:
          const action = self[actionName];
          if (typeof action === "function") {
            action(self);
          }
          console.log(keyCode);
      }
    };

    return {
      afterCreate() {
        document.addEventListener("keyup", handleKeyUp);
      },
      beforeDestroy() {
        document.removeEventListener("keyup", handleKeyUp);
      }
    };
  });

export default ViewRepoTree;
