/**
 * Otto overlay: File confirm (dc.html:232-247, "Continue editing" header
 * owned by PaneHeader) — reached by picking an existing destination on the
 * Files screen. Shows the exact row-level diff (old values struck through)
 * before `actions.ottoConfirmFile()` records to that destination.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { OutlineButton, PrimaryButton } from "../../components/primitives";
import { ExcelGreenGlyph, CheckIcon } from "../../icons";

// Destinations only carry a combined subtitle (`Sheet "Open Orders" · edited
// 2 days ago`) — pull just the quoted sheet name out of it for the file
// header, which the prototype renders on its own line.
function sheetNameFromSubtitle(subtitle) {
  const match = /Sheet [“"]([^”"]+)[”"]/.exec(subtitle || "");
  return match ? match[1] : subtitle;
}

export function OttoFileConfirm() {
  const { data, otto, actions } = useApp();
  // `selectedFileIndex` can point past the destinations list (2 = "new
  // sheet") when a failed new-sheet record routes back here — render the
  // file header only when a real destination backs it.
  const destination = data.scan.destinations[otto.selectedFileIndex];
  const fields = data.scan.extractedFields;
  const sheetName = sheetNameFromSubtitle(destination && destination.subtitle);

  return (
    <div className="otto-fileconfirm">
      {destination && (
        <div className="otto-fileconfirm-file">
          <span className="otto-fileconfirm-file-icon">
            <ExcelGreenGlyph size={16} stroke="#fff" />
          </span>
          <div className="otto-fileconfirm-file-main">
            <div className="otto-fileconfirm-file-name">{destination.name}</div>
            <div className="otto-fileconfirm-file-sheet">Sheet “{sheetName}”</div>
          </div>
        </div>
      )}
      <div className="otto-fileconfirm-h1">Continue editing this sheet</div>
      <div className="otto-fileconfirm-sub">
        Scout will keep your sheet’s exact structure — updating the existing <b>PO #{fields.orderNumber}</b> row
        in place. No new columns, no new tabs.
      </div>
      <div className="otto-fileconfirm-label">WHAT CHANGES · ROW 14</div>
      <div className="otto-changes-table">
        <div className="otto-changes-head">
          <span className="otto-changes-col-po">PO #</span>
          <span className="otto-changes-col-qty">QTY</span>
          <span className="otto-changes-col-ship">SHIP DATE</span>
          <span className="otto-changes-col-status">STATUS</span>
        </div>
        <div className="otto-changes-row">
          <span className="otto-changes-col-po otto-changes-po">{fields.orderNumber}</span>
          <span className="otto-changes-col-qty">
            <span className="otto-changes-old">150</span> <b>120</b>
          </span>
          <span className="otto-changes-col-ship">
            <span className="otto-changes-old">{fields.shipDateWas}</span> <b>{fields.shipDate}</b>
          </span>
          <span className="otto-changes-col-status">
            <span className="otto-changes-upd">UPD</span>
          </span>
        </div>
      </div>
      <div className="otto-fileconfirm-note">
        <CheckIcon size={13} stroke="#107c41" />
        Same columns, formatting & formulas preserved
      </div>
      {otto.error && (
        <div className="otto-record-error">
          COULDN'T RECORD — {String(otto.error.message || "TRY AGAIN").toUpperCase()}
        </div>
      )}
      <div className="otto-fileconfirm-spacer" />
      <div className="otto-fileconfirm-actions">
        <OutlineButton onClick={actions.back}>Back</OutlineButton>
        <PrimaryButton onClick={actions.ottoConfirmFile}>Continue & update sheet</PrimaryButton>
      </div>
    </div>
  );
}
