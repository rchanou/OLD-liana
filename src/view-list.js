import { types, getEnv, getType } from "mobx-state-tree";

import { Node, CallRef, Input, Link, Call, LinkRef, Op, DepRef, Val, Repo } from "./core";

const ViewRepoList = types
  .model("ViewRepoList", {
    repo: Repo.ContextRef,
    form: types.maybe(Node)
  })
  .views(self => {
    const { meta } = getEnv(self);
    const { repo } = self
    const { links } = repo;

    return {
      get rows() {
        return links.values().map((link, i) => {
          const { linkId } = link;
          const linkLabel = meta.linkLabelSet.get(linkId);

          const linkType = getType(link);
          switch (linkType) {
            case Link:
              const headCell = {
                key: linkId,
                color: "violet",
                text: link.label
              };

              const tailCells = link.nodes.map((node, j) => {
                const key = `${link}-${j}`;
                const nodeType = getType(node);
                switch (nodeType) {
                  case LinkRef:
                    return {
                      key,
                      color: "orchid",
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
              const callHeadCell = {
                key: `c-${link.callId}`,
                color: "pink",
                text: link.callId
              };

              const linkRefCell = {
                key: 0,
                color: "violet",
                text: link.link.linkId
              };

              return [callHeadCell, linkRefCell];

            default:
              throw new Error("Must be Link or Call, brah!");
          }
        });
      }
    };
  })
  .actions(self => ({
    move() { },
    up() { },
    down() { },
    open() { }
  }));

export default ViewRepoList;
