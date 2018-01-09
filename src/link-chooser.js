import { types } from "mobx-state-tree";

import { Link, Input, Dependency, ContextRepo } from "./core";
import { ContextUser } from "./user";
import { makeSearchCells } from "./make-search";

const Chooser = types
  .model(`Chooser`, {
    repo: ContextRepo.Key,
    user: ContextUser.Key,
    forLink: types.reference(Link),
    nodeIndex: types.maybe(types.number),
    selectedCellIndex: types.optional(types.number, 0),
    input: types.optional(types.string, ""),
    inputMode: optionalBoolean
  })
  .views(self => ({
    get searchCells() {
      const { repo, user, input } = self;
      const { links, inputs, dependencies } = repo;

      return makeSearchCells(links, input)
        .concat(makeSearchCells(inputs, input, 5))
        .concat(makeSearchCells(dependencies, input, 10));
    },
    get selectedCell() {
      return self.searchCells[self.selectedCellIndex];
    },
    get keyMap() {
      return {
        1: {
          2: { label: "▲", action: self.moveUp }
        },
        2: {
          1: { label: "◀", action: self.moveLeft },
          2: { label: "▼", action: self.moveDown },
          3: { label: "▶", action: self.moveRight }
        },
        3: {
          6: {
            label: "Cancel",
            action() {
              user.setChoosingLink(null);
            }
          }
        }
      };
    }
  }));
