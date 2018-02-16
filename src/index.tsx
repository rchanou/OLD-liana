import * as React from "react";
import { render } from "react-dom";

// import { ReactView } from "./react-view";
import { ReactGUI } from "./react-gui";
import registerServiceWorker from "./registerServiceWorker";
import "./index.css";
import * as T from "./_test";

// render(<ReactView store={T.j.editor} />, document.getElementById("root") as HTMLElement);
render(<ReactGUI store={T.j} />, document.getElementById(
  "root"
) as HTMLElement);
registerServiceWorker();
