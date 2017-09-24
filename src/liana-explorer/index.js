import React from "react";
import { observer } from "mobx-react";

const containerStyle = {
  position: "absolute",
  height: "100vh",
  width: "100vw"
};

const nodeStyle = {
  position: "absolute",
  border: "1px solid #111",
  borderRadius: 4,
  height: 50,
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const unit = 50;

export const Tree = observer(({ nodes }) => (
  <div style={containerStyle}>
    {nodes.map(node => (
      <div
        key={`${node.group}-${node.index}`}
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
