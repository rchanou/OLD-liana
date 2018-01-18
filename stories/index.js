import React from "react";
import { destroy, getSnapshot } from "mobx-state-tree";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import { ContextRepo } from "../src/core";
import { ReactEditor } from "../src/react-editor";
import defaultRepo from "./test-repo";

import { Repo } from "../src/repo";
import { App } from "../src/app";
import { Editor } from "../src/editor";
import { main, user } from "./test-repos";
import { pack, unpack } from "../src/pack";

const LOCAL_STORAGE_KEY = "LIANA";

const params = new Map(
  Object.entries({
    0: 4,
    1: { type: "INCREMENT" }
  })
);

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
  ));

const unpackTest = unpack({ ...main, user });
const packTest = pack(unpackTest);

const unpackLength = JSON.stringify(unpackTest).length;
const packLength = JSON.stringify(packTest).length;
console.log(packLength, unpackLength, packLength / unpackLength);

window.n = Repo.create(packTest);

console.log(window.n.decs.get("e").out({ type: "DECREMENT" })(5), 4);
