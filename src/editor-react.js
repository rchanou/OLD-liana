import React from "react";
import { observer } from "mobx-react";

import { TREE, LIST } from "./editor";
import { ReactTree } from "./box-react";
import { ReactKeyboard } from "./keyboard-react";

const containerStyle = {
  height: 999 // TODO: test height, change to dynamic calculation
};

export const ReactEditor = observer(({ editor }) => (
  <div style={containerStyle}>
    <ReactTree cells={editor.cells} onInput={editor.handleInput} />
    <ReactKeyboard editor={editor} />
    {/* <ReactKeyboard keyBoxMap={editor.keyMap} selectedCoords={editor.selectedCoords} /> */}
  </div>
));
