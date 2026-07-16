/**
 * Audit: detail (dc.html:451-471, finding-title header owned by PaneHeader's
 * audit-detail map). Everything renders off the finding matching
 * `nav.findKey` in `data.findings` — compare card, evidence quotes
 * (2nd emphasized), and the compose CTA whose label IS the contact email.
 * A realtime-upserted partial (no `detail` yet) renders nothing until the
 * audit-tab lazy load lands the full finding.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { AvatarRow, Compare, MonoLabel } from "../../components/primitives";
import { EnvelopeOpenIcon, ExternalLinkIcon } from "../../icons";

export function AuditDetail() {
  const { nav, data, actions } = useApp();
  const finding = (data.findings || []).find((f) => f.type === nav.findKey);
  if (!finding || !finding.detail) return null;

  return (
    <div className="au-detail">
      <div className="contact-card">
        <AvatarRow
          initials={finding.initials}
          name={
            <>
              {finding.poNumber} <span className="contact-card-dim">· {finding.company}</span>
            </>
          }
          sub={
            <>
              {finding.contactName} · {finding.contactEmail}
            </>
          }
        />
        <span className="au-inthread">IN THREAD</span>
      </div>
      <div className="au-detail-body">
        <Compare
          leftLabel={finding.detail.leftLabel}
          left={finding.detail.left}
          rightLabel={finding.detail.rightLabel}
          right={finding.detail.right}
          impact={finding.detail.impact}
        />
        <div className="au-evidence-label">
          <MonoLabel>Evidence from thread</MonoLabel>
        </div>
        <div className="au-quotes">
          {finding.quotes.map((q, index) => (
            <div className={`au-quote${q.emphasized ? " is-emphasized" : ""}`} key={index}>
              <div className="au-quote-head">
                <span className="au-quote-author">{q.author}</span>
                <span>{q.date}</span>
              </div>
              <div className="au-quote-text">"{q.text}"</div>
            </div>
          ))}
        </div>
        <div className="au-detail-spacer" />
        <div className="au-reply-label">
          <MonoLabel>Draft a reply</MonoLabel>
        </div>
        <div className="au-reply-helper">
          Scout has a reply ready. Click the address to open it in Outlook — review &amp; send from there.
        </div>
        <button type="button" className="au-compose-btn" onClick={() => actions.auOpenReply(finding)}>
          <EnvelopeOpenIcon size={16} stroke="#fff" />
          <span className="au-compose-email">{finding.contactEmail}</span>
          <ExternalLinkIcon size={14} stroke="#fff" />
        </button>
        <button type="button" className="au-dismiss-btn" onClick={() => actions.auDismiss(finding)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
