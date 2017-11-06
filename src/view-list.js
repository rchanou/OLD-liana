import { types, getEnv, getType } from "mobx-state-tree";

import { Node, CallRef, Input, Link, LinkRef, Op, DepRef, Val } from "./core";

const ViewRepoList = types
  .model("ViewRepoList", {
    form: types.maybe(Node)
  })
  .views(self => {
    const { repo, meta } = getEnv(self);
    const { links } = repo;

    return {
      get rows() {
        return links.entries().map(({ nodes }, i) =>
          nodes.map((node, j) => {
            const nodeType = getType(node);

            switch (nodeType) {
              default:
            }
          })
        );
      }
    };
  });

export default ViewRepoList;
