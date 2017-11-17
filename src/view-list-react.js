import React from "react";
import { observer } from "mobx-react";

const containerStyle = {};
const boxStyle = {};

export const List = observer(({ rows }) => (
  <div style={containerStyle}>
    {rows.map((boxes, i) =>
      boxes.map(box => (
        <div
          style={{
            background: box.color
          }}
        >
          {box.text}{" "}
        </div>
      ))
    )}
  </div>
));

export default List;
