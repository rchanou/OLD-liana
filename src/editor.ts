import { EditorStore } from "./editor";
import { observable } from "mobx";
import { defaultsDeep } from "lodash";

import { UI, UIStore, Cell, calcWidth, viewify } from "./ui";
import { App } from "./app";
import {
  mix,
  FullDec,
  isFullDecList,
  FullLine,
  isArg,
  isRef,
  Arg,
  Ref,
  Node
} from "./core";

export type Editor = UI & {
  app: any;
  groupFilter?: string;
  editPathName?: (string | number)[];
};

export type EditorStore = UIStore & Editor;

// export const Editor = ({ groupFilter = "", ...rest }: Editor) => {
//   const store: EditorStore = mix(UI(rest), {
export const Editor = (initial: Editor) => {
  console.log("naw fam", initial);
  // const store: EditorStore = mix(UI(initial), {
  const store: EditorStore = mix(
    UI(initial),
    // {
    //   get repo() {
    //     return store.repo;
    //   }
    // },
    {
      groupFilter: initial.groupFilter || "",
      get baseCells() {
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
      get keyMap() {
        const { selectedCell } = store;
        const keyMap = { 2: {} };
        if (selectedCell.gotoCellKey) {
          keyMap[2][7] = {
            label: "Go To Def",
            action() {
              const gotoCellIndex = store.baseCells.findIndex(
                (cell: Cell) => cell.key === selectedCell.gotoCellKey
              );
              if (gotoCellIndex !== -1) {
                store.selectedCellIndex = gotoCellIndex;
              }
            }
          };
        }
        return defaultsDeep(keyMap, store.baseKeyMap);
      }
    }
  );
  return store;
};
