/**
 * Check-ups: schedule (dc.html:29-43). Pane title is the PO number (see
 * PaneHeader's `currentOrderPo`). Shows the current flow's contact card (with
 * an "ACTIVITY" chip into the activity timeline), its steps in order, and a
 * dashed "Add a step" affordance.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { AvatarRow, DashedButton } from "../../components/primitives";
import { PencilIcon, PlusIcon } from "../../icons";
import { timingLine } from "../../../domain/rules/timingLine";

export function CheckupSchedule() {
  const { nav, data, actions } = useApp();
  const flow = data.flows[nav.cuVendor];
  if (!flow) return null;

  return (
    <div className="cu-schedule">
      <div className="contact-card">
        <AvatarRow
          initials={flow.initials}
          name={
            <>
              {flow.poNumber} <span className="contact-card-dim">· {flow.companyName}</span>
            </>
          }
          sub={
            <>
              {flow.contactName} · {flow.emailAddress}
            </>
          }
        />
        <button type="button" className="contact-card-chip" onClick={actions.cuOpenActivity}>
          ACTIVITY
        </button>
      </div>
      <div className="cu-schedule-head">
        <span className="cu-schedule-h1">Schedule</span>
        <span className="mono-label cu-schedule-count">{`${flow.steps.length} STEPS · ${flow.cadence}`}</span>
      </div>
      <div className="cu-steps">
        {flow.steps.map((step, index) => (
          <div className="cu-step" key={index}>
            <div className="cu-step-top">
              <span className="cu-step-name">
                <span className="cu-step-num">{index + 1}</span>
                {step.name}
              </span>
              <button type="button" className="cu-step-edit" onClick={() => actions.cuEditStep(index)}>
                <PencilIcon size={11} stroke="#444" />
                Edit
              </button>
            </div>
            {step.message && <div className="cu-step-message">"{step.message}"</div>}
            <div className="cu-step-timing">{timingLine(step)}</div>
          </div>
        ))}
      </div>
      <div className="cu-add-step-wrap">
        <DashedButton icon={<PlusIcon size={13} stroke="#444" />} onClick={actions.cuAddStep}>
          Add a step
        </DashedButton>
      </div>
    </div>
  );
}
