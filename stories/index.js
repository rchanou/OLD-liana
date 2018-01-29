import { strictEqual } from "assert";
import React from "react";
import { destroy, getSnapshot, types } from "mobx-state-tree";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

// import { ContextRepo } from "../src/core";ƒ
// import { ReactEditor } from "../src/react-editor";
import { ReactView } from "../src/react-box";

import defaultRepo from "./test-repo";

import {
  // Repo,
  Engine,
  ContextEngine
  // ContextRepo as NewContextRepo
} from "../src/repo";
import { ContextUser } from "../src/user";
// import { App } from "../src/app";
// import { RepoEditor } from "../src/editor";
import { main, user } from "./test-repos";
import { pack, unpack } from "../src/pack";

import { MainEditor } from "../src/editor";

const t2 = {
  main: {
    a: [{ op: "+" }, { val: 1 }, { val: 2 }],
    b: {
      R: [{ val: "fu" }]
    },
    c: {
      R: [{ op: "+" }, { arg: [0, "c"] }, { val: 2 }]
    },
    d: {
      R: {
        R: [{ op: "+" }, { arg: [1, 0] }, { arg: 0 }]
      }
    },
    e: {
      R: {
        R: {
          R: [
            { op: "+" },
            { arg: [0, "e"] },
            { arg: [0, "e", "R"] },
            { arg: [0, "e", "R", "R"] }
          ]
        }
      }
    },
    f: {
      R: [{ ref: [1, "a"] }]
    },
    h: [{ op: "." }, { op: "g" }, { val: "Math" }],
    i: [{ op: "." }, { ref: "h" }, { val: "pow" }],
    j: {
      R: [{ ref: "i" }, { arg: [0, "j"] }, { val: 2 }]
    },
    k: [{ ref: "j" }, { val: 5 }],
    k2: [{ ref: "j" }, { val: 12 }],
    l: [{ op: "." }, { ref: "h" }, { val: "random" }],
    m: [{ op: "." }, { ref: "h" }, { val: "sqrt" }],
    n: {
      a: [{ ref: "j" }, { arg: [0, "n"] }],
      b: [{ ref: "j" }, { arg: [1, "n"] }],
      c: [{ op: "+" }, { ref: ["n", "a"] }, { ref: ["n", "b"] }],
      R: [{ ref: "m" }, { ref: ["n", "c"] }]
    },
    o: {
      a: [{ op: "e" }, { arg: [0, "o"] }, { op: "u" }],
      R: [{ op: "?" }, { ref: ["o", "a"] }, { val: 0 }, { ref: ["o", "b"] }],
      b: [
        { op: "s" },
        { ref: ["o", "c"] },
        { val: "INCREMENT" },
        { ref: ["o", "d"] },
        { val: "DECREMENT" },
        { ref: ["o", "e"] },
        { arg: [0, "o"] }
      ],
      c: [{ op: "." }, { arg: [1, "o"] }, { val: "type" }],
      d: [{ op: "+" }, { arg: [0, "o"] }, { val: 1 }],
      e: [{ op: "+" }, { arg: [0, "o"] }, { val: -1 }]
    },
    // o: [{ ref: "n" }, { val: 5 }, { val: 12 }],
    R: [{ arg: 0 }]
  }
};

const T = Engine.create(t2);
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
  //     editor={{
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
    const store = MainEditor.create({
      [ContextEngine.key]: t2,
      [ContextUser.key]: {
        nameSets: {
          "en-US": {
            id: "en-US",
            names: {
              "b,0": "nuthin"
            }
          }
        }
      }
    });
    window.m = store;

    return <ReactView store={store} />;
  });
