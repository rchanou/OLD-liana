import React from "react";
import { observer } from "mobx-react";

import { LinkForm } from "./view-form";

export const ReactLinkForm = observer(({ form }) => (
  <div>
    <button type="button" onClick={form.addSubForm}>
      Add
    </button>

    {form.subForms.map(form => {
      return <div>comin right up</div>;
    })}
  </div>
));
