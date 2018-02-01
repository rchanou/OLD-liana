import { strictEqual } from "assert";
import React from "react";
import { destroy, getSnapshot, types } from "mobx-state-tree";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import { ReactEditor } from "../src/react-editor";
import { App } from "../src/app";
import { Engine } from "../src/core";
import { engine, user } from "./test-repos";
import { pack, unpack, inflate } from "../src/pack";

const T = Engine.create(engine);
window.T = T;
strictEqual(T.run("c")(3), 5);
strictEqual(T.run("e")(3)(5)(7), 15);
strictEqual(T.run("n")(11, 60), 61);

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

// const context = {
//   [ContextRepo.KEY]: defaultRepo
// };

// const unpackTest = unpack({ ...main, user });
// const packTest = pack(unpackTest);

// const unpackLength = JSON.stringify(unpackTest).length;
// const packLength = JSON.stringify(packTest).length;
// console.log(packLength, unpackLength, packLength / unpackLength);

// window.n = Repo.create(packTest);

// console.log(window.n.decs.get("e").out({ type: "DECREMENT" })(5), 4);

storiesOf("Liana", module)
  // .add("editor", () => (
  //   <Story
  //     editor={{
  //       ...context,
  //       repoList: {
  //         // tree: { rootLink: "g" },
  //         selectedCellIndex: 75
  //       }
  //     }}
  //   />
  // ))
  // .add("editor in chooser", () => (
  //   <Story
  //     editor={{1
  //       ...context,
  //       repoList: {
  //         selectedCellIndex: 75,
  //         chooser: { forLink: "16", nodeIndex: 1 }
  //       }
  //     }}
  //   />
  // ))
  // .add("OLD new repo test", () => {
  //   const store = RepoEditor.create({
  //     [NewContextRepo.key]: packTest
  //   });
  //   // window.m = store;
  //   return <ReactView store={store} />;
  // })
  .add("new repo test", () => {
    const store = App.create({
      engine,
      user,
      mainEditor: { selectedCellIndex: 62 }
    });
    window.m = store;

    return <ReactEditor store={store} />;
  });

const packTest = pack(engine.main);
// console.log(packTest);
const unpackTest = unpack(packTest);
// console.log(unpackTest);
// window.n = Engine.create({ main: unpackTest });
const packLen = JSON.stringify(packTest).length;
const fullLen = JSON.stringify(unpackTest).length;
console.log(fullLen, packLen, packLen / fullLen);
