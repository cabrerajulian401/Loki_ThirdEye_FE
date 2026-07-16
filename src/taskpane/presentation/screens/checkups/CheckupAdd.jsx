/**
 * Check-ups: add (dc.html:65-84, "New check-up" header owned by PaneHeader).
 * The prototype's `openAdd()` prefills a single fixed vendor/contact (Orbit
 * Packaging / Tom Silva) with no picker interaction, so those identity
 * fields are literal defaults here too — only the message + timing draft is
 * actually editable before `actions.cuCreate` sends it to the check-up repo.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { MonoLabel, PrimaryButton, TimingSelects, TokenChips } from "../../components/primitives";

// dc.html "CHECK-UPS: ADD" openAdd() prefill (line 719) + poByVendor — see
// infrastructure/mock/seed.js's `newCheckupPrefill` for the same literal
// values (the mock createFlow() derives the PO number from companyName).
const DEFAULT_DRAFT = {
  companyName: "Orbit Packaging",
  contactName: "Tom Silva",
  emailAddress: "tom@orbitpack.com",
  initials: "TS",
  message: "Hi Tom — checking in on the status of our latest order. Any update?",
  send: "day0",
  cond: "noreply",
  repeat: "none",
  stop: "3",
};

export function CheckupAdd() {
  const { actions } = useApp();
  const [draft, setDraft] = React.useState(DEFAULT_DRAFT);
  const timing = { send: draft.send, cond: draft.cond, repeat: draft.repeat, stop: draft.stop };

  return (
    <div className="cu-add">
      <MonoLabel>Vendor</MonoLabel>
      <div className="cu-add-vendor">
        <span className="cu-add-vendor-name">{draft.companyName}</span>
        <span className="cu-add-chevron">▾</span>
      </div>
      <div className="cu-add-label">
        <MonoLabel>Who you're emailing</MonoLabel>
      </div>
      <div className="cu-add-contact">
        <span className="cu-add-contact-initials">{draft.initials}</span>
        <div className="cu-add-contact-main">
          <div className="cu-add-contact-name">{draft.contactName}</div>
          <div className="cu-add-contact-email">{draft.emailAddress}</div>
        </div>
        <span className="cu-add-chevron">▾</span>
      </div>
      <div className="cu-add-label">
        <MonoLabel>First message</MonoLabel>
      </div>
      <textarea
        className="cu-textarea"
        rows={4}
        value={draft.message}
        onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
      />
      <TokenChips />
      <div className="cu-add-label">
        <MonoLabel>Repetition & relay timing</MonoLabel>
      </div>
      <TimingSelects
        value={timing}
        firstLabel="Send first message"
        onChange={(next) => setDraft((d) => ({ ...d, ...next }))}
      />
      <div className="cu-add-spacer" />
      <PrimaryButton
        onClick={() =>
          actions.cuCreate({
            companyName: draft.companyName,
            contactName: draft.contactName,
            emailAddress: draft.emailAddress,
            message: draft.message,
            send: draft.send,
            cond: draft.cond,
            repeat: draft.repeat,
            stop: draft.stop,
          })
        }
      >
        Create & turn on
      </PrimaryButton>
    </div>
  );
}
