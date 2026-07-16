/**
 * Otto overlay: Edit (dc.html:183-193, "Edit details" header owned by
 * PaneHeader). A single assistant-style bubble explains what Scout read,
 * then a labeled input lets the user correct the ship date — bound to
 * `data.scan.extractedFields.shipDate` via `actions.ottoEditField`.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { PrimaryButton } from "../../components/primitives";
import { CompassMark } from "../../icons";

export function OttoEdit() {
  const { data, actions } = useApp();
  const shipDate = data.scan.extractedFields.shipDate;

  return (
    <div className="otto-edit">
      <div className="otto-edit-bubble-row">
        <span className="otto-edit-avatar">
          <CompassMark size={13} />
        </span>
        <div className="otto-edit-bubble">
          I read the ship date as <b>Jul 2</b> from "we can ship… on Jul 2." Edit it below or tell me what to
          change.
        </div>
      </div>
      <label className="otto-edit-label" htmlFor="otto-edit-ship-date">
        SHIP DATE
      </label>
      <input
        id="otto-edit-ship-date"
        className="otto-edit-input"
        value={shipDate}
        onChange={(e) => actions.ottoEditField("shipDate", e.target.value)}
      />
      <div className="otto-edit-helper">Type a new date — it updates the field you'll record.</div>
      <div className="otto-edit-spacer" />
      <PrimaryButton onClick={actions.ottoSaveEdit}>Save & continue</PrimaryButton>
    </div>
  );
}
