import { types } from "mobx-state-tree";
import { UI, formatOut } from "./view";
import { optionalModel } from "./model-utils";
import { RefPath } from "./core";

export const Chooser = types
  .compose(
    "Chooser",
    UI,
    optionalModel({
      show: false,
      path: types.optional(RefPath, []),
      index: types.maybe(types.number),
      filter: "",
      inputMode: false
    })
  )
  .actions(self => ({
    toggle(path, index) {
      if (path != null) {
        self.path = path;
      }
      if (index != null) {
        self.index = index;
      }
      self.show = !self.show;
    },
    toggleInputMode() {
      self.inputMode = !self.inputMode;
    },
    handleInput(e) {
      self.filter = e.target.value;
    }
  }))
  .views(self => ({
    get input() {
      return self.inputMode ? self.filter : null;
    },
    get baseCells() {
      const { filter, repo, user, path, index } = self;
      const { main } = repo;
      let x = 0;
      let y = 0;
      let paramX = x + 5;
      let paramY = y + 1;
      const cells = [
        {
          key: "FILTER",
          x,
          y: y++,
          width: 5,
          text: self.filter,
          selectable: true
        }
      ];
      const paramCells = [];
      const pushDecRefCells = (dec, prePath = []) => {
        dec.forEach((subDec, subId) => {
          const path = [...prePath, subId];
          cells.push({
            path,
            key: `CHS-${path}`,
            x,
            y: y++,
            width: 5,
            text: `${user.pathName(path)} = ${formatOut(repo, path)}`,
            selectable: true,
            fill: "orchid"
          });
        });
        const decParams = repo.fullParams[prePath];
        if (decParams) {
          for (let i = 0; i < decParams.length; i++) {
            const decParam = decParams[i];
            paramCells.push({
              path: [...prePath, i],
              key: `CHS-P-${prePath},${i}`,
              x: paramX,
              y: paramY++,
              width: 5,
              text: decParam.name,
              selectable: true,
              fill: "goldenrod"
            });
          }
        }
      };
      let currentDec = repo.main;
      pushDecRefCells(currentDec);
      const runningPath = [];
      for (const id of path) {
        currentDec = currentDec.get(id);
        if (currentDec && !(currentDec instanceof Array)) {
          //TODO: warn, throw if not?
          runningPath.push(id);
          pushDecRefCells(currentDec, runningPath);
        }
      }
      return cells.concat(paramCells);
      // if (!subDec.label) {
      //   return;
      // }
      // let key, text;
      // if (subDec.linkId !== undefined) {
      //   key = `SCL-${subDec.linkId}`;
      //   text = `${subDec.label} = ${formatOut(subDec.out)}`;
      // } else if (subDec.inputId !== undefined) {
      //   key = `SCI-${subDec.inputId}`;
      //   text = subDec.label;
      // } else if (subDec.depId !== undefined) {
      //   key = `SCD-${subDec.depId}`;
      //   text = subDec.label;
      // }
      // const selectable =
      //   !subDec.equivalent(currentNode) && !subDec.equivalent(forLink);
      // if (
      //   subDec.label.includes(filter) ||
      //   formatOut(subDec.out).includes(filter)
      // ) {
      //   cells.push({
      //     subDec,
      //     key,
      //     x,
      //     y: y++,
      //     width: 5,
      //     selectable,
      //     fill: selectable ? subDec.color : "#999",
      //     text
      //   });
      // }
    },
    get keyMap() {
      if (self.inputMode) {
        return {
          title: "Search",
          enter: "Finish",
          onKey(e) {
            if (e.keyCode == 13) {
              self.toggleInputMode();
              if (self.baseCells.length > 1) {
                self.selectCellIndex(self.selectedCellIndex + 1);
              }
            }
          }
        };
      }
      return {
        1: {
          2: { label: "▲", action: self.moveUp }
        },
        2: {
          1: { label: "◀", action: self.moveLeft },
          2: { label: "▼", action: self.moveDown },
          3: { label: "▶", action: self.moveRight },
          6: {
            label: "Choose",
            action: [
              () => {
                if (self.selectedCell.key === "FILTER") {
                  self.toggleInputMode();
                  return;
                }
                self.toggle();
              }
            ]
          }
        },
        3: {
          6: {
            label: "Cancel",
            action: self.toggle
          }
        }
      };
    }
  }));
