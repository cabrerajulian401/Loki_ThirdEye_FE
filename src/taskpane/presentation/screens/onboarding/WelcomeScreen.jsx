/**
 * Onboarding: Welcome (dc.html:97-112). Copy is verbatim from the task brief.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { CompassLogo, MicrosoftGlyph, BoltIcon, CalendarCheckIcon, MagnifierIcon, PeopleIcon } from "../../icons";
import { PrimaryButton, MonoLabel } from "../../components/primitives";

const FEATURES = [
  { Icon: BoltIcon, title: "Otto-Mode", body: "Reads emails, drafts ERP updates for your OK." },
  { Icon: CalendarCheckIcon, title: "Check-ups", body: "Scheduled check-up emails to every vendor." },
  { Icon: MagnifierIcon, title: "Thread Audit", body: "Flags price, date & item discrepancies, live." },
  { Icon: PeopleIcon, title: "Team Threads", body: "Share threads & doc access across the team." },
];

export function WelcomeScreen() {
  const { actions } = useApp();

  return (
    <div className="onboarding-screen">
      <CompassLogo size={40} />
      <h1 className="onboarding-h1">Welcome to Scout</h1>
      <p className="onboarding-body">
        {"Let's get you set up — it takes about a minute. Sign in to start, then skim what Scout does below."}
      </p>
      <PrimaryButton icon={<MicrosoftGlyph size={16} />} onClick={actions.signIn}>
        Sign in with Microsoft
      </PrimaryButton>
      <div className="onboarding-divider" />
      <MonoLabel>WHAT SCOUT DOES</MonoLabel>
      <div className="feature-list">
        {FEATURES.map(({ Icon, title, body }) => (
          <div className="feature-row" key={title}>
            <span className="feature-row-icon">
              <Icon size={20} />
            </span>
            <div>
              <div className="feature-title">{title}</div>
              <div className="feature-body">{body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
