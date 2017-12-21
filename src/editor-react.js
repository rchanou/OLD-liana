import React from "react";
import { observer } from "mobx-react";

import { TREE, LIST } from "./editor";
import { ReactTree } from "./tree-react";

const containerStyle = {};

export const ReactEditor = observer(({ editor }) => (
  <ReactTree cells={editor.cells} />
));
