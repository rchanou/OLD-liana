import { makeStore } from "./core";

interface NameSet {
  [textKey: string]: string;
}

interface NameSetMap {
  [localeKey: string]: NameSet;
}

export interface User {
  selectedNameSet?: string;
  nameSets?: NameSetMap;
}

export type UserStore = {
  selectedNameSet: string;
  nameSets: NameSetMap;
  readonly nameSet: NameSet;
};

export const User = (initial: User) => {
  const { selectedNameSet = "en-US", nameSets = { "en-US": {} } } = initial;
  const store: UserStore = makeStore({
    selectedNameSet,
    nameSets,
    get nameSet() {
      return store.nameSets[store.selectedNameSet];
    }
  });
  return store;
};
