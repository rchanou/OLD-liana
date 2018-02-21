import React from "react";
import { findDOMNode } from "react-dom";
import { observer } from "mobx-react";

const containerStyle = {
  position: "absolute",
  textAlign: "center"
};
const unit = 25;
const spacer = 0.1 * unit;
const darkGray = "#888";
const boxStyle = {
  transition: "0.1s",
  position: "absolute",
  // height: unit - 3 * spacer,
  height: unit - spacer,
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
const rightBorder = "1px solid rgba(0,0,0,0.2)";
const boxBorder = "1px solid #eee";
const emptyObj = {};

const Input = observer(
  class Input extends React.Component {
    componentDidMount() {
      const me = findDOMNode(this);
      me.focus();
      me.select();
    }
    render() {
      const { style, ...rest } = this.props;
      return <input {...rest} style={{ ...style, background: "#eee" }} />;
    }
  }
);

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

class ScrollIn extends React.Component {
  componentDidMount() {
    this.me = findDOMNode(this);
    const { me } = this;
    this.handleMove = e => {
      if (e.propertyName !== "top") {
        return;
      }
      const step = units => {
        const increment = units / 9;
        let steps = 9;
        let lastScrollToY;
        const subStep = () =>
          requestAnimationFrame(() => {
            window.scrollTo(0, window.scrollY + increment);
            if (steps--) {
              subStep();
            }
          });
        subStep();
      };
      const currentY = me.offsetTop;
      const windowY = window.scrollY;
      if (currentY < windowY + 50) {
        step(Math.min(-50, currentY - windowY));
      } else {
        const upper = windowY + window.innerHeight - 200;
        if (currentY > upper) {
          step(Math.max(50, currentY - upper));
        }
      }
    };
    me.addEventListener("transitionend", this.handleMove);
  }
  componentWillUnmount() {
    this.me.removeEventListener("transitionend", this.handleMove);
  }
  render() {
    return <div {...this.props} />;
  }
}

const Cursor = observer(
  class Cursor extends React.Component {
    componentDidMount() {
      window.scrollTo(0, 0);
      findDOMNode(this).scrollIntoView();
    }
    render() {
      const { value, ...rest } = this.props;
      const Tag = value != null ? Input : ScrollIn;
      return <Tag {...rest} value={value} />;
    }
  }
);

const ReactBox = observer(({ box, onInput, store }) => {
  if (!box) {
    return null;
  }
  const { x, y, width, fill, color, key, text, category, input, cursor } = box;
  const style = {
    ...boxStyle,
    top: y * unit,
    left: x * unit,
    width: width * unit,
    background: fill,
    color: color || (fill ? "#eee" : "#333"),
    ...(cursor ? cursorStyle : emptyObj)
  };
  if (!cursor && fill) {
    style.borderRight = rightBorder;
  } else {
    style.fontWeight = "550";
    style.color = "#333";
  }
  let Tag;
  const props = { key, style };
  if (cursor) {
    Tag = Cursor;
    props.value = input;
    props.onChange = store.handleInput;
  } else {
    Tag = "div";
    props.children = text;
  }
  const element = <Tag {...props} />;
  if (true) {
    // TODO: set to false for refs to render connector below
    return element;
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
  const { activeCells, cells } = store;
  let throwawayIdCounter = 0;
  const cellBoxes = (activeCells || cells).map(cell => (
    <ReactBox key={cell ? cell.key : throwawayIdCounter++} box={cell} store={store} />
  ));
  return <div style={containerStyle}>{cellBoxes}</div>;
});
