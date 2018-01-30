import React from "react";
import { observer } from "mobx-react";

const border = "1px solid #eee";
const hue = 177;
const wUnit = 10;
const yUnit = 33;

const baseStyle = {
  position: "fixed",
  background: `hsl(${hue},88%,55%)`,
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

const inputModeEl = (
  <div
    style={{
      ...baseStyle,
      width: "100vw",
      height: yUnit * 3,
      top: `calc(100vh - ${yUnit * 3}px)`
    }}
  >
    Input Mode
  </div>
);

export const ReactKeyboard = observer(({ store }) => {
  const { keyMap, heldKeyCoords } = store;

  if (typeof keyMap === "function") {
    return inputModeEl;
  }

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
        newEl.style.background = `hsl(${hue},88%,77%)`;
      }

      if (heldKeyCoords && heldKeyCoords.x == x && heldKeyCoords.y == y) {
        newEl.style.background = `hsl(${hue},77%,44%)`;
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
