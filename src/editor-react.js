import React from "react";
import { observer } from "mobx-react";

import { TREE, LIST } from "./editor";
import { ReactTree } from "./tree-react";
import { ReactKeyboard } from "./keyboard-react";

const containerStyle = {
  height: 999 // TODO: test height, change to dynamic calculation
};

export const ReactEditor = observer(({ editor }) => (
  <div style={containerStyle}>
    <ReactTree
      cells={editor.cells}
      keys={editor.keyBoxes}
      onInput={editor.handleInput}
    />
    <ReactKeyboard keyBoxMap={editor.keyBoxes} />
  </div>
));
