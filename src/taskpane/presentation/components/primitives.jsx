/**
 * Shared, presentational-only UI primitives for the Scout add-in.
 * No data fetching, no use case imports — screens (Tasks 11-16) compose these.
 * Visual language: `../styles/tokens.css` + `../styles/app.css` (prototype-derived).
 */
import * as React from "react";
import "../styles/tokens.css";
import "../styles/app.css";
import { NetSuiteGlyph, QuickBooksGlyph, ExcelGridGlyph, ArrowRightIcon } from "../icons";

/* -------------------------------------------------------------------------
   pressableProps — spread over a clickable non-<button> element (div/span
   rows the prototype styles preclude converting to <button>) to make it
   keyboard-operable: button role, tab stop, and Enter/Space activation
   mirroring native button behavior. No-op (empty props) without onClick.
   ------------------------------------------------------------------------- */
export function pressableProps(onClick) {
  if (!onClick) return {};
  return {
    role: "button",
    tabIndex: 0,
    onClick,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    },
  };
}

/* -------------------------------------------------------------------------
   Card
   ------------------------------------------------------------------------- */
export function Card({ children, emphasis, onClick, className }) {
  const classes = ["card"];
  if (emphasis) classes.push("is-emphasis");
  if (onClick) classes.push("is-clickable");
  if (className) classes.push(className);
  return (
    <div className={classes.join(" ")} {...pressableProps(onClick)}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------
   MonoLabel — JetBrains Mono, uppercased in JS (not CSS text-transform)
   ------------------------------------------------------------------------- */
const shout = (v) => (typeof v === "string" ? v.toUpperCase() : v);

export function MonoLabel({ children }) {
  return <span className="mono-label">{shout(children)}</span>;
}

/* -------------------------------------------------------------------------
   PillTag
   ------------------------------------------------------------------------- */
export function PillTag({ variant, children }) {
  return <span className={`pill pill-${variant}`}>{children}</span>;
}

/* -------------------------------------------------------------------------
   Buttons
   ------------------------------------------------------------------------- */
export function PrimaryButton({ children, onClick, icon, disabled }) {
  return (
    <button type="button" className="btn btn-primary" onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick, icon, disabled }) {
  return (
    <button type="button" className="btn btn-outline" onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
}

export function DashedButton({ children, onClick, icon, disabled }) {
  return (
    <button type="button" className="btn btn-dashed" onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------
   Toggle — 26x15 accessible switch
   ------------------------------------------------------------------------- */
export function Toggle({ on, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      className={`toggle-track${on ? " is-on" : ""}`}
      onClick={() => onChange && onChange(!on)}
    >
      <span className="toggle-knob" />
    </button>
  );
}

/* -------------------------------------------------------------------------
   FieldCard — mono label + 13px value row
   ------------------------------------------------------------------------- */
export function FieldCard({ label, value, trailing, onClick }) {
  return (
    <div className={`field-card${onClick ? " is-clickable" : ""}`} {...pressableProps(onClick)}>
      <div className="field-card-main">
        <MonoLabel>{label}</MonoLabel>
        <div className="field-card-value">{value}</div>
      </div>
      {trailing && <div className="field-card-trailing">{trailing}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------
   ErpPicker — NetSuite / QuickBooks / Excel / Sheets radio cards
   ------------------------------------------------------------------------- */
const ERP_OPTIONS = [
  { name: "NetSuite", Glyph: NetSuiteGlyph },
  { name: "QuickBooks", Glyph: QuickBooksGlyph },
  { name: "Excel / Sheets", Glyph: ExcelGridGlyph },
];

export function ErpPicker({ selected, onPick }) {
  return (
    <div className="erp-picker">
      {ERP_OPTIONS.map(({ name, Glyph }) => {
        const isSelected = selected === name;
        return (
          <button
            key={name}
            type="button"
            className={`erp-option${isSelected ? " is-selected" : ""}`}
            onClick={() => onPick && onPick(name)}
          >
            <span className="erp-option-icon">
              <Glyph size={17} />
            </span>
            <span className="erp-option-name">{name}</span>
            <span className="erp-option-dot" />
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------
   AvatarRow
   ------------------------------------------------------------------------- */
export function AvatarRow({ initials, name, sub }) {
  return (
    <div className="avatar-row">
      <span className="avatar-row-initials">{initials}</span>
      <div className="avatar-row-main">
        <div className="avatar-row-name">{name}</div>
        {sub && <div className="avatar-row-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   ProgressBar
   ------------------------------------------------------------------------- */
export function ProgressBar({ pct }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: pct }} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Spinner — scoutspin animation
   ------------------------------------------------------------------------- */
export function Spinner() {
  return <div className="spinner" role="status" aria-label="Loading" />;
}

/* -------------------------------------------------------------------------
   Compare — audit finding left/right comparison + impact line
   ------------------------------------------------------------------------- */
export function Compare({ leftLabel, left, rightLabel, right, impact }) {
  return (
    <div>
      <div className="compare">
        <div className="compare-side">
          <MonoLabel>{leftLabel}</MonoLabel>
          <div className="compare-value">{left}</div>
        </div>
        <ArrowRightIcon size={18} />
        <div className="compare-side">
          <MonoLabel>{rightLabel}</MonoLabel>
          <div className="compare-value">{right}</div>
        </div>
      </div>
      {impact != null && <div className="compare-impact">{impact}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------
   TokenChips — static message-template placeholders
   ------------------------------------------------------------------------- */
export function TokenChips() {
  return (
    <div className="token-chips">
      <span className="token-chip">{"+ {vendor}"}</span>
      <span className="token-chip">{"+ {order #}"}</span>
      <span className="token-chip">{"+ {ship date}"}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   TimingSelects — the 4 check-up cadence selects
   ------------------------------------------------------------------------- */
const SEND_OPTIONS = [
  ["day0", "Day 0"],
  ["+1", "+1 day"],
  ["+2", "+2 days"],
  ["+3", "+3 days"],
  ["+5", "+5 days"],
  ["+7", "+7 days"],
];
const COND_OPTIONS = [
  ["noreply", "No reply yet"],
  ["always", "Always send"],
];
const REPEAT_OPTIONS = [
  ["none", "Don't repeat"],
  ["2d", "2 days"],
  ["3d", "3 days"],
  ["weekly", "Weekly"],
];
const STOP_OPTIONS = [
  ["1", "1 try"],
  ["2", "2 tries"],
  ["3", "3 tries"],
  ["5", "5 tries"],
];

export function TimingSelects({ value, onChange, firstLabel }) {
  const baseId = React.useId();

  const row = (id, label, field, options) => (
    <div className="timing-row" key={field}>
      <label className="timing-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="timing-select"
        value={value[field]}
        onChange={(e) => onChange && onChange({ ...value, [field]: e.target.value })}
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="timing-selects">
      {row(`${baseId}-send`, firstLabel, "send", SEND_OPTIONS)}
      {row(`${baseId}-cond`, "Only if", "cond", COND_OPTIONS)}
      {row(`${baseId}-repeat`, "Repeat every", "repeat", REPEAT_OPTIONS)}
      {row(`${baseId}-stop`, "Stop after", "stop", STOP_OPTIONS)}
    </div>
  );
}
