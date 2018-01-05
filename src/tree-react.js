import React from "react";
import { findDOMNode } from "react-dom";
import { createTransformer } from "mobx";
import { observer } from "mobx-react";

import { Link } from "./core";

const containerStyle = {
  position: "absolute",
  textAlign: "center"
};

const unit = 40;
const spacer = 0.1 * unit;
const darkGray = "#888";

const nodeStyle = {
  transition: "0.1s",
  position: "absolute",
  height: unit - 3 * spacer,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  textOverflow: "clip"
};

const lineStyle = {
  position: "absolute",
  background: darkGray,
  width: 6 * spacer,
  height: 4 * spacer,
  zIndex: -1,
  borderLeft: "thin solid #333",
  borderRight: "thin solid #333"
};

const cursorStyle = {
  border: "3px solid yellow",
  background: "none"
};

const emptyObj = {};

class Input extends React.Component {
  componentDidMount() {
    findDOMNode(this).focus();
  }

  render() {
    return <input {...this.props} />;
  }
}

const getShades = hsl => {
  if (typeof hsl !== "object") {
    return { base: hsl, dark: hsl };
  }

  const { h, s, l } = hsl;
  return {
    base: `hsl(${h},${s}%,${l}%)`,
    dark: `hsl(${h},${s}%,${l - 11}%)`
  };
};

const ReactBox = observer(({ box }) => {
  if (!box) {
    return null;
  }

  const {
    x,
    y,
    width,
    size,
    fill,
    cellId,
    key,
    form,
    text,
    category,
    onChange,
    cursor
  } = box;

  const style = {
    ...nodeStyle,
    top: y * unit,
    left: x * unit,
    width: (width || size) * unit /*+ 0.5 * spacer*/,
    background: fill,
    color: fill ? "#eee" : "#333",
    ...(cursor ? cursorStyle : emptyObj)
  };
  if (fill) {
    style.borderRight = "1px solid hsla(0,0%,0%,0.3)";
    style.borderBottom = "1px solid hsla(0,0%,0%,0.3)";
  } else {
    style.fontWeight = "550";
  }

  const element = onChange ? (
    <Input
      key={cellId || key}
      value={text}
      style={style}
      onChange={e => onChange(e.target.value)}
    />
  ) : (
    <div key={cellId || key} style={style}>
      {text}
    </div>
  );

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

  return [connector, element];
});

export const ReactTree = observer(({ cells }) => {
  let throwawayIdCounter = 0;

  const displayNodes = cells.map(cell => (
    <ReactBox key={cell ? cell.key : throwawayIdCounter++} box={cell} />
  ));

  return <div style={containerStyle}>{displayNodes}</div>;
});
