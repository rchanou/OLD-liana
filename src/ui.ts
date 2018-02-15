import { observable } from "mobx";
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
  const store: UIStore = observable({
    selectedCellIndex: 0,
    get repo() {
      if (initial.getRepo) {
        return initial.getRepo();
      }
      return;
    },
    ...initial
    // get shownDec() {
    //   return store.getRepo().dict;
    // }
  });
  return store;
};

interface App {
  ui?: UI;
  repo: Repo;
}

export const App = (initial: App) => {
  const store: App = observable({
    // ...initial,
    repo: Repo(initial.repo),
    ui: UI({
      ...(initial.ui || {}),
      getRepo: () => store.repo
    })
  });
  return store;
};
