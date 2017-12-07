import { types } from "mobx-state-tree";

import { ContextRepo } from "./core";

export const List = types
  .model("ViewRepoList", {
    repo: ContextRepo.Ref
  })
  .views(self => {
    const { repo } = self;
    const { links } = repo;

    return {
      get rows() {
        const rows = [];

        links.forEach(link => {
          const { linkId, label } = link;
          const linkLabel = label;

          const headCell = {
            key: linkId,
            text: link.label
          };

          const tailCells = link.nodes.map((node, j) => ({
            key: `${link}-${j}`,
            color: node.color,
            text: node.label
          }));

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

export default List;
