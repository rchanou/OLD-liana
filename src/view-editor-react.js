import React from "react";
import { observer } from "mobx-react";

import { TREE, LIST } from "./view-editor";
import List from "./view-list-react";
import Tree from "./view-tree-react";

const containerStyle = {};

export const Editor = observer(({ editor }) => {
  const { view } = editor;
  switch (view) {
    case LIST:
      return <List />;
      break;
    case TREE:
      return <Tree />;
  }
});
