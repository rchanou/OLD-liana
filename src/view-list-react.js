import React from "react";
import { observer } from "mobx-react";

const containerStyle = { display: "flex", flexDirection: "column" };

const rowStyle = { display: "flex", justifyContent: "flex-start" };

const boxStyle = {
  width: 100,
  height: 30
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
