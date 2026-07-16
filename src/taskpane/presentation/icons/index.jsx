/**
 * Prototype icon set — transcribed verbatim (path data, viewBox, stroke widths)
 * from the inline <svg> markup in `.claude/assets/design_handoff_scout_addin/Scout Prototype.dc.html`.
 * Each export is a small presentational React component: ({ size = 18, stroke = "#141414" } = {}) => <svg …>.
 * Source line numbers (dc.html) are noted per icon below.
 */
import * as React from "react";

/* Scout compass mark — small (dc.html:89), used in the pane header */
export const CompassMark = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6">
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5 L11 11 L8.5 15.5 L13 13 Z" fill={stroke} stroke="none" />
  </svg>
);

/* Scout compass logo — large (dc.html:99), used on the welcome screen */
export const CompassLogo = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.4">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.4" />
    <path d="M16.5 7.5 L12 12" />
  </svg>
);

/* Microsoft 4-square glyph (dc.html:102) — "Sign in with Microsoft" button */
export const MicrosoftGlyph = ({ size = 18 } = {}) => (
  <svg width={size} height={size} viewBox="0 0 16 16">
    <rect x="0" y="0" width="7" height="7" fill="#fff" />
    <rect x="9" y="0" width="7" height="7" fill="#cfcfcf" />
    <rect x="0" y="9" width="7" height="7" fill="#9a9a9a" />
    <rect x="9" y="9" width="7" height="7" fill="#777" />
  </svg>
);

/* Calendar with check — "Check-ups" feature row (dc.html:107) */
export const CalendarCheckIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M3 9h18 M8 3v3 M16 3v3 M9 14l2.2 2.2L15.5 12" />
  </svg>
);

/* Two people — "Team Threads" feature row (dc.html:109) */
export const PeopleIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <circle cx="17" cy="9" r="2.3" />
    <path d="M15.5 14.5c2.8.2 5 2 5 4.5" />
  </svg>
);

/* Checkmark (dc.html:121) — onboarding checklist "done" dot */
export const CheckIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l4 4 10-11" />
  </svg>
);

/* NetSuite glyph (dc.html:137) — ERP picker */
export const NetSuiteGlyph = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
    <ellipse cx="12" cy="6" rx="7" ry="2.6" />
    <path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6 M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
  </svg>
);

/* QuickBooks glyph (dc.html:138) — ERP picker */
export const QuickBooksGlyph = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10 M14.6 9c-.6-.8-1.6-1.1-2.6-1.1-1.4 0-2.5.8-2.5 2 0 2.7 5.2 1.5 5.2 4.2 0 1.2-1.1 2-2.6 2-1.1 0-2.1-.4-2.7-1.2" />
  </svg>
);

/* Excel grid glyph (dc.html:139) — ERP picker ("Excel / Sheets") */
export const ExcelGridGlyph = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9.5h18 M3 15h18 M9 9.5v10.5 M15 9.5v10.5" />
  </svg>
);

/* Bolt / lightning (dc.html:151) — Otto-Mode banner + nav tab */
export const BoltIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 L4 14 h7 l-1 8 9-12 h-7 z" />
  </svg>
);

/* Clock (dc.html:158) — order card ETA */
export const ClockIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5l3 2" />
  </svg>
);

/* Pencil (dc.html:175) — otto review "edit field" affordance */
export const PencilIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h4l10-10-4-4L4 16z" />
    <path d="M14 6l4 4" />
  </svg>
);

/* Chat bubble (dc.html:179) — "Ask Scout" button */
export const ChatIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z" />
  </svg>
);

/* Excel "X" mark on green (dc.html:213) — found-files header badge */
export const ExcelGreenGlyph = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M8 8l8 8 M16 8l-8 8" />
  </svg>
);

/* Plus (dc.html:343) — "Add check-up" / "Add a step" buttons */
export const PlusIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/* Open envelope with checkmark flap (dc.html:422) — check-up activity timeline */
export const EnvelopeOpenIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8l9 6 9-6" />
    <rect x="3" y="5" width="18" height="14" rx="2" />
  </svg>
);

/* Dollar-in-circle (dc.html:437) — audit "price changed" finding */
export const DollarCircleIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10 M14.6 9c-.6-.8-1.6-1.1-2.6-1.1-1.4 0-2.5.8-2.5 2 0 2.7 5.2 1.5 5.2 4.2 0 1.2-1.1 2-2.6 2-1.1 0-2.1-.4-2.7-1.2" />
  </svg>
);

/* Refresh / re-run (dc.html:445) — "Re-run audits" button */
export const RefreshIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v4h-4" />
  </svg>
);

/* Arrow right (dc.html:454) — audit finding "compare" arrow */
export const ArrowRightIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* External link (dc.html:464, second svg) — "open in Outlook" compose button */
export const ExternalLinkIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7M9 7h8v8" />
  </svg>
);

/* Cube / box (dc.html:487) — bottom nav "Orders" tab */
export const CubeIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
    <path d="M3.3 7.5L12 12.5l8.7-5M12 12.5V21" />
  </svg>
);

/* Clipboard with check (dc.html:489) — bottom nav "Check-ups" tab */
export const ClipboardCheckIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="4.5" width="14" height="16" rx="2" />
    <path d="M9 4.5V3.5h6v1M8.5 12.5l2 2 4-4" />
  </svg>
);

/* Magnifier (dc.html:490) — bottom nav "Audit" tab */
export const MagnifierIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20.5 20.5l-5.2-5.2" />
  </svg>
);

/* Paper airplane / send (dc.html:503) — compose window "Send" button */
export const SendIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
  </svg>
);

/*
 * Chevron-left — pane header back affordance. The prototype (dc.html:88) renders this
 * as a plain text glyph ('‹'), not an <svg>, so there is no path data to transcribe.
 * A standard chevron-left path is used here to keep the header actionable as a
 * proper icon component while matching the prototype's visual intent.
 */
export const ChevronLeftIcon = ({ size = 18, stroke = "#141414" } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
