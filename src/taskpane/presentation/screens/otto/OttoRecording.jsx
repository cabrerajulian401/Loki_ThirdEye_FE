/**
 * Otto overlay: Recording (dc.html:249-261). PaneHeader falls back to the
 * plain "Scout" title for this step, so the whole "what's happening" story
 * lives here: a spinner, then a 3-row checklist where the first two steps
 * are already done and the third spins for however long the record call
 * (mock: 1700ms) takes.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { Spinner } from "../../components/primitives";
import { CheckIcon } from "../../icons";

export function OttoRecording() {
  const { otto } = useApp();

  return (
    <div className="otto-recording">
      <Spinner />
      <div className="otto-recording-h1">Recording to {otto.selectedErp}…</div>
      <div className="otto-recording-sub">
        Scout is reading the email and writing the order data. This takes a moment.
      </div>
      <div className="otto-checklist">
        <div className="otto-checklist-row is-done">
          <span className="otto-checklist-dot is-done">
            <CheckIcon size={11} stroke="#fff" />
          </span>
          Read the email
        </div>
        <div className="otto-checklist-row is-done">
          <span className="otto-checklist-dot is-done">
            <CheckIcon size={11} stroke="#fff" />
          </span>
          Extracted order data
        </div>
        <div className="otto-checklist-row is-active">
          <span className="otto-checklist-dot is-spinning" />
          Writing to {otto.selectedErp}…
        </div>
      </div>
    </div>
  );
}
