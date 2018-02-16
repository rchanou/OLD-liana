import { observable, extendObservable, IObservable } from "mobx";
import {
  Repo,
  Dec,
  DecDict,
  FullDec,
  isFullDecList,
  FullLine,
  isVal,
  isOp,
  isArg,
  isRef,
  Arg,
  Ref,
  Node
} from "./core";
import { unknown } from "./color";

const calcWidth = (text: string) =>
  typeof text !== "string" ? 1 : Math.ceil((text.length + 3) / 6);

export const baseSL = ",66%,55%)";
export const hues = {
  op: 150,
  val: 210,
  arg: 30,
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

export type Editor = UI & {
  groupFilter?: string;
};

export const Editor = ({ groupFilter = "", ...rest }: Editor) => {
  const store = mix(UI(rest), {
    groupFilter,
    get baseCells() {
      const { full } = store.repo;
      const makeDecCells = (
        decList: FullLine,
        path: string[] = [],
        x = 0,
        y = 0
      ): any[] => {
        const isDecList = isFullDecList(decList);
        const name = path.join(",");
        const decCellWidth = calcWidth(name);
        const cells = [];
        const isChild = Boolean(path.length);
        if (isChild) {
          cells.push({
            key: `CL-${path}`,
            x,
            y,
            width: decCellWidth,
            text: name,
            fill: "hsl(270,66%,88%)",
            color: "#333",
            selectable: true,
            path,
            editableName: true,
            isDecList
          });
        }
        if (!isDecList) {
          x += decCellWidth;
          let params;
          let i = 0;
          for (i; i < decList.length; i++) {
            const node = decList[i];
            const width = 2;
            const newCell: any = {
              ...viewify(node as Node),
              key: `CL-${path}-${i}`,
              x,
              y,
              width,
              selectable: true,
              // fill: "coral",
              // text: "*",
              path,
              index: i
            };
            if (isRef(node as Ref)) {
              newCell.gotoCellKey = `CL-${(node as Ref).ref.slice()}-0`;
              // if (!i) {
              //   params = full.params.get(path);
              //   if (params) {
              //     console.log("par", params);
              //   }
              // }
            }
            if (isArg(node as Arg)) {
              const { scope, arg = 0 } = node as Arg;
              const argPath =
                scope instanceof Array ? [...scope, arg] : [scope, arg];
              newCell.gotoCellKey = `CL-P-${argPath}`;
            }
            cells.push(newCell);
            x += width;
          }
          return cells;
        }
        if (isChild) {
          y++;
        }
        for (const subDec of decList) {
          const subX = path.length ? x + 1 : x;
          const subDecCells = makeDecCells(
            (subDec as FullDec).line,
            (subDec as FullDec).path,
            subX,
            y
          );
          cells.push(...subDecCells);
          y = subDecCells[subDecCells.length - 1].y + 1;
          if (isChild) {
            y++;
          }
        }
        return cells;
      };
      return makeDecCells(store.repo.full);
    },
    get cells() {
      return store.baseCells;
    }
  });
  return store;
};

interface App {
  editor?: Editor;
  repo: Repo;
}

export const App = (initial: App) => {
  const { repo, editor = {} } = initial;
  const store: App = observable({
    repo: Repo(repo),
    editor: Editor({
      ...editor,
      getRepo: () => store.repo
    })
  });
  return store;
};
