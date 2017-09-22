const system = require("systemjs");
const pull = system.import;

const testDep = "https://unpkg.com/redux@3.7.2/dist/redux.min.js";

(async () => {
  const dep = await pull.call(system, testDep);
  console.log(dep);
})();
