import React from "react";
import { observer } from "mobx-react";

import { Link } from "./core";

const containerStyle = {
  position: "absolute",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  textAlign: "center"
};

const unit = 40;
const spacer = 0.1 * unit;
const darkGray = "#888";

const nodeStyle = {
  position: "absolute",
  borderWidth: 0.5 * spacer,
  borderStyle: "solid",
  borderColor: "#333",
  borderRadius: 0.5 * spacer,
  boxShadow: "1px 1px 1px 1px hsla(0,0%,55%,0.5)",
  height: unit - 3 * spacer,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "#fff",
  textOverflow: "clip"
  // whiteSpace: "nowrap"
};

const lineStyle = {
  position: "absolute",
  background: darkGray,
  width: 6 * spacer,
  height: 4 * spacer,
  zIndex: -1,
  borderLeft: "thin solid #333",
  borderRight: "thin solid #333"
  // boxShadow: "0.5px 0.5px 0.5px 0.5px hsla(0,0%,55%,0.5)"
};

export const ReactTree = observer(({ boxes }) => {
  const displayNodes = boxes.map(
    ({ x, y, size, color, key, form, text, category, selected }) => {
      const style = {
        ...nodeStyle,
        top: `calc(100vh - ${(y + 1) * unit}px)`,
        left: x * unit,
        width: size * unit + 0.5 * spacer,
        background: color,
        ...(selected ? { borderWidth: 3, borderColor: "yellow" } : {})
      };

      const connector =
        category === Link ? (
          <div
            key={`${key}L`}
            style={{
              ...lineStyle,
              left: unit * (x + 0.5) - 3 * spacer,
              top: `calc(100vh - ${(y + 1) * unit + 3 * spacer}px)`
            }}
          />
        ) : null;

      return [
        connector,
        <div key={key} style={style}>
          {text}
        </div>
      ];
    }
  );

  return <div style={containerStyle}>{displayNodes}</div>;
});
