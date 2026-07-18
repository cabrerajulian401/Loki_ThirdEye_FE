# 🧭 Scout Frontend (Outlook Add-in) — Build Journal

> **What this is** — the complete walkthrough of how the Scout add-in frontend was built on 2026-07-16: brainstorm → spec → 18-task TDD plan → subagent-driven execution with per-task adversarial review. Written to mirror the Overseer walkthrough docs (`BE_Docs/Endpoints/`). Heavy emphasis, per Julian's request, on **what's next, what's needed, and what was missed**.
>
> Companion: `loki-summary.md` (same folder). Spec: `docs/superpowers/specs/2026-07-16-scout-addin-frontend-design.md`. Plan: `docs/superpowers/plans/2026-07-16-scout-addin-frontend.md`. Task-by-task ledger with review verdicts: `.superpowers/sdd/progress.md` + `task-N-report.md` files (gitignored, local).

---

## ⚡ What was built

The full Scout task-pane app in React 18 + JavaScript inside the existing OfficeDev scaffold: **first-run** (Welcome → Setup checklist → Connect ERP), **Orders** home with the Otto banner and realtime updates, the complete **Otto-Mode** overlay flow (Review → Edit → ERP → Files → File-confirm → Recording → Verify) plus the old/dismissed-email tab flow, **Check-ups** (list / schedule / step editor / new check-up / activity timeline), and **Live Audit** (feed / finding detail / alert toast / real Outlook compose handoff) — all 22 screens 1:1 with the design prototype, all copy byte-exact.

Everything runs on **mock adapters seeded verbatim from the prototype** and persists in `localStorage` (key namespace `scout:`), so the app is fully testable in a browser with no backend. The **Overseer HTTP + WebSocket adapters are already written and contract-tested** against `BE_Docs/Endpoints/`; the flip to the real backend (`dataSource: "http"` in `src/taskpane/config/app.config.js`) is **transport-ready** — paths, auth headers, error mapping, and the ws contract are all contract-tested — but not yet render-ready: screens bind seed-shaped view-model fields the BE DTOs don't carry, so a mapping layer is still needed (gap #9 below).

**Numbers:** 18 plan tasks · 23 feature/fix commits on `scout-fe` (21 from the build + 2 from the final-review fix wave) · 18 test suites / 131 tests, all green and warning-free · `npm run build:dev` clean · Fluent UI removed. Every task passed an independent spec + quality review; 4 tasks needed fix rounds (all caught by reviewers, all resolved and re-verified).

## 🎓 Design decisions (one line each, with the why)

