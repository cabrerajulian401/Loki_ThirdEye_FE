/**
 * Check-ups: activity (dc.html:87-97, "{po} · activity" header owned by
 * PaneHeader's `currentOrderPo`). Activity is static seed data attached to
 * the current flow (`flow.activity`, seeded only for Acme/PO #4471 per
 * task 15's brief) — a simple sent/sent/replied timeline ending in
 * "Send to Otto-Mode", which jumps to the otto tab.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { AvatarRow, PrimaryButton } from "../../components/primitives";
import { EnvelopeOpenIcon, SendIcon } from "../../icons";

export function CheckupActivity() {
  const { nav, data, actions } = useApp();
  const flow = data.flows[nav.cuVendor];
  if (!flow) return null;
  const activity = flow.activity || [];

  return (
    <div className="cu-activity">
      <div className="contact-card">
        <AvatarRow initials={flow.initials} name={flow.contactName} sub={flow.emailAddress} />
        <span className="contact-card-pill">REPLIED</span>
      </div>
      <div className="cu-timeline">
        {activity.map((item, index) => {
          const isReply = index === activity.length - 1;
          return (
            <div className="cu-timeline-item" key={index}>
              <div className="cu-timeline-rail">
                <span className={`cu-timeline-dot${isReply ? " is-outline" : ""}`}>
                  {isReply ? (
                    <EnvelopeOpenIcon size={10} stroke="#141414" />
                  ) : (
                    <SendIcon size={10} stroke="#fff" />
                  )}
                </span>
                {!isReply && <span className="cu-timeline-line" />}
              </div>
              <div className="cu-timeline-content">
                <div className="cu-timeline-title">
                  {isReply ? `${flow.contactName} replied` : item.label}
                </div>
                {isReply ? (
                  <div className="cu-timeline-bubble">{item.detail}</div>
                ) : (
                  <div className="cu-timeline-detail">{item.detail}</div>
                )}
                <div className="cu-timeline-timestamp">{item.timestamp}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="cu-activity-footer">
        <PrimaryButton onClick={actions.cuActivityToOtto}>Send to Otto-Mode</PrimaryButton>
      </div>
    </div>
  );
}
