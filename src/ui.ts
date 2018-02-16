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
  fill: string;
  text: string;
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
  selectedCellIndex?: number;
  repo?: Repo;
  readonly getRepo?: { (): Repo };
}

interface UIStore {
  selectedCellIndex: number;
  // readonly shownDec: DecDict;
  // readonly getRepo: { (): RepoStore };
}

export const UI = (initial: UI) => {
  const { selectedCellIndex = 0 } = initial;
  const store: UIStore = observable({
    selectedCellIndex,
    get repo() {
      if (initial.getRepo) {
        return initial.getRepo();
      }
      return;
    }
    // get shownDec() {
    //   return store.getRepo().dict;
    // }
    // get baseCells() {
    //   return
    // }
  });
  return store;
};

export const mix = (store: any, more: object) => {
  extendObservable(store, more);
  return store;
};
