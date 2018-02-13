const tandem = (array, dom) => {
  array.push = function(...items) {
    array.push(...items);
    for (const item of items) {
      const el = document.createElement("div");
      el.innerHTML = item;
      dom.appendChild(el);
    }
  };
};

const a = [1, 2, 3];
tandem(a, document.body);
const b = Array.isArray(a);
