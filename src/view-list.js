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
        return links.entries().map((link, i) => {
          const label = "INSERT LABEL HERE";

          const linkType = getType(link);
          switch (linkType) {
            case Link:
              return [
                label,
                ...nodes.map((node, j) => {
                  const nodeType = getType(node);

                  switch (nodeType) {
                    case LinkRef:
                      return;
                    default:
                  }
                })
              ];

            case Call:
              const linkLabel = "INSERT LINK LABEL HERE";
              return [label, linkLabel];

            default:
              throw new Error("Must be Link or Call, brah!");
          }
        });
      }
    };
  })
  .actions(self => ({
    move() {},
    up() {},
    down() {},
    open() {}
  }));

export default ViewRepoList;
