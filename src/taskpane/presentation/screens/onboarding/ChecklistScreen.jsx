/**
 * Onboarding: Checklist (dc.html:115-130). Progress comes from the domain
 * rule `checklistProgress`. Copy is verbatim from the task brief.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { checklistProgress } from "../../../domain/rules/checklistProgress";
import { ProgressBar, PrimaryButton } from "../../components/primitives";
import { CheckIcon } from "../../icons";

function ChecklistDot({ checked, strongBorder }) {
  const classes = ["checklist-dot"];
  classes.push(checked ? "is-checked" : strongBorder ? "is-border-strong" : "is-border-weak");
  return <div className={classes.join(" ")}>{checked && <CheckIcon size={12} stroke="#fff" />}</div>;
}

export function ChecklistScreen() {
  const { nav, actions } = useApp();
  const { pct, count } = checklistProgress(nav.checklist);

  return (
    <div className="checklist-screen">
      <h1 className="checklist-h1">Finish setting up</h1>
      <div className="checklist-sub">A few quick steps to get the most out of Scout.</div>

      <div className="checklist-progress-row">
        <ProgressBar pct={pct} />
        <span className="checklist-count">{count}</span>
      </div>

      <div className="checklist-rows">
        <div className="checklist-row is-static">
          <ChecklistDot checked strongBorder={false} />
          <span className="checklist-row-title is-done">Sign in with Microsoft</span>
        </div>

        <div className="checklist-row is-erp is-clickable" onClick={actions.openConnect}>
          <ChecklistDot checked={nav.checklist.erp} strongBorder />
          <div className="checklist-row-main">
            <div className="checklist-row-title">Connect your ERP</div>
            <div className="checklist-row-sub">Sync orders to NetSuite, QuickBooks…</div>
          </div>
          <span className="checklist-chevron">›</span>
        </div>

        <div className="checklist-row is-plain is-clickable" onClick={actions.toggleOtto}>
          <ChecklistDot checked={nav.checklist.otto} strongBorder={false} />
          <div className="checklist-row-main">
            <div className="checklist-row-title is-secondary">Turn on Otto-Mode</div>
            <div className="checklist-row-sub is-secondary">Let Scout read & draft updates</div>
          </div>
          <span className="checklist-chevron is-dim">›</span>
        </div>

        <div className="checklist-row is-plain is-clickable" onClick={actions.toggleInvite}>
          <ChecklistDot checked={nav.checklist.invite} strongBorder={false} />
          <div className="checklist-row-main">
            <div className="checklist-row-title is-secondary">Invite your team</div>
            <div className="checklist-row-sub is-secondary">Share threads & documents</div>
          </div>
          <span className="checklist-chevron is-dim">›</span>
        </div>
      </div>

      <div className="checklist-spacer" />
      <PrimaryButton onClick={actions.finishOnboarding}>Go to Scout</PrimaryButton>
      <div className="checklist-footer">You can finish these anytime from Settings.</div>
    </div>
  );
}
