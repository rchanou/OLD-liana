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

const boxStyle = {
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

// const boxBorder = "1px solid rgba(0,0,0,0.3)";
const boxBorder = "1px solid #eee";

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
    window.scrollTo(0, 0);
    this.me.scrollIntoView();
  }

  componentDidUpdate() {
    const { me } = this;

    // TODO: much room for improvement here
    const scroll = () => {
      me.removeEventListener("transitionend", scroll);

      let lastY;
      const step = () =>
        requestAnimationFrame(() => {
          const { y } = me.getBoundingClientRect();

          if (y === lastY) {
            return;
          }

          lastY = y;

          if (y < 50) {
            window.scrollTo(0, window.scrollY - 9);
            step();
          } else if (y > window.innerHeight - 200) {
            window.scrollTo(0, window.scrollY + 9);
            step();
          }
        });
      step();
    };

    me.addEventListener("transitionend", scroll);
  }

  render() {
    return <div {...this.props} />;
  }
}

const ReactBox = observer(({ box, onInput, store }) => {
  if (!box) {
    return null;
  }

  const { x, y, width, fill, key, text, category, input, cursor } = box;

  const style = {
    ...boxStyle,
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
    element = <Input key={key} value={input} style={style} onChange={store.handleInput} />;
  } else {
    const Tag = cursor ? Cursor : "div";
    element = (
      <Tag key={key} style={style}>
        {text}
      </Tag>
    );
  }

  const connector =
    category === Link ? (
      <div
        key={`${key}L`}
        style={{
          ...lineStyle,
          // left: unit * (x + 0.5) - 3 * spacer,
          left: (x + 0.2) * unit,
          top: (y + 0.7) * unit
          // top: `calc(100vh - ${(y + 1) * unit + 3 * spacer}px)`
        }}
      />
    ) : null;

  return [connector, element];
});

// TODO: better name
export const ReactView = observer(({ store }) => {
  const { activeCells, onInput } = store;
  let throwawayIdCounter = 0;

  const cellBoxes = activeCells.map(cell => (
    <ReactBox key={cell ? cell.key : throwawayIdCounter++} box={cell} onInput={onInput} store={store} />
  ));

  return <div style={containerStyle}>{cellBoxes}</div>;
});
