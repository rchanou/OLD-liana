import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import React from "react";
import { isAlive, destroy } from "mobx-state-tree";

import { ReactGUI } from "../src/react-gui";
import { App, unpackApp } from "../src/app";
import * as T from "../src/_tests"; // importing this file also runs its tests
import { mix } from "../src/core.ts";

const LOCAL_STORAGE_KEY = "LIANA";
const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
let snapshotToUse;
if (saved) {
  snapshotToUse = JSON.parse(saved);
  snapshotToUse.repo.packages = T.app.repo.packages;
} else {
  snapshotToUse = T.app;
}

class Story extends React.Component {
  state = {};
  constructor() {
    super();
    try {
      this.store = T.strictCreate(App, unpackApp(snapshotToUse));
    } catch (ex) {
      console.error(ex);
      console.warn("Loading default snapshot as backup...");
      this.store = T.strictCreate(App, T.fullApp);
    }
    window.s = this.store;
  }
  componentWillUnmount() {
    if (isAlive(this.store)) {
      destroy(this.store);
    }
  }
  componentDidCatch(error) {
    destroy(this.store);
    this.setState({ error });
  }
  render() {
    const { error } = this.state;
    if (error) {
      return <div style={{ color: "red", fontSize: 42 }}>{`${error}`}</div>;
    }
    return <ReactGUI store={this.store} />;
  }
}

storiesOf("Liana", module).add("new repo test", () => <Story />);
