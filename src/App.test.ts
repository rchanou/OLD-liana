import { types, getSnapshot } from "mobx-state-tree";
import { autorun } from "mobx";

it("does stuff", async () => {
  const Peep = types
    .model({
      peepId: types.identifier(types.string),
      name: types.string
    })
    .actions(self => ({
      setName(val) {
        self.name = val;
      }
    }));

  const Project = types.model({
    projectId: types.identifier(types.string),
    name: types.string,
    peeps: types.map(types.reference(Peep)),
    priority: types.number
  });

  const Company = types.model({
    peeps: types.map(Peep),
    projects: types.map(Project),
    valuation: types.number
  });

  const createStartup = ({ peeps, valuation }) => {
    // const projectPeeps = new Map(Object.keys(peeps).map(k => [k, k]));
    const projectPeeps = {};
    for (const key of Object.keys(peeps)) {
      projectPeeps[key] = key;
    }
    console.log("le peeps", projectPeeps);
    return Company.create({
      peeps,
      valuation,
      projects: {
        0: {
          projectId: "0",
          name: "demo",
          peeps: projectPeeps,
          priority: 0
        }
      }
    });
  };

  const startupStore = createStartup({
    peeps: {
      0: {
        peepId: "0",
        name: "harambe"
      }
    },
    valuation: 1000000000
  });

  console.log(startupStore.peeps === startupStore.projects.get(0).peeps);
  startupStore.peeps.get(0).setName("hulaballo");
  console.log(startupStore.peeps.get(0).name, startupStore.projects.get(0).peeps.get(0).name);
  console.log(startupStore.peeps.get(0) === startupStore.projects.get(0).peeps.get(0));
  // expect(startupStore.peeps).toBe(startupStore.projects.get(0).peeps);
});
