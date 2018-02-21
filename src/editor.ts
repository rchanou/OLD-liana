import { EditorStore } from "./editor";
import { observable } from "mobx";
import { defaultsDeep } from "lodash";

import { UI, UIStore, Cell, calcWidth, viewify } from "./ui";
import { AppStore } from "./app";
import {
  makeStore,
  FullDec,
  isFullDecList,
  FullLine,
  isArg,
  isRef,
  Arg,
  Ref,
  Node
} from "./core";
import { User, UserStore } from "./user";

export type Editor = UI & {
  app: AppStore;
  user?: User;
  groupFilter?: string;
  editPathName?: (string | number)[] | null;
};

export type EditorStore = UIStore & {
  user: UserStore;
  groupFilter: string;
  editPathName: (string | number)[] | null;
};

export const Editor = (initial: Editor) => {
  const { groupFilter = "", editPathName = null } = initial;
  const store: EditorStore = makeStore(UI(initial), {
    groupFilter,
    editPathName,
    get baseCells() {
      const makeDecCells = (
        decList: FullLine,
        path: string[] = [],
        x = 0,
        y = 0
      ): Cell[] => {
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
            const newCell: Cell = {
              ...viewify(node as Node),
              key: `CL-${path}-${i}`,
              x,
              y,
              width,
              selectable: true,
              path
              // index: i // TODO: why do i need this again?
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
    get input() {
      if (store.editPathName) {
        return store.user.nameSet[store.editPathName.join(",")] || "";
      }
      return;
    },
    get keyMap() {
      const { selectedCell } = store;
      if (store.editPathName) {
        return {
          title: "Type to Change Name",
          enter: "Save",
          esc: "Cancel",
          tab: "Save and Move Right",
          onKey(e: KeyboardEvent) {
            if (e.keyCode === 13) {
              store.editPathName = null;
            }
          }
        };
      }
      const keyMap = { 2: {} };
      if (selectedCell.editableName) {
        keyMap[2][6] = {
          label: "Change Name",
          action() {
            store.editPathName = selectedCell.path || null;
          }
        };
      }
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
  });
  return store;
};
