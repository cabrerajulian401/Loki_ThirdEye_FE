/**
 * Otto tab: old/dismissed email list (dc.html:279-290, "Otto-Mode" header
 * owned by PaneHeader's SCOUT_HEADER fallback). One card per
 * `data.oldScans` entry — tapping "Record" opens the reinstruct screen for
 * that email (`ottoOldOpen(index)`).
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";

export function OttoOldList() {
  const { data, actions } = useApp();
  const emails = data.oldScans || [];

  return (
    <div className="otto-old-list">
      <div className="otto-old-list-header">
        <div className="otto-old-list-h1">Otto-Mode</div>
        <div className="otto-old-list-sub">
          Older & dismissed emails Scout can still record — no need to dig them up yourself.
        </div>
      </div>
      <div className="otto-old-cards">
        {emails.map((email, index) => (
          <div className="otto-old-card" key={email.id}>
            <div className="otto-old-card-top">
              <span className="otto-old-subject">{email.subject}</span>
              <span className={`otto-old-badge${email.badge === "DISMISSED" ? " is-dismissed" : " is-older"}`}>
                {email.badge}
              </span>
            </div>
            <div className="otto-old-summary">{email.summary}</div>
            <div className="otto-old-contact-row">
              <span className="otto-old-avatar">{email.initials}</span>
              <div className="otto-old-contact-main">
                <div className="otto-old-contact-name">{email.sender}</div>
                <div className="otto-old-contact-email">{email.senderEmail}</div>
              </div>
              <button type="button" className="otto-old-record-btn" onClick={() => actions.ottoOldOpen(index)}>
                Record
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
