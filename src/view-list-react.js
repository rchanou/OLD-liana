import React from "react";
import { observer } from "mobx-react";

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start"
};

const rowStyle = {
  display: "flex",
  marginBottom: 5
};

const boxStyle = {
  width: 100,
  height: 30,
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

export const List = observer(({ rows }) => (
  <div style={containerStyle}>
    {rows.map((boxes, i) => (
      <div style={rowStyle} key={boxes[0].key}>
        {boxes.map(box => (
          <div
            key={box.key}
            style={{
              ...boxStyle,
              background: box.color
            }}
          >
            {box.text}
          </div>
        ))}
      </div>
    ))}
  </div>
));

export default List;
