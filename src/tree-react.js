import React from "react";
import { findDOMNode } from "react-dom";
import { createTransformer } from "mobx";
import { observer } from "mobx-react";

import { Link } from "./core";

const containerStyle = {
  position: "absolute",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  textAlign: "center"
};

const unit = 40;
const spacer = 0.1 * unit;
const darkGray = "#888";

const nodeStyle = {
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

const selectableStyle = {
  color: "#fff",
  borderWidth: 0.5 * spacer,
  borderStyle: "solid",
  borderColor: "#333",
  borderRadius: 0.5 * spacer,
  boxShadow: "1px 1px 1px 1px hsla(0,0%,55%,0.5)"
};

const labelStyle = {
  fontWeight: "bold",
  background: "none"
};

const selectedStyle = { borderWidth: 3, borderColor: "yellow", zIndex: 1 };

const emptyObj = {};

const makeInputProps = createTransformer(box => ({
  onKeyDown(e) {
    // console.log("kd", e);
    if (e.keyCode == 13) {
      box.leaveInputMode();
    }
  },
  onChange(e) {
    // console.log("chg", e);
    box.setVal(e.target.value);
  }
}));

class Input extends React.Component {
  componentDidMount() {
    findDOMNode(this).focus();
  }

  render() {
    return <input {...this.props} />;
  }
}

const ReactBox = observer(({ box }) => {
  if (!box) {
    return null;
  }

  const {
    x,
    y,
    width,
    size,
    color,
    cellId,
    key,
    form,
    text,
    category,
    selected,
    selectable,
    inputMode
  } = box;

  const style = {
    ...nodeStyle,
    top: y * unit, //`calc(100vh - ${(y + 1) * unit}px)`,
    left: x * unit,
    width: (width || size) * unit + 0.5 * spacer,
    background: color,
    ...(selectable ? selectableStyle : labelStyle),
    ...(selected ? selectedStyle : emptyObj)
  };

  const element = inputMode ? (
    <Input
      key={cellId || key}
      value={text}
      style={style}
      {...makeInputProps(box)}
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

export const ReactTree = observer(({ boxes }) => {
  let throwawayIdCounter = 0;

  const displayNodes = boxes.map(box => (
    <ReactBox key={box ? box.key : throwawayIdCounter++} box={box} />
  ));

  return <div style={containerStyle}>{displayNodes}</div>;
});
