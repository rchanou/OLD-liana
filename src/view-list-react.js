import React from "react";
import { observer } from "mobx-react";

const containerStyle = {};

export const List = observer(({ rows }) => (
  <div style={containerStyle}>{rows.map((row, i) => <div>dis be list </div>)}</div>
));

export default List;
