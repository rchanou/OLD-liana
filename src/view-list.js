import { types, getType } from "mobx-state-tree";

import { Node, CallRef, InputRef, Link, LinkRef, Op, DepRef, Val, ContextRepo } from "./core";

const ViewRepoList = types
  .model("ViewRepoList", {
    repo: ContextRepo.Ref,
    form: types.maybe(Node)
  })
  .views(self => {
    const { repo } = self;
    const { links } = repo;

    return {
      get rows() {
        const rows = [];

        links.forEach(link => {
          const linkType = getType(link);

          if (linkType !== Link) {
            return;
          }

          const { linkId, label } = link;
          const linkLabel = label;

          const headCell = {
            key: linkId,
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
                  text: node.ref.label
                };

              case CallRef:
                return {
                  key,
                  color: "pink",
                  text: node.call.link.label
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
                  color: "lightgreen",
                  text: node.op
                };

              case InputRef:
                return {
                  key,
                  color: "orange",
                  text: node.label || `{${node.input.inputId}}`
                };

              case Val:
                return {
                  key,
                  color: "lightblue",
                  text: node.val
                };
              default:
                return {
                  color: "red",
                  text: node.val || "???"
                };
            }
          });

          rows.push([headCell, ...tailCells]);
        });

        return rows;
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
