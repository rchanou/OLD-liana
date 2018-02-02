import { strictEqual } from "assert";
import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import React from "react";
import { destroy } from "mobx-state-tree";

import { ReactGUI } from "../src/react-gui";
import { App } from "../src/app";
import { ContextEngine, incrementLetterId } from "../src/core";
import { engine, user } from "./test-data";
import { pack, unpack, inflate } from "../src/pack";

const t = ContextEngine.create(engine);
window.t = t;
strictEqual(t.run("c")(3), 5);
strictEqual(t.run("e")(3)(5)(7), 15);
strictEqual(t.run("n")(11, 60), 61);
const counter = t.run("o");
strictEqual(counter(), 0);
strictEqual(counter(5), 5);
strictEqual(counter(5, { type: "INCREMENT" }), 6);
strictEqual(counter(5, { type: "DECREMENT" }), 4);
strictEqual(counter(5, { type: "Invalid action!" }), 5);

const LOCAL_STORAGE_KEY = "LIANA";

const env = { system: SystemJS };

class Story extends React.Component {
  state = {};
  componentDidMount() {
    // const dom = findDOMNode(this);
    window.s = App.create(
      this.props.snapshot || {
        engine,
        user,
        mainEditor: { selectedCellIndex: 62 }
      },
      env
    );
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

const packTest = pack(engine.main);
// console.log(packTest);
const unpackTest = unpack(packTest);
// console.log(unpackTest);
// window.n = Engine.create({ main: unpackTest });
const packLen = JSON.stringify(packTest).length;
const fullLen = JSON.stringify(unpackTest).length;
console.log(fullLen, packLen, packLen / fullLen);

strictEqual(incrementLetterId("a"), "b");
strictEqual(incrementLetterId("z"), "a0");
strictEqual(incrementLetterId("a0"), "a1");
strictEqual(incrementLetterId("a1"), "a2");
strictEqual(incrementLetterId("zz"), "a00");
strictEqual(incrementLetterId("a0z"), "a10");
strictEqual(incrementLetterId("dog"), "doh");
