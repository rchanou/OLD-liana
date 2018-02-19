import { observable, toJS, isObservable, extendObservable } from "mobx";

import * as C from "./core";
import * as U from "./ui";
import { App } from "./app";
import { deepStrictEqual as de } from "assert";

const g = window as any;
g.t = toJS;

de(1, 1);

const a = observable({ a: 1 });
g.b = observable({
  b: 2,
  a
});
de(a, g.b.a);

const glob = { op: C.OpEnum.Global };
const add = { op: C.OpEnum.Add };

g.d = {
  a: [{ val: 1 }],
  b: [add, { val: 2 }, { val: 3 }],
  "c,R": [add, { scope: "c" }, { val: 7 }],
  "d,R": [add, { scope: "d" }, { scope: "d", arg: 1 }, { val: 11 }],
  "d1,R": [add, { ref: ["d1", "a"] }, { val: 10 }],
  "d1,a": [add, { scope: "d1" }, { val: 20 }],
  e: [{ ref: "d" }, { val: 6 }, { val: 8 }],
  f: [{ ref: "d" }, { val: -5 }, { val: -3 }],
  g: [add, { ref: "e" }, { ref: "f" }],
  "h,R,R": [add, { scope: "h" }, { scope: ["h", "R"] }],
  i: [{ ref: ["h", "R"] }, { val: 13 }],
  j: [{ ref: "i" }, { val: 5 }],
  k: [{ ref: "j" }, { val: 2 }]
};

g.ge = (path: string[]) => C.gen(g.d, path);
const { ge } = g;

g.e = ge("a");
de(g.e, 1);
de(g.e, ge("a"));

g.f = ge("b");
de(g.f, 5);

g.g = ge("c");
de(g.g(2), 9);

g.h = ge("d");
de(g.h(7, 9), 27);

de(ge("d1")(30), 60);

de(ge("e"), 25);
de(ge("f"), 3);
de(ge("g"), 28);

g.h = ge("h");
de(g.h(-3)(-7), -10);

const i: C.Repo = {
  main: [
    {
      id: "a",
      line: [add, { val: 1 }, { val: 2 }]
    },
    {
      id: "b",
      line: [
        {
          id: "R",
          line: [add, { scope: "b" }, { val: 3 }]
        }
      ]
    }
  ]
};
g.i = i;

const h: U.UI = {
  repo: i
};

g.h = C.fillLine(i.main);

interface K {
  b: number;
  a: number;
  fuzzy: { (x: number): number };
}

const k: K = {
  b: 5,
  get a() {
    return k.b * 5;
  },
  fuzzy(x: number) {
    return x * k.b * k.a;
  }
};
g.k = k;
g.l = observable(k);

export const j = App({
  repo: i
});
g.j = j;

const z = observable({ a: 1 });

interface Y {
  a: number;
}
const y: Y = { a: 1 };

const extend = (obj: any, prop: string, val: any) => {
  if (isObservable(obj)) {
    extendObservable(obj, { [prop]: val });
  } else {
    obj[prop] = val;
  }
};
extend(z, "wut", 3);
extend(y, "wut", 3);
console.log(z, y);
