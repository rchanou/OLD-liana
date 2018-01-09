import React from "react";
import { observer } from "mobx-react";

const border = "1px solid rgba(0,0,0,0.3)";

const wUnit = 10;
const yUnit = 33;

const baseStyle = {
  position: "fixed",
  background: "hsl(60,88%,77%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  borderRight: border,
  borderBottom: border,
  width: `${wUnit}vw`,
  height: yUnit,
  color: "#333"
};

const totalHeight = yUnit * 4;

export const ReactKeyboard = observer(({ editor }) => {
  const { keyMap, selectedCoords } = editor;

  const els = [];

  for (let y = 1; y <= 3; y++) {
    const keySetAtY = keyMap[y];
    for (let x = 0; x <= 9; x++) {
      const newEl = {
        key: x + "." + y,
        style: {
          ...baseStyle,
          top: `calc(100vh - ${totalHeight - y * yUnit}px)`,
          left: `${x * wUnit}vw`
        }
      };

      if (x === 4 || x === 5) {
        newEl.style.background = "hsl(60,88%,88%)";
      }

      if (selectedCoords && selectedCoords.x == x && selectedCoords.y == y) {
        newEl.style.background = "hsl(60,77%,66%)";
      }

      if (keySetAtY) {
        const thisKey = keySetAtY[x];
        if (thisKey && thisKey.label) {
          newEl.children = thisKey.label;
        }
      }

      els.push(<div {...newEl} />);
    }
  }

  return els;
});
