import { observable, extendObservable, IObservable } from "mobx";
import { Repo, DecDict } from "./core";

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

export type Editor = UI & {
  groupFilter?: string;
};

interface App {
  editor?: Editor;
  repo: Repo;
}

export const mix = (store: object, more: object) => {
  extendObservable(store, more);
  return store;
};

export const Editor = ({ groupFilter = "", ...rest }: Editor) =>
  mix(UI(rest), { groupFilter });

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
