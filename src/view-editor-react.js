import React from "react";
import { observer } from "mobx-react";

import { TREE, LIST } from "./view-editor";
import List from "./view-list-react";
import Tree from "./view-tree-react";

const containerStyle = {};

export const Editor = observer(({ editor }) => {
  const { currentView } = editor;

  let mainEl;
  switch (currentView) {
    case LIST:
      mainEl = <List rows={editor.list.rows} />;
      break;
    case TREE:
      mainEl = <Tree boxes={editor.tree.boxes} />;
  }

  return (
    <div>
      {mainEl}
      {editor.form && <form>form opn barhs</form>}
    </div>
  );
});

export default Editor;
