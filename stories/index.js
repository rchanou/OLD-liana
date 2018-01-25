import { strictEqual } from "assert";
import React from "react";
import { destroy, getSnapshot } from "mobx-state-tree";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import { ContextRepo } from "../src/core";
import { ReactEditor } from "../src/react-editor";
import { ReactView } from "../src/react-box";

import defaultRepo from "./test-repo";

import { Repo, Engine, ContextEngine, ContextRepo as NewContextRepo } from "../src/repo";
import { App } from "../src/app";
import { RepoEditor } from "../src/editor";
import { main, user } from "./test-repos";
import { pack, unpack } from "../src/pack";

import { MainEditor } from "../src/new-editor";

const t2 = {
  main: {
    a: [{ op: "+" }, { val: 1 }, { val: 2 }],
    b: {
      R: [{ val: "fu" }]
    },
    c: {
      R: [{ op: "+" }, { arg: 0 }, { val: 2 }]
    },
    d: {
      R: {
        R: [{ op: "+" }, { arg: [1, 0] }, { arg: 0 }]
      }
    },
    e: {
      R: {
        R: {
          R: [{ op: "+" }, { arg: [2, 0] }, { arg: [1, 0] }, { arg: 0 }]
        }
      }
    },
    f: {
      R: [{ ref: [1, "a"] }]
    },
    R: [{ arg: 0 }]
  }
};

const T = Engine.create(t2);
window.T = T;
strictEqual(T.out(3), 3);
strictEqual(T.run("b")(), "fu");
strictEqual(T.run("a"), 3);
strictEqual(T.run("c")(5), 7);
strictEqual(T.run("d")(7)(11), 18);
strictEqual(T.run("e")(7)(8)(9), 24);
strictEqual(T.run("f")(), 3);

const LOCAL_STORAGE_KEY = "LIANA";

window.g = store => getSnapshot(store);

const env = { system: SystemJS };

class Story extends React.Component {
  state = {};

  componentDidMount() {
    // const dom = findDOMNode(this);
    window.s = App.create(this.props.editor, env);
    this.setState({ store: window.s });
  }

  // componentDidCatch() {
  //   destroy(this.state.store);

  //   window.s = Editor.create({
  //     [ContextRepo.KEY]: defaultRepo,
  //     repoList: { selectedCellIndex: 75 },
  //     env
  //   });

  //   this.setState({ store: window.s });
  // }

  // componentWillUnmount() {
  // destroy(this.state.store);
  // }

  render() {
    const { store } = this.state;

    if (!store) {
      return null;
    }

    return <ReactEditor editor={store} />;
  }
}

const storedRepo = localStorage.getItem(LOCAL_STORAGE_KEY);

const repoToLoad = storedRepo ? JSON.parse(storedRepo) : defaultRepo;

const context = {
  [ContextRepo.KEY]: defaultRepo
};

const unpackTest = unpack({ ...main, user });
const packTest = pack(unpackTest);

const unpackLength = JSON.stringify(unpackTest).length;
const packLength = JSON.stringify(packTest).length;
console.log(packLength, unpackLength, packLength / unpackLength);

window.n = Repo.create(packTest);

// console.log(window.n.decs.get("e").out({ type: "DECREMENT" })(5), 4);

storiesOf("Liana", module)
  .add("editor", () => (
    <Story
      editor={{
        ...context,
        repoList: {
          // tree: { rootLink: "g" },
          selectedCellIndex: 75
        }
      }}
    />
  ))
  .add("editor in chooser", () => (
    <Story
      editor={{
        ...context,
        repoList: {
          selectedCellIndex: 75,
          chooser: { forLink: "16", nodeIndex: 1 }
        }
      }}
    />
  ))
  .add("OLD new repo test", () => {
    const store = RepoEditor.create({
      [NewContextRepo.key]: packTest
    });
    // window.m = store;
    return <ReactView store={store} />;
  })
  .add("new repo test", () => {
    const store = MainEditor.create({
      [ContextEngine.key]: t2
    });
    window.m = store;

    return <ReactView store={store} />;
  });
