import React from "react";
import { observer } from "mobx-react";

import { TREE, LIST } from "./view-editor";
import { ReactList } from "./view-list-react";
import { ReactTree } from "./view-tree-react";
import { ReactLinkForm } from "./view-form-react";

const containerStyle = {};

export const ReactEditor = observer(({ editor }) => {
  const { currentView } = editor;

  let mainEl;
  switch (currentView) {
    case LIST:
      mainEl = <ReactList rows={editor.list.rows} />;
      break;
    case TREE:
      mainEl = <ReactTree boxes={editor.boxes} />;
  }

  return (
    <div>
      {mainEl}
      {editor.form && <ReactLinkForm form={editor.form} />}
    </div>
  );
});
