import { types, getEnv, getType } from "mobx-state-tree";

import { Node, CallRef, Input, Link, Call, LinkRef, Op, DepRef, Val } from "./core";

const ViewRepoList = types
  .model("ViewRepoList", {
    form: types.maybe(Node)
  })
  .views(self => {
    const { repo, meta } = getEnv(self);
    const { links } = repo;

    return {
      get rows() {
        return links.values().map((link, i) => {
          const headCell = "INSERT LABEL HERE";
          const linkType = getType(link);
          switch (linkType) {
            case Link:
              const tailCells = link.nodes.map((node, key) => {
                const nodeType = getType(node);

                switch (nodeType) {
                  case LinkRef:
                    return {
                      key,
                      color: "rebeccapurple",
                      text: node.ref.linkId
                    };

                  case CallRef:
                    return {
                      key,
                      color: "pink",
                      text: "call"
                    };

                  case DepRef:
                    return {
                      key,
                      color: "aquamarine",
                      text: node.dep.path.slice(0, 22)
                    };

                  case Op:
                    return {
                      key,
                      color: "green",
                      text: node.op
                    };

                  case Input:
                    return {
                      key,
                      color: "orange",
                      text: node.input
                    };

                  case Val:
                    return {
                      key,
                      color: "lightblue",
                      text: node.val
                    };
                  default:
                    return {
                      color: "blue",
                      text: "tail"
                    };
                }
              });

              return [headCell, ...tailCells];

            case Call:
              const linkRefCell = "INSERT LINK LABEL HERE";
              return [headCell, linkRefCell];

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
