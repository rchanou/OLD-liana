import React from "react";
import { observer } from "mobx-react";

const containerStyle = {
  position: "absolute",
  height: "100vh",
  width: "100vw"
};

const nodeStyle = {
  position: "absolute",
  border: "2px solid black",
  borderRadius: 2,
  height: 50,
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const unit = 50;

export const Tree = observer(({ store }) => (
  <div style={containerStyle}>
    {store.display.map(node => (
      <div
        key={node.key}
        style={{
          ...nodeStyle,
          top: node.y * unit,
          left: node.x * unit,
          width: node.width * unit,
          background: node.color
        }}
      >
        {node.text}
      </div>
    ))}
  </div>
));
