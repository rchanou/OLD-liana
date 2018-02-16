import { observable } from "mobx";

import { Repo } from "./core";
import { Editor } from "./editor";

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
