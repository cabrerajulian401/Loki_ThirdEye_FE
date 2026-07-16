# Handoff: Scout — Outlook Add-In (Login, Onboarding & Core Features)

## Overview
Scout is an AI procurement assistant that lives in the **Outlook right-hand task pane** (Microsoft Add-In). It watches supplier email threads and helps SMB procurement teams: it records order data from emails into Excel/ERPs (Otto-Mode), sends scheduled supplier follow-ups (Check-ups), proactively flags discrepancies in threads (Live Audit), and surfaces all active orders in one list (Order List).

This bundle contains the full design source for:
1. **First-run experience** — Microsoft SSO sign-in → welcome → setup checklist → landing on the Order List.
2. **All four core features**, organized **by order** (not by supplier).

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, **not production code to copy directly**. The task is to **recreate these designs in the target codebase's environment** (an Office Add-in is typically React + Fluent-adjacent tooling inside a task-pane webview) using its established patterns and libraries. If no environment exists yet, a React task-pane app scaffolded with the Office Add-in Yeoman generator (`yo office`) is the natural choice.

The HTML uses a small custom runtime (`support.js`) to render — open the `.dc.html` files in a browser to see them live. **`Scout Prototype (standalone).html` is fully self-contained** (no other files needed) and is the easiest one to open. Read the markup/JS in the `.dc.html` files as the source of truth for exact styles and logic.

## Fidelity
**Low-fidelity by intent, high-precision in execution.** These are deliberate black-and-white wireframes (the product's visual language is intentionally monochrome for now), but every measurement, copy string, state, and interaction in them is real and specified. Implement layout, copy, flows, and interactions exactly; the B&W palette is the intended MVP styling, not a placeholder to re-theme.

## Design Tokens
- **Colors**: `#111`/`#141414` (ink, primary buttons), `#fff` (surfaces), `#fafafa`/`#f5f5f5` (recessed backgrounds), `#eee`/`#e5e5e5` (borders), `#777`/`#999` (secondary text), `#bbb` (placeholder). Single accent: `#c62828` red, used ONLY for the Audit alert badge/discrepancy markers.
- **Typography**: `Public Sans` (UI, weights 400–800) and `JetBrains Mono` (labels, section headers, buttons, data values — usually uppercase with `letter-spacing: .08–.14em`, 10–11px). Google Fonts.
- **Radius**: 8px cards/inputs, 10px pane cards, 999px pills. **Borders**: `1px solid #eee` (cards), `1.5px solid #111` (emphasis). Shadows: subtle, e.g. `0 1px 2px rgba(0,0,0,.04)`.
- **Pane width**: 340px content column (the Outlook task pane); full Outlook frame is 1920×1080 in mocks.

## Screens / Views

### A. First-run / login (wireframes file, top section)
1. **Sign-in** — Scout compass logo, "Welcome to Scout", one-line value prop, feature list (Order List / Otto-Mode / Check-ups / Thread Audit with one-line value adds), single **"Sign in with Microsoft"** button (Microsoft 4-square glyph, black button). No email/password path.
2. **Setup Checklist** — post-SSO card: numbered checklist (Connect where you record orders → QuickBooks or Excel/Google Sheets with logos; Let Scout scan supplier threads; Invite your team). Progress ticks; no skip option (deliberately removed).
3. **Landing → Order List** — checklist completion flows straight into the Orders card.

### B. Order List (home)
Card header "Orders" + count (e.g. `10 ACTIVE ORDERS`), filter pills (All / Delayed / On-time), rows per **order**: PO number, supplier, one-line status summary, status tag, last-message description + date. Bottom nav (Option D style): 4 larger labeled items — Orders, Otto, Check-ups, Audit; Audit shows a **red exclamation badge** when discrepancies exist.

### C. Otto-Mode
- **New-email state**: banner on incoming email ("Otto detected order data"), pane card shows email sender name + extracted fields (PO, qty, price, dates) → **Review & insert** → Confirm/edit inline → **ERP selection** (QuickBooks / Excel / Sheets) → **file-match card**: Scout lists the Excel files it found related to the email (multiple candidates, best match highlighted) → user picks → "Continue editing this sheet" confirmation showing WHAT CHANGES rows → recording progress → **Verify & confirm** with deeplink to the updated sheet.
- **Old-email state** (right of new-email flow, divider between): list of older/dismissed emails with short descriptions; picking one runs the same Record → Confirm → ERP selection → Verify flow.

### D. Check-ups (scheduled supplier follow-ups)
Own tab. List of configured check-ups **per order/vendor** showing contact email, message summary, repetition ("Repeat every…", "Only if no reply"), last-message description + date. **Edit** opens the same full form as **+ New check-up** (vendor, contact, first message with tokens, timing rows).

### E. Live Audit (proactive)
Runs in background; red exclamation badge on the Audit nav item. Card headline communicates the benefit ("catching discrepancies"). List of recent findings sorted by conversation/order (e.g. "Price changed: $4.10 → $4.60"), each showing the counterparty email. Selecting a finding shows detail; resolution path is a **button with the supplier's email address** that opens a **pre-addressed Outlook compose window** (outside the pane) — the pane does NOT contain a reply editor. Footer: **Re-run audits**.

## Interactions & Behavior
- Prototype is fully functional with scripted/canned AI responses: toggles persist, schedule is editable, text inputs work, first-run starts at onboarding.
- Otto flow is a strict step sequence (Record → Confirm & record → ERP selection → file match → Verify & confirm) for BOTH new and old emails.
- Audit "email" button hands off to Outlook compose (`mailto:`-style behavior in the prototype).
- Transitions are simple/instant; no elaborate animation required.

## State Management
- Auth/first-run flag (show onboarding vs. home), setup-checklist progress, orders collection (status, last message, date), Otto queue (new + dismissed emails, extraction payloads, chosen ERP + file), check-up configs (per vendor: contact, message, cadence, conditions), audit findings (per order, read/unread → nav badge).

## Assets
- Scout compass logo — inline SVG in the files.
- QuickBooks / Excel / Google Sheets glyphs — inline SVGs in the files.
- Microsoft sign-in glyph — inline SVG 4-square.
- Fonts via Google Fonts (Public Sans, JetBrains Mono).

## Files
- `Scout Login Wireframes.dc.html` — all wireframe frames on one canvas (login, checklist, order list, Otto states, Check-ups, Audit). Canonical spec for layout & copy.
- `Scout Prototype.dc.html` — the interactive prototype (full Outlook frame, pane docked right, functional flows). Canonical spec for behavior.
- `Scout Prototype (standalone).html` — same prototype, single self-contained file; open directly in any browser.
- `support.js` — runtime the `.dc.html` files need (keep it in the same folder to view them).
