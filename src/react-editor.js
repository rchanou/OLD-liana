import React from "react";
import { observer } from "mobx-react";

import { ReactTree } from "./react-box";
import { ReactKeyboard } from "./react-keyboard";

const containerStyle = {
  height: 999 // TODO: test height, change to dynamic calculation
};

export const ReactEditor = observer(({ editor }) => (
  <div style={containerStyle}>
    <ReactTree editor={editor} />
    <ReactKeyboard editor={editor} />
    {/* <ReactKeyboard keyBoxMap={editor.keyMap} selectedCoords={editor.selectedCoords} /> */}
  </div>
));
