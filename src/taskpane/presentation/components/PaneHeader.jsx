/**
 * Pane header: title/back/logo per the title map (prototype renderVals,
 * dc.html:588-612). The back glyph is a plain text `‹` (prototype dc.html:88
 * renders it as a span, not an svg) and routes BACK to whichever machine
 * currently owns the screen — the otto overlay machine while it's active,
 * otherwise the nav machine.
 */
import * as React from "react";
import { useApp } from "../app/AppContext";
import { isOverlayActive } from "../../application/machines/ottoFlowMachine";
import { CompassMark } from "../icons";

const OTTO_OVERLAY_TITLES = {
  review: "Found in this email",
  edit: "Edit details",
  erp: "Where to record",
  files: "Matching files",
  fileConfirm: "Continue editing",
};

const SCOUT_HEADER = { title: "Scout", showBack: false, showLogo: true };

function currentOrderPo(nav, data) {
  const flow = (data.flows || [])[nav.cuVendor];
  return (flow && flow.poNumber) || "Order";
}

function computeHeader(nav, otto, data) {
  if (nav.phase === "onboarding") {
    if (nav.onb === "connect") return { title: "Connect your ERP", showBack: true, showLogo: false };
    return SCOUT_HEADER;
  }

  if (isOverlayActive(otto)) {
    if (otto.step === "recording" || otto.step === "verify") return SCOUT_HEADER;
    return { title: OTTO_OVERLAY_TITLES[otto.step] || "Scout", showBack: true, showLogo: false };
  }

  if (nav.tab === "otto") {
    if (nav.ottoOld === "reinstruct") return { title: "Re-run on this email", showBack: true, showLogo: false };
    if (nav.ottoOld === "erp") return { title: "Where to record", showBack: true, showLogo: false };
    return SCOUT_HEADER;
  }

  if (nav.tab === "checkups") {
    if (nav.cuView === "schedule") return { title: currentOrderPo(nav, data), showBack: true, showLogo: false };
    if (nav.cuView === "editStep") return { title: "Edit step", showBack: true, showLogo: false };
    if (nav.cuView === "add") return { title: "New check-up", showBack: true, showLogo: false };
    if (nav.cuView === "activity")
      return { title: `${currentOrderPo(nav, data)} · activity`, showBack: true, showLogo: false };
    return SCOUT_HEADER;
  }

  if (nav.tab === "audit") {
    if (nav.auditView === "detail") {
      const finding = (data.findings || []).find((f) => f.type === nav.findKey);
      return { title: (finding && finding.title) || "Scout", showBack: true, showLogo: false };
    }
    return SCOUT_HEADER;
  }

  return SCOUT_HEADER;
}

export function PaneHeader() {
  const { nav, otto, data, actions } = useApp();
  const { title, showBack, showLogo } = computeHeader(nav, otto, data);

  return (
    <div className="pane-header">
      {showBack && (
        <button type="button" className="pane-header-back" aria-label="Back" onClick={actions.back}>
          ‹
        </button>
      )}
      {showLogo && <CompassMark size={22} />}
      <span className="pane-header-title">{title}</span>
      <span className="pane-header-close">×</span>
    </div>
  );
}
