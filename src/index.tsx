import * as React from "react";
import { render } from "react-dom";

import { ReactGUI } from "./react-gui";
import registerServiceWorker from "./registerServiceWorker";
import "./index.css";

registerServiceWorker();

if (process && process.env && process.env.NODE_ENV === "development") {
  (async () => {
    const T = await import("./_test");
    render(<ReactGUI store={T.j} />, document.getElementById(
      "root"
    ) as HTMLElement);
  })();
}
