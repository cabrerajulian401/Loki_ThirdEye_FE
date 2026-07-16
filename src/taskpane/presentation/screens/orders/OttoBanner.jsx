/**
 * Otto banner (dc.html:149-155) — shown at the top of the Orders screen
 * whenever Scout's open-email scan pre-check succeeded and the banner
 * hasn't been dismissed this session (OrdersScreen owns that visibility
 * check via `data.openScanAvailable && !nav.ottoBannerDismissed`). Copy is
 * verbatim from the task brief. "Review & insert" opens the Otto review
 * overlay (Task 13 fills in its body; the header title + hidden bottom nav
 * already work via the nav/otto machines wired in Task 11).
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { BoltIcon } from "../../icons";

export function OttoBanner() {
  const { actions } = useApp();

  return (
    <div className="otto-banner">
      <div className="otto-banner-head">
        <div className="otto-banner-icon">
          <BoltIcon size={16} stroke="#fff" />
        </div>
        <div>
          <div className="otto-banner-title">New order info detected</div>
          <div className="otto-banner-sub">5 fields ready to record</div>
        </div>
      </div>
      <div className="otto-banner-body">Scout found order details in the open email from Maria Chen.</div>
      <div className="otto-banner-actions">
        <button type="button" className="otto-banner-dismiss" onClick={actions.dismissBanner}>
          Dismiss
        </button>
        <button type="button" className="otto-banner-review" onClick={actions.ottoReview}>
          Review & insert
        </button>
      </div>
    </div>
  );
}
