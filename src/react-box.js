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
  border: "3px solid green",
  background: "none"
};

const boxBorder = "1px solid rgba(0,0,0,0.3)";

const emptyObj = {};

class Input extends React.Component {
  componentDidMount() {
    const me = findDOMNode(this);
    me.focus();
    me.select();
  }

  render() {
    return <input {...this.props} />;
  }
}

// const getShades = hsl => {
//   if (typeof hsl !== "object") {
//     return { base: hsl, dark: hsl };
//   }

//   const { h, s, l } = hsl;
//   return {
//     base: `hsl(${h},${s}%,${l}%)`,
//     dark: `hsl(${h},${s}%,${l - 11}%)`
//   };
// };

class Cursor extends React.Component {
  componentDidMount() {
    this.me = findDOMNode(this);
  }
  componentDidUpdate() {
    this.me.scrollIntoView();
  }
  render() {
    return <div {...this.props} />;
  }
}

const ReactBox = observer(({ box, onInput, editor }) => {
  if (!box) {
    return null;
  }

  const { x, y, width, fill, key, text, category, input, cursor } = box;

  const style = {
    ...nodeStyle,
    top: y * unit,
    left: x * unit,
    width: width * unit,
    background: fill,
    color: fill ? "#eee" : "#333",
    ...(cursor ? cursorStyle : emptyObj)
  };
  if (!cursor && fill) {
    style.borderRight = boxBorder;
    style.borderBottom = boxBorder;
  } else {
    style.fontWeight = "550";
    style.color = "#333";
  }

  let element;
  if (input != null) {
    style.background = "#eee";
    element = <Input key={key} value={input} style={style} onChange={editor.handleInput} />;
  } else {
    element = (
      <div key={key} style={style}>
        {text}
      </div>
    );
  }

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

export const ReactTree = observer(({ editor }) => {
  const { cells, onInput } = editor;
  let throwawayIdCounter = 0;

  const cellBoxes = cells.map(cell => (
    <ReactBox key={cell ? cell.key : throwawayIdCounter++} box={cell} onInput={onInput} editor={editor} />
  ));

  return <div style={containerStyle}>{cellBoxes}</div>;
});
