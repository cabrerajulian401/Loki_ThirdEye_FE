/**
 * Audit alert toast (dc.html:475-482) — floats above the bottom nav whenever
 * `nav.toastVisible` (raised by the realtime DISCREPANCY_FOUND dispatch, on
 * whatever screen the user is on). The copy is the prototype's fixed demo
 * alert; "Review finding" deep-links to the audit detail via TOAST_REVIEW.
 */
import * as React from "react";
import { useApp } from "../app/AppContext";
import { MagnifierIcon } from "../icons";

export function AuditToast() {
  const { actions } = useApp();

  return (
    <div className="audit-toast">
      <div className="audit-toast-head">
        <span className="audit-toast-dot" />
        <span className="audit-toast-label">AUDIT ALERT · NOW</span>
        <MagnifierIcon size={14} stroke="#141414" />
      </div>
      <div className="audit-toast-title">Discrepancy found</div>
      <div className="audit-toast-body">
        PO #4471 · Acme Steel — quoted <b>$41.00</b>, latest bills <b>$42.50</b>/unit.
      </div>
      <div className="audit-toast-actions">
        <button type="button" className="audit-toast-dismiss" onClick={actions.toastDismiss}>
          Dismiss
        </button>
        <button type="button" className="audit-toast-review" onClick={actions.toastReview}>
          Review finding
        </button>
      </div>
    </div>
  );
}
