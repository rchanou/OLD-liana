import React from "react";
import { observer } from "mobx-react";

const border = "1px solid #eee";
const hue = 199;
const wUnit = 10;
const yUnit = 33;

const baseStyle = {
  position: "fixed",
  background: `hsl(${hue},77%,72%)`,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  borderRight: border,
  borderBottom: border,
  width: `${wUnit}vw`,
  height: yUnit,
  color: "#333"
};

const totalHeight = yUnit * 4;

const FullDisplay = ({ children = "Input Mode" }) => (
  <div
    style={{
      ...baseStyle,
      width: "100vw",
      height: yUnit * 3,
      top: `calc(100vh - ${yUnit * 3}px)`
    }}
  >
    {children}
  </div>
);

const defaultInputModeEl = <FullDisplay />;

const fullDisplayStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

export const ReactKeyboard = observer(({ store }) => {
  const { keyMap, heldKeyCoords } = store;
  if (typeof keyMap === "function") {
    return defaultInputModeEl;
  }
  const { title, enter } = keyMap;
  if (title) {
    const children = [<div>{title}</div>];
    if (enter) {
      children.push(<div>Press Enter to {enter}</div>);
    }
    // TODO: display actions for esc, tab if given
    return (
      <FullDisplay>
        <div style={fullDisplayStyle}>{children}</div>
      </FullDisplay>
    );
  }
  const els = [];
  for (let y = 1; y <= 3; y++) {
    const keySetAtY = keyMap[y];
    for (let x = 0; x <= 9; x++) {
      const newElProps = {
        key: x + "." + y,
        style: {
          ...baseStyle,
          top: `calc(100vh - ${totalHeight - y * yUnit}px)`,
          left: `${x * wUnit}vw`
        }
      };
      if (x === 4 || x === 5) {
        newElProps.style.background = `hsl(${hue},77%,82%)`;
      }
      if (heldKeyCoords && heldKeyCoords.x == x && heldKeyCoords.y == y) {
        newElProps.style.background = `hsl(${hue},77%,66%)`;
      }
      if (keySetAtY) {
        const thisKey = keySetAtY[x];
        if (thisKey && thisKey.label) {
          newElProps.children = thisKey.label;
        }
      }
      els.push(<div {...newElProps} />);
    }
  }
  return els;
});
