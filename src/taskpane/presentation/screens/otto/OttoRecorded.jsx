/**
 * Otto tab: Recorded (dc.html:323-337). PaneHeader falls back to the plain
 * "Scout" title here (same as the overlay's verify screen). Shares the
 * `.otto-recorded-*` card layout with the overlay's OttoVerify.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { PrimaryButton } from "../../components/primitives";
import { CheckIcon } from "../../icons";

export function OttoRecorded() {
  const { nav, data, otto, actions } = useApp();
  const email = data.oldScans[nav.ottoOldIndex];
  const { orderNumber, shipDate } = email.reinstructFields;

  return (
    <div className="otto-recorded">
      <div className="otto-recorded-check">
        <CheckIcon size={26} stroke="#141414" />
      </div>
      <div className="otto-recorded-h1">Added from older email</div>
      <div className="otto-recorded-sub">
        Scout recorded this dismissed email to {otto.selectedErp}. Verify it looks right.
      </div>
      <div className="otto-recorded-card">
        <div className="otto-recorded-card-head">
          <span className="otto-recorded-card-title">Order #{orderNumber}</span>
          <span className="otto-recorded-updated">UPDATED</span>
        </div>
        <div className="otto-recorded-divider" />
        <div className="otto-recorded-rows">
          <div className="otto-recorded-row">
            <span>Source</span>
            <span>{email.sourceLabel}</span>
          </div>
          {shipDate && (
            <div className="otto-recorded-row">
              <span>Ship date</span>
              <span>{shipDate}</span>
            </div>
          )}
        </div>
      </div>
      <div className="otto-recorded-spacer" />
      <PrimaryButton onClick={actions.ottoOldDone}>Verify & done</PrimaryButton>
    </div>
  );
}
