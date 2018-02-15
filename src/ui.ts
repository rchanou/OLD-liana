import { observable } from "mobx";
import { Repo, DecDict } from "./core";

interface UI {
  selectedCellIndex: number;
  // readonly getRepo: { (): Repo };
}

interface UIStore {
  selectedCellIndex: number;
  // readonly shownDec: DecDict;
  // readonly getRepo: { (): RepoStore };
}

export const UI = (initial: UI) => {
  const store: UIStore = observable({
    selectedCellIndex: 0,
    ...initial
    // get shownDec() {
    //   return store.getRepo().dict;
    // }
  });
  return store;
};