1. **Clean architecture, arrow points inward** — `presentation → application → domain`; `infrastructure` implements `application/ports.js`; only `config/container.js` knows concrete adapters. Payoff: the entire backend swap is config, and every layer tests without the ones above it.
2. **Approach C: explicit state machines** — `navigationMachine` and `ottoFlowMachine` are pure reducers porting the prototype's own transition tables (including its literal back-map). Every arrow is a unit test; screens can't invent illegal transitions.
3. **No router** — the pane has no URLs; navigation is state, exactly like the prototype. One less dependency, one less concept.
4. **Context + useReducer, no Redux/Zustand** — one controller hook (`useAppController`) owns all use-case calls; screens only read `useApp()`.
5. **Result convention everywhere** — `ok(data)` / `err(code, message)`; nothing throws across a boundary. HTTP status mapping is one table (`401→AUTH_EXPIRED, 404, 409, 400, ≥500→UPSTREAM`, fetch-throw→`NETWORK`).
6. **CheckupRepository is flow-level** (deviation from the spec's row-level sketch, recorded in the plan) — the UI thinks in flows+steps; the http adapter absorbs Overseer's row-per-message model (group by `flowId`, toggle = PATCH per pending row, step-edit = cancel + recreate).
7. **Cadence derived from send dates, not `repeatEveryDays`** — the BE docs state only `repeat_flow` is stored, so the adapter computes the gap between the first two rows' `sendDate`s ("Weekly" at 7 days, "One-time" for single rows). A reviewer caught that the naive version would have rendered "Paused" for every real flow.
8. **"Paused" is a display rule, not data** — `flowCadenceLabel` (domain) renders Paused from `on === false`; adapters never emit it.
9. **The prototype is the stylesheet and the icon source** — every SVG path, color, and copy string was transcribed from `Scout Prototype.dc.html`, not re-created (reviewers spot-checked 11 icons and dozens of strings against source lines).
10. **The orphaned toast got its real trigger** — the prototype defined the audit toast but never raised it; here `discrepancy.found` (ws event / mock emitter) raises it, exactly what the event is for.
11. **Compose is always the real Office service** — `displayNewMessageForm` with the pre-drafted reply; `mailto:` fallback in plain browsers; no in-pane reply editor (per design).
12. **SSO wired but dormant** — `auth.mode: "sso"` implements `OfficeRuntime.auth.getAccessToken` with mock fallback + console warning; `"mock"` (default) signs in instantly. Blocked on an Azure app registration (see gaps).
13. **Mock realtime scripts the demo** — `startSync()` → `sync.completed` after 1.2s; first connect → `discrepancy.found` (the price finding) after 8s, once per storage lifetime, so the toast/badge is demonstrable offline.
14. **Tests mirror the layers** — domain rule tables → machine transition tables → use cases with hand fakes → adapter contract tests (fetch-mocked paths/bodies/headers per BE docs) → RTL screen flows through the real mock container.
15. **Execution: fresh subagent per task + adversarial reviewer per task** — reviews were not theater: they caught prototype-string mismatches (Task 2), a mock↔http contract break + the cadence bug (Task 8), and a dropped realtime requirement (Task 11) before anything built on them.

## 🌳 Where things live

```
src/taskpane/
├── domain/rules/            checkupTransitions · timingLine · orderStatus · checklistProgress · checkupFlows
├── application/
│   ├── result.js · ports.js (9 port typedefs)
│   ├── machines/            navigationMachine · ottoFlowMachine
│   └── usecases/            session (+realtime) · orders · otto · checkups · audit
├── infrastructure/
│   ├── storage/localStorageService.js
│   ├── mock/                seed.js (prototype-verbatim data) · mockRepos.js · mockServices.js
│   ├── http/                overseerClient.js · httpRepos.js · wsGateway.js
│   └── office/officeServices.js   (compose · emailContext · SSO auth w/ fallback)
├── config/                  app.config.js (THE swap flag) · container.js (composition root)
├── presentation/
│   ├── icons/index.jsx      25 SVGs transcribed from the prototype
│   ├── styles/              tokens.css (design tokens) · app.css
│   ├── components/          primitives.jsx (15) · PaneHeader · BottomNav · AuditToast
│   ├── screens/             onboarding/ (3) · orders/ (3) · otto/ (11) · checkups/ (5) · audit/ (2)
│   └── app/                 App.jsx (state-driven routing) · AppContext · useAppController
└── index.jsx                Office.onReady → mount (browser fallback for dev)
```

## 🔄 How the flows run

**Backend swap:** `app.config.js` → `dataSource: "http"` + real `apiBaseUrl`/`wsUrl`. Container then wires `overseerClient` (Bearer token on every call) + `wsGateway` (reconnecting `/ws`, events `sync.completed` / `order.updated` / `discrepancy.found`) + office email context; everything above the ports is untouched. (Transport level only — the screens still need the httpRepos row→view-model mapping, gap #9.)

**Otto (new email):** banner appears when `emailContext.getOpenEmail()` + `POST /otto/scans` succeed (mock: seeded Maria Chen email) → Review shows `extractedFields`, edits stay in controller state → ERP choice → Excel branch shows the scan's ranked `destinations` (BEST MATCH first) → confirm → `POST /otto/scans/{scanId}/record` with the **user-edited** fields (never the stored extraction — same human-in-the-loop rule as the backend) → Verify links the returned `webUrl`.

**Check-ups:** flows list groups per order with ON/OFF toggles (toggle = `PATCH` each pending row in http mode) → schedule shows steps with domain-generated timing lines (`↻ +3 DAYS IF NO REPLY · EVERY 3 DAYS`) → step editor / new check-up map the four selects to `{repeatFlow, repeatEveryDays, cancelIfReply, sendDate}` for `POST /checkups`.

**Audit:** findings load from `GET /discrepancies` (mock: the price/time/qty trio) → detail shows the compare card + thread evidence → the email-address button opens a **real Outlook compose** pre-filled with Scout's drafted reply → Dismiss actually `PATCH`es `dismissed`. Live `discrepancy.found` events upsert the finding, raise the toast, and light the nav badge until the Audit tab is visited.

## ✅ State of the system

- **Proven (automated):** 131/131 tests in 18 suites, output pristine · adapter contract tests pin every documented Overseer path, method, body, auth header, and error mapping · machine tests cover every transition + back-arrow · RTL flows drive real container wiring end-to-end (sign-in → onboarding → all four tabs → full Otto record paths → checkup CRUD → audit dismiss + compose fallback + realtime toast) · `npm run build:dev` exit 0 · no Fluent references remain.
- **Proven (controller-verified):** full suite re-run independently after the parallel-pipeline phase; every task's diff reviewed by an independent reviewer with the ledger recording verdicts and fix rounds.
- **Not yet proven:** real Outlook sideload (`npm start`) and the browser visual pass — Julian tests iteratively; `npm run dev-server` → https://localhost:3000/taskpane.html is the loop. HTTP mode against a *deployed* Overseer (no deployment exists yet). Real SSO (no Azure registration). Pixel-fidelity beyond reviewer spot-checks.

## 🚧 Known gaps & what's needed (priority order — the section that matters)

**Needed from Julian / the environment:**
1. **Overseer deployment URL** — then set `apiBaseUrl` + `wsUrl` in `app.config.js` and flip `dataSource: "http"`. Until then http mode boots but shows the orders retry state (verified, no crash).
2. **Azure AD app registration** (clientId + tenantId) for real Microsoft SSO — set them in `app.config.js`, switch `auth.mode: "sso"`, and add the `WebApplicationInfo` block to `manifest.xml` (not there yet — deliberate, needs the real IDs). Until then mock sign-in gates the UI; Overseer's MVP auth accepts any bearer anyway.
3. **Manual smoke** — browser walk-through + Outlook sideload; the plan's Verification section lists the exact end-to-end script.
4. **Production URLs** — manifest + webpack `urlProd` still say contoso.com (template placeholders; untouched intentionally).

**Needed from the Overseer backend (FE is already shaped for these):**
5. **`GET /otto/scans` listing** (BE's own Otto gap #5) — the Otto tab's old/dismissed email list is **mock-only** until this exists; the http adapter deliberately returns `NOT_IMPLEMENTED`.
6. **Wire old-email record to the backend** — the tab flow is currently nav-only (prototype parity, no `recordScan` call), pending #5; when the listing lands, reuse `recordScan` exactly like the overlay flow.
7. **Per-flow PATCH for check-ups** — pausing a 3-step flow is 3 requests today (BE Checkups gap #4); a `flowId`-level PATCH collapses the adapter loop.
8. **Step/flow read model** — `GET /checkups` rows can't reconstruct UI steps, so http-mode `listFlows` returns `steps: []` and step-editing maps to cancel + recreate (spec §11.4). Fine for MVP; a richer read model fixes it properly.
9. **http render-readiness** — screens bind seed-shaped view-model fields the BE DTOs don't carry (orders: `timingLine`/`lastMessenger`; discrepancies: `threadLabel`/`initials`/`contactEmail`/`draftReply`; otto destinations: `subtitle`/`isBestMatch`/`matchNote`; checkup flows: `poNumber`/`initials`/`next`) — needs a row→view-model mapping layer in `httpRepos` (reuse `flowInitials`, add a timingLine-for-orders rule) when Overseer deploys.
10. **New-sheet record + NetSuite/QuickBooks targets** — backend is Excel-first; both complete in mock only. Ports are function-named (`recordScan`), so new adapters slot in without UI changes.

**What was missed / discovered along the way (candor section):**
11. **node_modules was committed in the repo's very first commit** — ~119k files rode into git history and got pushed to GitHub before it was caught mid-build. Untracked now (`d641f7912`), but **history still carries the blobs**; if repo size annoys you, a one-time history rewrite (`git filter-repo --path node_modules --invert-paths`) + force-push while the repo has no other consumers is the fix.
12. **The `~/.gitconfig` HTTPS→SSH rewrite came back** — your BE doc's Git/SSH fix (remove `url.git@github.com:.insteadOf`) had been undone by something on the machine (line 6 of `~/.gitconfig` still shows the commented-out copy from last time; line 52 had a live one again). This repo is now immune via a **local** counter-rewrite, but find what keeps re-adding the global rule or every new repo will hit it.
13. **The design's checkup step model doesn't exist in the backend** — the UI edits heterogeneous steps per vendor; Overseer expands one message × cadence. This is a real design↔backend gap (see #8), absorbed in the adapter for now. Worth an explicit product decision before multi-step flows matter.
14. **Prototype quirks shipped faithfully (flag to design):** the timing line renders `· EVERY WEEKLY` (the prototype's own string-builder does this); the Orders header says `10 ACTIVE ORDERS` over 4 seeded cards and Audit says `MONITORING 8 ORDERS` (both literals from the mocks); `Re-run audits` just refetches (visual no-op in the prototype).
15. **Lint debt:** `office-addin-lint` doesn't cover `.jsx`, and the pre-existing baseline is ~504 errors (prettier + browser globals config). One dedicated lint-config chore would make `npm run lint` meaningful for this codebase.
16. **Minor review-triage backlog** (aggregated from per-task reviews, none blocking — the final-review fix wave has since resolved: keyboard a11y for clickable cards/rows, `RECORD_FAILED` surfacing + tests, the `OttoFileConfirm` destination guard, and the malformed mock demo event). Still open: mock list methods return live db references (scan clones, lists don't); `try/catch NETWORK` boilerplate ×15 could be one helper; `createRealtimeUsecases` lives in `session.js`; dead `ordersCountLabel` in seed; `Result` JSDoc typedef undefined; realtime effect has no cleanup/unsubscribe; toast demo delay (8s) needs a production decision.

## 🗺 What's next (ordered)

1. **Julian's iterative browser pass** (`npm run dev-server`) + Outlook sideload (`npm start`) — visual fidelity + feel; file tweaks back as issues or just describe them in-session.
2. **Final whole-branch review** (running as part of this build's close-out) → fix wave → merge `scout-fe` → `main` (or PR, Julian's call).
3. **Deploy Overseer** → flip `dataSource`, live-test orders sync + `/ws` events end-to-end (first real integration test).
4. **Azure registration** → `sso` mode + manifest `WebApplicationInfo` → real token flow (Overseer validates properly when its refresh-token work lands).
5. **Backend fast-follows** in this order of FE leverage: `GET /otto/scans` (#5, unlocks #6) → per-flow PATCH (#7) → step read model (#8) → httpRepos render mapping (#9, FE-side, when the DTOs are live to map against).
6. **Hardening sprint:** lint chore, realtime cleanup, remaining backlog one-liners (see #16 — RECORD_FAILED tests, keyboard a11y, and the destination guard already landed in the final-review fix wave).
7. **Optional:** git history purge of node_modules (#11).

---

## 📮 Addendum — 2026-07-18: both halves are deployed

- **FE hosted:** Azure Static Web Apps → https://proud-mud-0beae3510.7.azurestaticapps.net (auto-deploys from `main` via GitHub Actions). Two deploy fixes were needed: `output_location` "build"→"dist", and an emitted root `index.html` (SWA default-file requirement). `urlProd` now rewrites the hosted `manifest.xml` correctly — sideload from `<site>/manifest.xml`, no dev server needed.
- **BE deployed:** Overseer at https://overseer.jollyfield-8dc50d6e.centralus.azurecontainerapps.io (Azure Container Apps). Wired into `app.config.js` (apiBaseUrl/wsUrl) + manifest `<AppDomains>`.
- **Live contract smoke (11/12 pass):** orders/checkups/discrepancies reads + auth gate + status-filter 400 + full checkup lifecycle (201 server-minted ids, smuggled id ignored, paused↔pending, terminal-409) + otto 502-no-leak + sync 202 all match `BE_Docs` exactly. Test rows were left in the terminal `cancelled` state (flowId `955ca3ac…`, company "FE Smoke Test Co") — harmless, delete at will.
- **New finding → backend fast-follow:** `GET /ws` only authenticates via the `Authorization` header, which **browser WebSocket clients cannot send** — upgrade confirmed working (101) with the header, 401 without, and `?token=` is rejected today. Overseer should accept the token as a `?token=` query param (the FE's wsGateway already sends it) or drop ws auth for single-user MVP. Until then, realtime events won't reach the FE in http mode.
- **dataSource stays `"mock"`** deliberately: flipping needs (a) real Graph tokens — Azure AD registration + `auth.mode: "sso"` — else every Graph-backed call 502s and orders stay empty, and (b) the gap-#9 render mapping. Those two plus the ws token param are now the complete flip checklist.

*Written 2026-07-16 by the build controller (Claude, Fable 5) covering `scout-fe` commits `0cf54c58e…00d6885fe` (21 commits: 18 plan tasks + fix rounds + repo hygiene), built from `docs/superpowers/plans/2026-07-16-scout-addin-frontend.md` via subagent-driven development (implementer + independent reviewer per task; pipeline + combined dispatches for tasks 12-17 per Julian's speed request).*
