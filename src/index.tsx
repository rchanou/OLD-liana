import * as React from "react";
import { render } from "react-dom";

import { ReactView } from "./react-view";
import registerServiceWorker from "./registerServiceWorker";
import "./index.css";
import * as T from "./_test";

render(<ReactView store={T.j.editor} />, document.getElementById("root") as HTMLElement);
registerServiceWorker();
