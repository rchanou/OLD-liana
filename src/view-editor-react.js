import React from "react";
import { observer } from "mobx-react";

import { TREE, LIST } from "./view-editor";
import { ReactTree } from "./view-tree-react";

const containerStyle = {};

export const ReactEditor = observer(({ editor }) => <ReactTree cells={editor.cells} />);
