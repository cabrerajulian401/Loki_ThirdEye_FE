/**
 * Otto overlay: Found files (dc.html:210-230, "Matching files" header owned
 * by PaneHeader) — only reached when the Excel/Sheets target was picked.
 * Lists `data.scan.destinations`; tapping one (`ottoPickFile`) moves to the
 * file-confirm screen, or "Record to a new sheet instead" (`ottoNewSheet`)
 * records straight away with no existing-sheet match.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { DashedButton } from "../../components/primitives";
import { ExcelGreenGlyph, PlusIcon, CheckIcon, ClockIcon } from "../../icons";

export function OttoFiles() {
  const { data, actions } = useApp();
  const fields = data.scan.extractedFields;
  const destinations = data.scan.destinations || [];

  return (
    <div className="otto-files">
      <div className="otto-files-badge">
        <span className="otto-files-badge-icon">
          <ExcelGreenGlyph size={13} stroke="#fff" />
        </span>
        <span className="otto-files-badge-label">MICROSOFT EXCEL</span>
      </div>
      <div className="otto-files-h1">I found where this belongs</div>
      <div className="otto-files-sub">
        Scout searched your connected Excel files and found sheets already tracking{" "}
        <b>
          Order #{fields.orderNumber} · {fields.vendor}
        </b>
        .
      </div>
      <div className="otto-files-label">FILES FOUND</div>
      <div className="otto-files-list">
        {destinations.map((dest, index) => (
          <div
            key={dest.id}
            className={`otto-file-card${dest.isBestMatch ? " is-best" : ""}`}
            onClick={() => actions.ottoPickFile(index)}
          >
            <div className="otto-file-card-head">
              <span className={`otto-file-icon${dest.isBestMatch ? " is-best" : ""}`}>
                <ExcelGreenGlyph size={15} stroke={dest.isBestMatch ? "#fff" : "#107c41"} />
              </span>
              <div className="otto-file-card-main">
                <div className="otto-file-name">{dest.name}</div>
                <div className="otto-file-sub">{dest.subtitle}</div>
              </div>
              {dest.isBestMatch ? (
                <span className="otto-file-best-badge">BEST MATCH</span>
              ) : (
                <span className="otto-file-chevron">›</span>
              )}
            </div>
            <div className="otto-file-match">
              {dest.isBestMatch ? <CheckIcon size={12} stroke="#107c41" /> : <ClockIcon size={12} stroke="#777" />}
              {dest.matchNote}
            </div>
          </div>
        ))}
      </div>
      <div className="otto-files-spacer" />
      <DashedButton icon={<PlusIcon size={13} />} onClick={actions.ottoNewSheet}>
        Record to a new sheet instead
      </DashedButton>
    </div>
  );
}
