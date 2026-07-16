/**
 * Bottom nav — 4 tabs (dc.html:484-492). Rendered by `App` iff
 * `phase==='app' && !isOverlayActive(otto)`. Accessible names are exactly
 * "Orders" / "Otto" / "Check-ups" / "Audit" (icons carry no text).
 */
import * as React from "react";
import { useApp } from "../app/AppContext";
import { CubeIcon, BoltIcon, ClipboardCheckIcon, MagnifierIcon } from "../icons";

const TABS = [
  { tab: "suppliers", label: "Orders", Icon: CubeIcon },
  { tab: "otto", label: "Otto", Icon: BoltIcon },
  { tab: "checkups", label: "Check-ups", Icon: ClipboardCheckIcon },
  { tab: "audit", label: "Audit", Icon: MagnifierIcon },
];

export function BottomNav() {
  const { nav, actions } = useApp();

  return (
    <div className="bottom-nav">
      {TABS.map(({ tab, label, Icon }) => {
        const active = nav.tab === tab;
        const showBadge = tab === "audit" && nav.phase === "app" && !nav.auditSeen;
        return (
          <button
            key={tab}
            type="button"
            className={`bottom-nav-item${active ? " is-active" : ""}`}
            onClick={() => actions.goTab(tab)}
          >
            <span className="bottom-nav-icon">
              <Icon size={21} stroke={active ? "#fff" : "#6a6a6a"} />
              {showBadge && (
                <span className="bottom-nav-badge" data-testid="audit-badge">
                  !
                </span>
              )}
            </span>
            <span className="bottom-nav-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
