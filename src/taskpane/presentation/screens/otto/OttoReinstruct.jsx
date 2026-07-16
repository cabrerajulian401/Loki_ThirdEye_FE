/**
 * Otto tab: Reinstruct (dc.html:292-306, "Re-run on this email" header owned
 * by PaneHeader). Re-reads the selected `data.oldScans[nav.ottoOldIndex]`
 * email and shows the fields Scout would record — field keys vary per email
 * (the dismissed one carries shipDate/unitPrice, the older two carry just a
 * vendor), so the field list renders whatever `reinstructFields` has.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { FieldCard, PrimaryButton } from "../../components/primitives";

const FIELD_LABELS = {
  orderNumber: "ORDER #",
  vendor: "VENDOR",
  shipDate: "SHIP DATE",
  unitPrice: "UNIT PRICE",
};

export function OttoReinstruct() {
  const { nav, data, actions } = useApp();
  const email = data.oldScans[nav.ottoOldIndex];

  return (
    <div className="otto-reinstruct">
      <div className="otto-reinstruct-pill">{email.reinstructLabel}</div>
      <div className="otto-reinstruct-from">
        <span className="otto-reinstruct-avatar">{email.initials}</span>
        <div className="otto-reinstruct-from-main">
          <div className="otto-reinstruct-from-name">
            {email.sender} <span className="otto-reinstruct-from-company">· {email.company}</span>
          </div>
          <div className="otto-reinstruct-from-email">{email.senderEmail}</div>
        </div>
        <span className="otto-reinstruct-from-label">FROM</span>
      </div>
      <div className="otto-reinstruct-helper">
        Scout re-read the email. Confirm what to record, or tell Otto what to change.
      </div>
      <div className="otto-reinstruct-fields">
        {Object.keys(email.reinstructFields).map((key) => (
          <FieldCard key={key} label={FIELD_LABELS[key] || key.toUpperCase()} value={email.reinstructFields[key]} />
        ))}
      </div>
      <div className="otto-reinstruct-spacer" />
      <PrimaryButton onClick={actions.ottoOldConfirm}>Confirm & record</PrimaryButton>
    </div>
  );
}
