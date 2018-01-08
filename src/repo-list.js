import { getType } from "mobx-state-tree";

import { Link, Dependency } from "./core";
import * as Color from "./color";

export const makeRepoCells = (repo, x = 0, y = 0) => {
  const cells = [];

  let currentX = x;
  let currentY = y - 1;

  repo.links.forEach(link => {
    const { linkId, nodes, out, label } = link;

    currentX = x;
    currentY++;

    const key = `CL-${linkId}`;

    cells.push({
      key,
      x: currentX,
      y: currentY,
      width: 2,
      selectable: true,
      text: label
    });

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      const key = `CL-${linkId}-${i}`;

      currentX += 2;

      const newCell = {
        key,
        x: currentX,
        y: currentY,
        width: 2,
        selectable: true,
        forLink: link,
        nodeIndex: i,
        text: node.label,
        fill: node.color
      };

      if (node.ref) {
        newCell.gotoCellKey = `CL-${node.ref.linkId}-0`;
      }

      cells.push(newCell);
    }

    currentX += 2;

    let text;
    if (out instanceof Error) {
      text = out.message;
    } else if (out === Dependency) {
      text = "...";
    } else if (typeof out === "function") {
      text = "func";
    } else {
      text = JSON.stringify(out);
    }

    cells.push({
      key: `${key}-V`,
      x: currentX,
      y: currentY,
      width: 2,
      selectable: false,
      text
    });
  });

  return cells;
};
