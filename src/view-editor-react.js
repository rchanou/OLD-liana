import React from "react";
import { observer } from "mobx-react";

import { TREE, LIST } from "./view-editor";
import { ReactList } from "./view-list-react";
import { ReactTree } from "./view-tree-react";

const containerStyle = {};

export const ReactEditor = observer(({ editor }) => {
  const { currentView } = editor;

  let mainEl;
  switch (currentView) {
    case LIST:
      mainEl = <ReactList rows={editor.list.rows} />;
      break;
    case TREE:
      mainEl = <ReactTree boxes={editor.tree.boxes} />;
  }

  return (
    <div>
      {mainEl}
      {editor.form.nodes && <form>form opn barhs</form>}
    </div>
  );
});
