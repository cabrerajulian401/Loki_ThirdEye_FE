/**
 * Otto overlay: Review (dc.html:167-181, "Found in this email" header owned
 * by PaneHeader). Shows the 5 fields Scout extracted from the open email;
 * tapping the ship-date row or "Ask Scout" opens the edit screen, "Confirm"
 * goes straight to ERP selection.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { FieldCard, PrimaryButton, OutlineButton } from "../../components/primitives";
import { ChatIcon, PencilIcon } from "../../icons";

export function OttoReview() {
  const { data, actions } = useApp();
  const fields = data.scan.extractedFields;

  return (
    <div className="otto-review">
      <div className="otto-review-helper">Check what Scout pulled out. Tap any field to edit.</div>
      <div className="otto-review-fields">
        <FieldCard label="ORDER #" value={fields.orderNumber} />
        <FieldCard label="VENDOR" value={fields.vendor} />
        <FieldCard label="ITEM" value={fields.item} />
        <FieldCard
          label="SHIP DATE"
          value={
            <>
              {fields.shipDate} <span className="otto-was-pill">was {fields.shipDateWas}</span>
            </>
          }
          trailing={<PencilIcon size={15} stroke="#bbb" />}
          onClick={actions.ottoAsk}
        />
        <FieldCard label="UNIT PRICE" value={fields.unitPrice} />
      </div>
      <div className="otto-review-spacer" />
      <div className="otto-review-actions">
        <OutlineButton icon={<ChatIcon size={14} />} onClick={actions.ottoAsk}>
          Ask Scout
        </OutlineButton>
        <PrimaryButton onClick={actions.ottoConfirm}>Confirm</PrimaryButton>
      </div>
    </div>
  );
}
