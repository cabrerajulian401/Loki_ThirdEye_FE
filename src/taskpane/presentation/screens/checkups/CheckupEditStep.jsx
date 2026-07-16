/**
 * Check-ups: edit step (dc.html:47-61, "Edit step" header owned by
 * PaneHeader). Local draft state seeded from the current flow's step at
 * `nav.editStepIdx` — Cancel discards it (`actions.back`), Save round-trips
 * the whole step through `actions.cuSaveStep`.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { MonoLabel, OutlineButton, PrimaryButton, TimingSelects, TokenChips } from "../../components/primitives";

export function CheckupEditStep() {
  const { nav, data, actions } = useApp();
  const flow = data.flows[nav.cuVendor];
  const step = flow && flow.steps[nav.editStepIdx];
  const [draft, setDraft] = React.useState(() => ({
    message: step ? step.message : "",
    send: step ? step.send : "day0",
    cond: step ? step.cond : "noreply",
    repeat: step ? step.repeat : "none",
    stop: step ? step.stop : "1",
  }));

  if (!step) return null;

  return (
    <div className="cu-editstep">
      <MonoLabel>Message</MonoLabel>
      <textarea
        className="cu-textarea"
        rows={4}
        value={draft.message}
        onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
      />
      <TokenChips />
      <div className="cu-editstep-timing-label">
        <MonoLabel>Repetition & relay timing</MonoLabel>
      </div>
      <TimingSelects value={draft} firstLabel="Send this step" onChange={(next) => setDraft((d) => ({ ...d, ...next }))} />
      <div className="cu-editstep-spacer" />
      <div className="cu-editstep-actions">
        <OutlineButton onClick={actions.back}>Cancel</OutlineButton>
        <PrimaryButton onClick={() => actions.cuSaveStep(draft)}>Save step</PrimaryButton>
      </div>
    </div>
  );
}
