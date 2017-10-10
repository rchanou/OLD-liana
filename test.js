const { types, getEnv } = require("mobx-state-tree");
const { autorun } = require("mobx");

const Record = types.model("Record", {
  id: types.identifier(types.number),
  name: types.string
});

const Records = types.array(Record);

const A = types
  .model("A", {
    selected: types.number
  })
  .views(self => {
    const { records } = getEnv(self);
    return {
      get selectedRecord() {
        return records[self.selected];
      }
    };
  })
  .actions(self => ({
    select(id) {
      self.selected = id;
    }
  }));

const records = [{ id: 0, name: "joe" }, { id: 1, name: "ccaa" }, { id: 2, name: "ab" }, { id: 3, name: "j" }];

const a = A.create({ selected: 1 }, { records });

autorun(() => {
  console.log(a.selectedRecord);
});

a.select(2);
