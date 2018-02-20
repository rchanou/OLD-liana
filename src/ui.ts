import { UIStore } from "./ui";
import { observable, extendObservable } from "mobx";
import {
  mix,
  Repo,
  // DecDict,
  // FullLine,
  isVal,
  isOp,
  isArg,
  isRef,
  // Arg,
  // Ref,
  Node,
  RepoStore
} from "./core";
// import { unknown } from "./color";

export const calcWidth = (text: string) =>
  typeof text !== "string" ? 1 : Math.ceil((text.length + 3) / 6);

export const baseSL = ",66%,55%)";
export const hues = {
  op: 150,
  val: 210,
  arg: 32,
  pkg: 190,
  ref: 270,
  unknown: 0
};
interface ColorMap {
  [key: string]: string;
}
export const colors: ColorMap = {};
for (const key in hues) {
  colors[key] = `hsl(${hues[key]}${baseSL}`;
}

interface NodeCell {
  fill: string;
  text: string;
}

export interface Cell {
  x: number;
  y: number;
  key: string;
  width?: number;
  height?: number;
  fill?: string;
  color?: string;
  text?: string;
  cursor?: boolean;
  selectable?: boolean;
  path?: string[];
  gotoCellKey?: string;
  editableName?: boolean;
  isDecList?: boolean;
}

export function viewify(node: Node): NodeCell {
  if (isVal(node)) {
    return {
      fill: colors.val,
      text: String(node.val)
    };
  }
  if (isOp(node)) {
    return {
      fill: colors.op,
      text: String(node.op)
    };
  }
  if (isRef(node)) {
    return {
      fill: colors.ref,
      text: node.ref.join(",")
    };
  }
  if (isArg(node)) {
    const { scope, arg = 0 } = node;
    const path = scope instanceof Array ? [...scope, arg] : [scope, arg];
    return {
      fill: colors.arg,
      text: path.join(",")
    };
  }
  return {
    fill: colors.unknown,
    text: "???"
  };
}

export interface UI {
  repo: Repo;
  params?: {};
  selectedCellIndex?: number;
}

export type UIStore = UI & {
  repo: RepoStore;
  input?: string;
  readonly baseKeyMap: {};
  readonly keyMap: {};
  readonly handleInput: { (): void };
  readonly baseCells: Cell[];
  readonly cells: Cell[];
  readonly activeCells: Cell[];
  readonly selectedCell: Cell;
  readonly cursorCell: Cell;
  readonly moveBy: { (step?: number, axis?: string): void };
  readonly moveUp: { (): void };
  readonly moveDown: { (): void };
  readonly moveLeft: { (): void };
  readonly moveRight: { (): void };
  readonly cellMap: {};
};

