/**
 * Otto overlay: Verify (dc.html:263-277). PaneHeader falls back to the plain
 * "Scout" title here too. When the record call returned a `webUrl` (every
 * mock path does), the summary card links out to it; `ottoVerifyDone` both
 * closes the overlay (VERIFY_DONE) and dismisses the Orders banner.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { PrimaryButton } from "../../components/primitives";
import { CheckIcon } from "../../icons";

export function OttoVerify() {
  const { data, otto, actions } = useApp();
  const fields = data.scan.extractedFields;
  const webUrl = data.recordResult && data.recordResult.webUrl;

  const cardBody = (
    <>
      <div className="otto-verify-card-head">
        <span className="otto-verify-card-title">Order #{fields.orderNumber}</span>
        <span className="otto-verify-updated">UPDATED</span>
      </div>
      <div className="otto-verify-divider" />
      <div className="otto-verify-rows">
        <div className="otto-verify-row">
          <span>Ship date</span>
          <span>{fields.shipDate}</span>
        </div>
        <div className="otto-verify-row">
          <span>Quantity</span>
          <span>120 units</span>
        </div>
        <div className="otto-verify-row">
          <span>Unit price</span>
          <span>{fields.unitPrice}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="otto-verify">
      <div className="otto-verify-check">
        <CheckIcon size={26} stroke="#141414" />
      </div>
      <div className="otto-verify-h1">Recorded — please verify</div>
      <div className="otto-verify-sub">
        Scout updated {otto.selectedErp}. Open it to confirm everything looks right.
      </div>
      {webUrl ? (
        <a className="otto-verify-card" href={webUrl} target="_blank" rel="noreferrer">
          {cardBody}
        </a>
      ) : (
        <div className="otto-verify-card">{cardBody}</div>
      )}
      <div className="otto-verify-spacer" />
      <PrimaryButton onClick={actions.ottoVerifyDone}>Verify & done</PrimaryButton>
    </div>
  );
}
