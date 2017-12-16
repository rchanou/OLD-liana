import { types } from "mobx-state-tree";

import { Val, Link } from "./core";

let idCounter = 0;
const optionalId = types.optional(
  types.identifier(types.number),
  () => idCounter++
);

const cellId = optionalId;

const LinkCell = types
  .model("LinkCell", {
    cellId,
    linkId: types.reference(Link),
    subCells: types.maybe(types.array(types.late(() => Cell)))
  })
  .actions(self => ({
    expand() {}
  }));

const BaseCell = types.model("BaseCell", { cellId });

const ValCell = types.compose(BaseCell, Val);

const Cell = types.union(LinkCell, ValCell);
