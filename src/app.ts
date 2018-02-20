import { observable, IObservableValue, IObservableObject } from "mobx";

import { Repo, mix } from "./core";
import { User } from "./user";
import { UIStore } from "./ui";
import { Editor } from "./editor";

const LOCAL_STORAGE_KEY = "LIANA";

interface YXMap {
  [keyCode: string]: [number, number];
}
const yxKeyLayout: YXMap = {
  // TODO: make customizable
  65: [0, 2],
  66: [4, 3],
  67: [2, 3],
  68: [4, 2],
  69: [7, 2],
  70: [2, 1],
  71: [4, 1],
  72: [5, 2],
  73: [8, 2],
  74: [5, 1],
  75: [5, 3],
  76: [6, 1],
  77: [6, 3],
  78: [6, 2],
  79: [9, 2],
  80: [3, 1],
  81: [0, 1],
  82: [1, 2],
  83: [2, 2],
  84: [3, 2],
  85: [7, 1],
  86: [3, 3],
  87: [1, 1],
  88: [1, 3],
  89: [8, 1],
  90: [0, 3],
  186: [9, 1],
  188: [7, 3],
  190: [8, 3],
  191: [9, 3]
};

interface App {
  repo: Repo;
  user?: User;
  editor?: Editor;
  heldKeyCoords?: {
    x: number;
    y: number;
  } | null;
  current?: UIStore;
}

interface KeyMap {
  onKey: { (e: KeyboardEvent): void };
}

export type AppStore = App & {
  current: UIStore;
  keyMap: KeyMap;
  handleKeyDown: { (): void };
  handleKeyUp: { (): void };
};

export const App = (initial: App) => {
  const { repo, user = {}, editor = {} } = initial;
  const store: AppStore = mix({
    repo: Repo(repo),
    editor: Editor(
      Object.assign(
        {
          get repo() {
            return store.repo;
          },
          get app() {
            return store;
          }
        },
        editor
      )
    ),
    heldKeyCoords: null,
    get current() {
      return store.editor;
    },
    get cells() {
      return store.current.cells;
    },
    get keyMap() {
      return store.current.keyMap;
    },
    get handleInput() {
      return store.current.handleInput;
    },
    handleKeyDown(e: KeyboardEvent) {
      const { keyCode } = e;
      const { keyMap } = store;
      if (keyMap instanceof Function) {
        keyMap(e);
        return;
      }
      if (keyMap.onKey) {
        keyMap.onKey(e);
        return;
      }
      const coords = yxKeyLayout[keyCode]; // TODO: make key layout editable
      if (!coords) {
        return;
      }
      e.preventDefault();
      const [x, y] = coords;
      store.heldKeyCoords = { x, y };
      const YKeyMap = keyMap[y];
      if (YKeyMap) {
        const thisKey = YKeyMap[x];
        if (thisKey) {
          const { action } = thisKey;
          if (action instanceof Function) {
            action();
          } else if (action instanceof Array) {
            for (const subAction of action) {
              subAction();
            }
          }
        }
      }
    },
    handleKeyUp() {
      store.heldKeyCoords = null;
    },
    destroy() {
      document.removeEventListener("keydown", store.handleKeyDown);
      document.removeEventListener("keyup", store.handleKeyUp);
    }
  });
  document.addEventListener("keydown", store.handleKeyDown);
  document.addEventListener("keyup", store.handleKeyUp);
  return store;
};
