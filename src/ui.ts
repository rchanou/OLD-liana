import { observable, extendObservable, IObservable } from "mobx";
import {
  Repo,
  // DecDict,
  // FullLine,
  isVal,
  isOp,
  isArg,
  isRef,
  // Arg,
  // Ref,
  Node
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

interface Cell {
  x?: number; // TODO: create separate "full" interface w/ required x/y
  y?: number;
  key?: string;
  width?: number;
  fill?: string;
  text?: string;
  cursor?: boolean;
  selectable?: boolean;
}
export function viewify(node: Node): Cell {
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
  repo?: Repo;
  readonly getRepo?: { (): Repo };
  selectedCellIndex?: number;
  // baseCells?: Cell[];
}

type UIStore = UI & {
  baseCells: Cell[];
  selectedCell: Cell;
  cursorCell: Cell;
  input?: string;
  // readonly shownDec: DecDict;
  // readonly getRepo: { (): RepoStore };
};

let cursorIdCounter = 0;
export const UI = (initial: UI) => {
  const { selectedCellIndex = 0 } = initial;
  const store: UIStore = observable({
    selectedCellIndex,
    get baseCells() {
      return [];
    },
    get repo() {
      if (initial.getRepo) {
        return initial.getRepo();
      }
      return;
    },
    get selectedCell() {
      const { baseCells } = store;
      let i = store.selectedCellIndex;
      let foundCell: Cell = baseCells[i || 0]; // TS couldn't infer it from above default
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
    }
    // get shownDec() {
    //   return store.getRepo().dict;
    // }
    // get baseCells() {
    //   return
    // }
  });
  cursorIdCounter++;
  return store;
};

export const mix = (store: any, more: object) => {
  extendObservable(store, more);
  return store;
};
