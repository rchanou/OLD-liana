import React from "react";
import { observer } from "mobx-react";

import { ReactView } from "./react-view";
import { ReactKeyboard } from "./react-keyboard";

const containerStyle = {
  height: 2222 // TODO: test height, change to dynamic calculation
};

export const ReactEditor = observer(({ store }) => (
  <div style={containerStyle}>
    <ReactView store={store} />
    <ReactKeyboard store={store} />
    {/* <ReactKeyboard keyBoxMap={editor.keyMap} selectedCoords={editor.selectedCoords} /> */}
  </div>
));