let cursorIdCounter = 0;
export function UI(initial: UI): UIStore {
  const { selectedCellIndex = 0 } = initial;
  const store: UIStore = mix(initial, {
    selectedCellIndex,
    get baseCells() {
      return [] as Cell[];
    },
    get selectedCell() {
      const { baseCells } = store;
      let i = store.selectedCellIndex;
      let foundCell: Cell = baseCells[i || 0]; // TS checker couldn't infer default zero from above
      while ((!foundCell || !foundCell.selectable) && i) {
        foundCell = baseCells[i--];
      }
      return foundCell;
    },
    get cursorCell() {
      const { input, selectedCell } = store;
      const { x, y, width } = selectedCell;
      return {
        x,
        y,
        width,
        input,
        cursor: true,
        key: String(cursorIdCounter)
      };
    },
    get cells() {
      return [...store.baseCells, store.cursorCell];
    },
    get cellMap() {
      const cMap = {
        y: {},
        x: {}
      };
      const yx = cMap.y;
      const xy = cMap.x;
      const { baseCells } = store;
      const { length } = baseCells;
      for (let i = 0; i < length; i++) {
        const cell = baseCells[i];
        if (!cell.selectable) {
          continue;
        }
        const { x, y, width = 0, height = 0 } = cell;
        for (let cy = y; cy <= y + height; cy++) {
          for (let cx = x; cx <= x + width; cx++) {
            if (!yx[cy]) {
              yx[cy] = { min: 0, max: 0 };
            }
            if (!xy[cx]) {
              xy[cx] = { min: 0, max: 0 };
            }
            yx[cy][cx] = i;
            xy[cx][cy] = i;
            if (cx > yx[cy].max) {
              yx[cy].max = cx;
            }
            if (cx < yx[cy].min) {
              yx[cy].min = cx;
            }
            if (cy > xy[cx].max) {
              xy[cx].max = cy;
            }
            if (cy < xy[cx].min) {
              xy[cx].min = cy;
            }
          }
        }
      }
      // TODO: logic to fill out "edge" cells for less jumpiness
      return cMap;
    },
    get baseKeyMap() {
      return {
        1: {
          2: { label: "▲", action: store.moveUp }
        },
        2: {
          0: {
            label: "Jump to Top",
            action() {
              store.selectedCellIndex = 0;
            }
          },
          1: { label: "◀", action: store.moveLeft },
          2: { label: "▼", action: store.moveDown },
          3: { label: "▶", action: store.moveRight }
        },
        3: {
          0: {
            label: "Jump to End",
            action() {
              const { baseCells } = store;
              let i = baseCells.length;
              let toCellIndex;
              while (toCellIndex === undefined && --i) {
                if (store.baseCells[i].selectable) {
                  toCellIndex = i;
                }
              }
              store.selectedCellIndex = toCellIndex;
            }
          }
        }
      };
    },
    moveBy(step: number = +1, axis: string = "x") {
      if (store.selectedCell == null) {
        return;
      }
      const crossAxis = axis === "x" ? "y" : "x";
      const currentCell = { ...store.selectedCell };
      const crossSizeProp = crossAxis === "x" ? "width" : "height";
      // TODO: center-finding can likely be improved (maybe try banker's rounding to prevent cursor "drift?")
      const crossCenter = Math.ceil(
        currentCell[crossAxis] + ((currentCell[crossSizeProp] || 0) - 1) / 2
      );
      currentCell[crossAxis] = crossCenter;
      const crossAxisMap = store.cellMap[crossAxis];
      if (!currentCell) {
        return;
      }
      const crossAxisPos = currentCell[crossAxis];
      const crossAxisSet = crossAxisMap[crossAxisPos];
      if (!crossAxisSet) {
        return;
      }
      let axisPos = currentCell[axis];
      const { min } = crossAxisSet;
      const { max } = crossAxisSet;
      while (min <= axisPos && axisPos <= max) {
        axisPos += step;
        const foundIndex = crossAxisSet[axisPos];
        if (
          foundIndex !== store.selectedCellIndex &&
          foundIndex !== undefined
        ) {
          store.selectedCellIndex = foundIndex;
          return;
        }
      }
      if (axisPos > max) {
        let foundCurrent = false;
        for (const crossAxisPosKey in crossAxisMap) {
          if (crossAxisPos === parseInt(crossAxisPosKey)) {
            foundCurrent = true;
          } else if (foundCurrent) {
            const posList = (Object as any).values(
              crossAxisMap[crossAxisPosKey]
            );
            // third-from-last item is actual last pos of row; last two items are min/max of row
            const wrapCellIndex = posList[posList.length - 3];
            store.selectedCellIndex = wrapCellIndex;
            return;
          }
        }
      }
      if (axisPos < min) {
        let prevKey = String(crossAxisPos);
        for (const crossAxisPosKey in crossAxisMap) {
          if (crossAxisPos === parseInt(crossAxisPosKey)) {
            const wrapCellIndex = (Object as any).values(
              crossAxisMap[prevKey]
            )[0];
            store.selectedCellIndex = wrapCellIndex;
            return;
          } else {
            prevKey = crossAxisPosKey;
          }
        }
      }
      // NOTE: Short-circuiting wraparound logic below at the moment (allow param to set?)
      return;
      if (axis === "y") {
        return;
      }
      let foundIndex;
      if (axisPos > max) {
        foundIndex = crossAxisSet[min];
      } else if (axisPos < min) {
        foundIndex = crossAxisSet[max];
      }
      if (foundIndex !== undefined) {
        store.selectedCellIndex = foundIndex;
      }
    },
    moveRight() {
      store.moveBy();
    },
    moveLeft() {
      store.moveBy(-1);
    },
    moveDown() {
      store.moveBy(+1, "y");
    },
    moveUp() {
      store.moveBy(-1, "y");
    }
  });
  cursorIdCounter++;
  return store;
}
