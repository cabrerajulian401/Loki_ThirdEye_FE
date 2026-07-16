/**
 * Check-ups: list (dc.html:341-355, "Check-ups" header owned by PaneHeader's
 * SCOUT_HEADER fallback). One card per `data.flows` entry — the PO number and
 * contact row both open the schedule for that vendor (`cuOpenVendor(index)`);
 * the toggle flips it on/off in place (`cuToggle`) without navigating.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { AvatarRow, PrimaryButton, Toggle, pressableProps } from "../../components/primitives";
import { PlusIcon } from "../../icons";

// dc.html renderVals() cadenceLine (line 641): on flows show the clock glyph
// + cadence + next-send date (when there is one); paused flows just say so.
function cadenceLine(flow) {
  if (!flow.on) return "Paused";
  return `⏱ ${flow.cadence}${flow.next ? ` · next ${flow.next}` : ""}`;
}

export function CheckupsList() {
  const { data, actions } = useApp();
  const flows = data.flows || [];
  const activeCount = flows.filter((f) => f.on).length;

  return (
    <div className="cu-list">
      <div className="cu-list-header">
        <div className="cu-list-h1">Check-ups</div>
        <div className="mono-label cu-list-count">{`${activeCount} ACTIVE · BY ORDER`}</div>
      </div>
      <div className="cu-list-add">
        <PrimaryButton icon={<PlusIcon size={14} stroke="#fff" />} onClick={actions.cuOpenAdd}>
          Add check-up
        </PrimaryButton>
      </div>
      <div className="cu-cards">
        {flows.map((flow, index) => (
          <div className={`cu-card${flow.on ? "" : " is-dim"}`} key={flow.flowId}>
            <div className="cu-card-top">
              <span
                className={`cu-card-po${flow.on ? "" : " is-off"}`}
                {...pressableProps(() => actions.cuOpenVendor(index))}
              >
                {flow.poNumber}
              </span>
              <span className={`cu-toggle-row${flow.on ? "" : " is-off"}`}>
                <Toggle
                  on={flow.on}
                  onChange={(next) => actions.cuToggle(flow.flowId, next)}
                  ariaLabel={`Turn check-up ${flow.on ? "off" : "on"} for ${flow.poNumber}`}
                />
                {flow.on ? "ON" : "OFF"}
              </span>
            </div>
            <div className="cu-card-contact" {...pressableProps(() => actions.cuOpenVendor(index))}>
              <AvatarRow
                initials={flow.initials}
                name={
                  <>
                    {flow.contactName} <span className="cu-card-vendor">· {flow.companyName}</span>
                  </>
                }
                sub={flow.emailAddress}
              />
            </div>
            <div className="cu-card-cadence">{cadenceLine(flow)}</div>
          </div>
        ))}
      </div>
      <div className="cu-list-spacer" />
    </div>
  );
}
