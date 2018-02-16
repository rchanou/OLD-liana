import { observable, extendObservable, IObservable } from "mobx";
import { Repo, Dec, DecDict, isArg, FullDec, isFullDecList, isRef, FullLine, Arg, Ref } from "./core";
import { calcWidth } from "./view";

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
      // let x = 0;
      // let y = 0;
      // const groupCell = {
      //   key: `CL-GROUP`,
      //   x,
      //   y: y++,
      //   text: groupFilter,
      //   width: calcWidth(groupFilter)
      // };
      // const makeDecCells = (parent, id, path = [], x = 0, y = 0) => {
      const makeDecCells = (decList: FullLine, path: string[] = [], x = 0, y = 0) => {
        // const makeDecCells = (decList: FullLine, path: string[] = []) => {
        // let decList = parent;
        // if (id !== undefined) {
        //   decList = parent.get(id);
        // }
        // const isDec = !(decList instanceof Array);
        const isDecList = isFullDecList(decList);
        // const procName = user.pathName(path);
        const procName = path.join(",");
        const decCellWidth = calcWidth(procName);
        const cells = [
          {
            key: `CL-${path}`,
            x,
            y,
            width: decCellWidth,
            text: procName,
            fill: "hsl(270,66%,88%)",
            color: "#333",
            selectable: true,
            path,
            editableName: true,
            isDecList
          }
        ];
        // const params = full.fullParams[path];
        // if (params) {
        //   let paramX = x + width;
        //   for (let i = 0; i < params.length; i++) {
        //     const param = params[i];
        //     // const name = user.pathName([...path, i]);
        //     const name = [...path, i].join(",");
        //     const paramWidth = calcWidth(name);
        //     cells.push({
        //       key: `CL-P-${path},${i}`,
        //       x: paramX,
        //       y,
        //       width: paramWidth,
        //       text: name,
        //       fill: "hsl(30,66%,83%)",
        //       color: "#333",
        //       selectable: true,
        //       path: [...path, i],
        //       editableName: true
        //     });
        //     paramX += paramWidth;
        //   }
        // }
        if (!isDecList) {
          x += decCellWidth;
          let params;
          let i = 0;
          for (i; i < decList.length; i++) {
            const node = decList[i];
            // const { width = 2 } = node;
            const width = 2;
            const newCell: any = {
              key: `CL-${path}-${i}`,
              x,
              y,
              width,
              selectable: true,
              // fill: node.color,
              // text: node.name || node.out,
              fill: "coral",
              text: "*",
              path,
              index: i
            };
            if (isRef(node as Ref)) {
              newCell.gotoCellKey = `CL-${(node as Ref).ref.slice()}-0`;
              if (!i) {
                params = full.params.get(path);
                if (params) {
                  console.log("par", params);
                }
              }
            }
            // if ("arg" in node) {
            if (isArg(node as Arg)) {
              const { scope, arg = 0 } = node as Arg;
              // newCell.gotoCellKey = `CL-P-${(node as Arg).arg.slice()}`;
              const argPath = scope instanceof Array ? [...scope, arg] : [scope, arg];
              newCell.gotoCellKey = `CL-P-${argPath}`;
            }
            cells.push(newCell);
            x += width;
          }
          // if (!decList.some((node: Node) => isArg(node))) {
          //   const text = formatOut(full, path);
          //   cells.push({
          //     key: `CL-${path}-out`,
          //     x,
          //     y,
          //     text,
          //     width: calcWidth(text)
          //   });
          // }
          return cells;
        }

        // if (id !== undefined) {
        if (!path.length) {
          y++;
        }
        // decList.forEach((_, subId) => {
        for (const subDec of decList) {
          // TODO: inline anonymous decs
          // const subX = id === undefined ? x : x + 1;
          const subX = path.length ? x + 1 : x;
          // const subDecCells = makeDecCells(decList, subId, [...path, subId], subX, y);
          // const subDecCells = makeDecCells(decList, dec.path);
          const subDecCells = makeDecCells((subDec as FullDec).line, (subDec as FullDec).path, subX, y);
          cells.push(...subDecCells);
          y = subDecCells[subDecCells.length - 1].y + 1;
          // if (id === undefined) {
          if (path.length) {
            y++;
          }
        }
        // });
        return cells;
      };
      return makeDecCells(store.repo.full); // .concat(groupCell);
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
