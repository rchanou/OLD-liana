import React from "react";
import { observer } from "mobx-react";

import { TREE, LIST } from "./view-editor";
import List from "./view-list-react";
import Tree from "./view-tree-react";

const containerStyle = {};

export const Editor = observer(({ editor }) => {
  const { currentView } = editor;
  switch (currentView) {
    case LIST:
      return <List rows={editor.list.rows} />;
      break;
    case TREE:
      return <Tree boxes={editor.tree.boxes} />;
  }
});

export default Editor;
