/**
 * Audit: feed (dc.html:428-448, "Scout" header owned by PaneHeader's
 * SCOUT_HEADER fallback). Findings come from `data.findings` (lazy-loaded
 * with status:"open" on first audit-tab entry) and are grouped by their
 * seed `threadLabel` ("PO #4471 · ACME STEEL · 14 MSGS"), in feed order.
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { MonoLabel, OutlineButton, pressableProps } from "../../components/primitives";
import { CubeIcon, ClockIcon, DollarCircleIcon, MagnifierIcon, RefreshIcon } from "../../icons";

const FINDING_ICONS = {
  price: DollarCircleIcon,
  time: ClockIcon,
  qty: CubeIcon,
};

// dc.html feed rows hardcode the sub-line per finding type: the price row
// appends " / unit", the qty row " units", the date row nothing — the values
// themselves are the finding's compare pair.
const SUB_SUFFIX = { price: " / unit", qty: " units", time: "" };

function findingSub(f) {
  if (!f.detail) return "";
  return `${f.detail.left} → ${f.detail.right}${SUB_SUFFIX[f.type] || ""}`;
}

export function AuditFeed() {
  const { data, actions } = useApp();
  const findings = (data.findings || []).filter((f) => f.status !== "dismissed");

  // Group by threadLabel, preserving first-seen order (prototype order:
  // Acme's two findings, then Delmar's one).
  const groups = [];
  for (const f of findings) {
    let group = groups.find((g) => g.label === f.threadLabel);
    if (!group) {
      group = { label: f.threadLabel, findings: [] };
      groups.push(group);
    }
    group.findings.push(f);
  }

  return (
    <div className="au-feed">
      <div className="au-feed-header">
        <div>
          <div className="au-feed-h1">Audit</div>
          <div className="au-feed-live">LIVE · MONITORING 8 ORDERS</div>
        </div>
        <span className="au-on-pill">
          <span className="au-on-dot" />
          ON
        </span>
      </div>
      <div className="au-info-wrap">
        <div className="au-info-card">
          <span className="au-info-icon">
            <MagnifierIcon size={15} stroke="#fff" />
          </span>
          <div className="au-info-text">
            <b>Catching discrepancies</b> before they reach your books — automatically.
          </div>
        </div>
      </div>
      <div className="au-recent-label">
        <MonoLabel>Recent findings</MonoLabel>
      </div>
      <div className="au-groups">
        {groups.map((group) => (
          <div className="au-group" key={group.label}>
            <div className="au-group-label">{group.label}</div>
            {group.findings.map((f) => {
              const Icon = FINDING_ICONS[f.type] || DollarCircleIcon;
              return (
                <div className="au-finding" key={f.id || f.type} {...pressableProps(() => actions.auOpenFinding(f.type))}>
                  <span className="au-finding-icon">
                    <Icon size={15} stroke="#141414" />
                  </span>
                  <div className="au-finding-main">
                    <div className="au-finding-title">{f.title}</div>
                    <div className="au-finding-sub">{findingSub(f)}</div>
                  </div>
                  <span className={`au-badge${f.priority === "HIGH" ? " is-high" : ""}`}>{f.priority}</span>
                  <span className="au-finding-chevron">›</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="au-rerun-wrap">
        <OutlineButton icon={<RefreshIcon size={14} stroke="#141414" />} onClick={actions.auRerun}>
          Re-run audits
        </OutlineButton>
      </div>
    </div>
  );
}
