/**
 * Otto tab: ERP selection for an old/dismissed email (dc.html:308-321,
 * "Where to record" header owned by PaneHeader). Shares layout with the
 * overlay's OttoErp (`.otto-erp-screen`) and the same `otto.selectedErp` /
 * `actions.ottoPickErp` slot — there's only one "which ERP" selection at a
 * time, regardless of which flow is choosing it.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { ErpPicker, PrimaryButton } from "../../components/primitives";

export function OttoOldErp() {
  const { nav, data, otto, actions } = useApp();
  // Guard the persisted-nav reload window before oldScans lazy-load lands
  // (same as OttoReinstruct).
  const email = data.oldScans[nav.ottoOldIndex];
  if (!email) return null;
  const orderNumber = email.reinstructFields.orderNumber;

  return (
    <div className="otto-erp-screen">
      <div className="otto-erp-h1">Which system should I update?</div>
      {/* No nested <b> here (unlike OttoErp's near-identical sentence): the
          record-flow test looks up this whole sentence in one findByText,
          which only matches an element's *direct* text-node children — an
          inline tag splitting "Order #4471" out would make it unfindable. */}
      <div className="otto-erp-sub">Scout will write Order #{orderNumber} from this older email here.</div>
      <div className="otto-erp-picker-wrap">
        <ErpPicker selected={otto.selectedErp} onPick={actions.ottoPickErp} />
      </div>
      <div className="otto-erp-spacer" />
      <PrimaryButton onClick={actions.ottoOldRecord}>Record to {otto.selectedErp}</PrimaryButton>
    </div>
  );
}
