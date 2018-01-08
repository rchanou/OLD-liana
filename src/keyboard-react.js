import React from "react";
import { observer } from "mobx-react";

const border = "1px solid rgba(0,0,0,0.5)";

const wUnit = 10;
const yUnit = 33;

const baseStyle = {
  position: "fixed",
  background: "hsl(60,88%,88%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  borderRight: border,
  borderBottom: border,
  width: `${wUnit}vw`,
  height: yUnit
};

const totalHeight = yUnit * 4;

export const ReactKeyboard = observer(({ keyBoxMap }) => {
  const els = [];

  for (let y = 1; y <= 3; y++) {
    const keySetAtY = keyBoxMap[y];
    for (let x = 0; x <= 9; x++) {
      const newEl = {
        key: x + "." + y,
        style: {
          ...baseStyle,
          top: `calc(100vh - ${totalHeight - y * yUnit}px)`,
          left: `${x * wUnit}vw`
        }
      };

      if (keySetAtY) {
        const thisKey = keySetAtY[x];
        if (thisKey) {
          newEl.children = thisKey;
        }
      }

      els.push(<div {...newEl} />);
    }
  }

  return els;
});
