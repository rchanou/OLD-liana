import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import React from "react";
import { destroy } from "mobx-state-tree";

import { ReactGUI } from "../src/react-gui";
import { App, unpackApp } from "../src/app";
import { engine, user, strictCreate } from "../src/_tests"; // importing this file also runs its tests

const LOCAL_STORAGE_KEY = "LIANA";
// const env = { system: SystemJS };

// class Story extends React.Component {
//   state = {};
//   componentDidMount() {
//     // const dom = findDOMNode(this);
//     this.setState({ store: window.s });
//   }
//   // componentDidCatch() {
//   //   destroy(this.state.store);
//   //   window.s = Editor.create({
//   //     [ContextRepo.KEY]: defaultRepo,
//   //     repoList: { selectedCellIndex: 75 },
//   //     env
//   //   });
//   //   this.setState({ store: window.s });
//   // }
//   componentWillUnmount() {
//     destroy(this.state.store);
//   }
//   render() {
//     const { store } = this.state;
//     if (!store) {
//       return null;
//     }
//     return <ReactGUI store={store} />;
//   }
// }

const defaultSnapshot = {
  engine,
  user,
  mainEditor: { selectedCellIndex: 62 }
};
const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
const snapshotToUse = (() => {
  try {
    const snapshotToUse = saved ? JSON.parse(saved) : defaultSnapshot;
    window.s = strictCreate(App, unpackApp(snapshotToUse));
  } catch (ex) {
    console.error(ex);
    console.warn("Loading default snapshot as backup...");
    window.s = strictCreate(App, defaultSnapshot);
  }
})();

// window.s = strictCreate(App, this.props.snapshot);
// const storedRepo = localStorage.getItem(LOCAL_STORAGE_KEY);
// const repoToLoad = storedRepo ? JSON.parse(storedRepo) : defaultRepo;

storiesOf("Liana", module).add(
  "new repo test",
  () => <ReactGUI store={window.s} />
  // || (
  //   <Story
  //     snapshot={{
  //       engine,
  //       user,
  //       mainEditor: { selectedCellIndex: 62 }
  //     }}
  //   />
  // )
);
