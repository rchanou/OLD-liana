import React from "react";
import { observer } from "mobx-react";

const border = "1px solid rgba(0,0,0,0.5)";

const baseStyle = {
  position: "fixed",
  background: "hsl(60,88%,88%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  borderRight: border,
  borderBottom: border,
  width: "10vw",
  height: 33
};

export const ReactKeyboard = observer(({ keyBoxMap }) => {
  const els = [];

  for (let y = 1; y <= 3; y++) {
    const keySetAtY = keyBoxMap[y];
    for (let x = 0; x <= 9; x++) {
      const newEl = {
        key: x + "." + y,
        style: {
          ...baseStyle,
          top: `calc(100vh - ${132 - y * 33}px)`,
          left: `${x * 10}vw`
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
