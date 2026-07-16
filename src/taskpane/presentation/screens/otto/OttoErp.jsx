/**
 * Otto overlay: ERP selection (dc.html:195-208, "Where to record" header
 * owned by PaneHeader). Picking a target doesn't record yet — only
 * `actions.ottoRecord()` (the button below) dispatches RECORD, which the
 * otto machine routes to "files" for Excel or straight to "recording"
 * otherwise.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { ErpPicker, PrimaryButton } from "../../components/primitives";

export function OttoErp() {
  const { data, otto, actions } = useApp();
  const fields = data.scan.extractedFields;

  return (
    <div className="otto-erp-screen">
      <div className="otto-erp-h1">Which system should I update?</div>
      <div className="otto-erp-sub">
        Scout will write <b>Order #{fields.orderNumber}</b> and its 5 fields here.
      </div>
      <div className="otto-erp-picker-wrap">
        <ErpPicker selected={otto.selectedErp} onPick={actions.ottoPickErp} />
      </div>
      {otto.error && (
        <div className="otto-record-error">
          COULDN'T RECORD — {String(otto.error.message || "TRY AGAIN").toUpperCase()}
        </div>
      )}
      <div className="otto-erp-spacer" />
      <PrimaryButton onClick={actions.ottoRecord}>Record to {otto.selectedErp}</PrimaryButton>
    </div>
  );
}
