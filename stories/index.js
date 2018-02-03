import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import React from "react";
import { destroy } from "mobx-state-tree";

import { ReactGUI } from "../src/react-gui";
import { App } from "../src/app";
import { engine, user } from "../src/_test-data";
import "../src/_tests"; // just importing these to run the tests

const LOCAL_STORAGE_KEY = "LIANA";

const env = { system: SystemJS };

class Story extends React.Component {
  state = {};
  componentDidMount() {
    // const dom = findDOMNode(this);
    window.s = App.create(this.props.snapshot, env);
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
  componentWillUnmount() {
    destroy(this.state.store);
  }
  render() {
    const { store } = this.state;
    if (!store) {
      return null;
    }
    return <ReactGUI store={store} />;
  }
}

const storedRepo = localStorage.getItem(LOCAL_STORAGE_KEY);
const repoToLoad = storedRepo ? JSON.parse(storedRepo) : defaultRepo;

storiesOf("Liana", module).add("new repo test", () => (
  <Story
    snapshot={{
      engine,
      user,
      mainEditor: { selectedCellIndex: 62 }
    }}
  />
));
