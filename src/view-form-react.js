import React from "react";
import { observer } from "mobx-react";

import { LinkForm } from "./view-form";

const formStyle = { position: "relative" };

export const ReactLinkForm = observer(({ form }) => (
  <div style={formStyle}>
    <button type="button" onClick={form.addSubForm}>
      Add
    </button>

    {form.subForms.map(sF => {
      return <div key={sF.id}>comin right up</div>;
    })}
  </div>
));
