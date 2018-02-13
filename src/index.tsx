import * as React from "react";
import { render } from "react-dom";
import registerServiceWorker from "./registerServiceWorker";
import "./index.css";
import "./_test";

render(<div>shazbot</div>, document.getElementById("root") as HTMLElement);
registerServiceWorker();
