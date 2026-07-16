# Scout Add-in Frontend — Design Spec

**Date:** 2026-07-16 · **Status:** Approved approach C (clean architecture + explicit flow state machines) · **Stack:** React 18 + JavaScript (JSX), webpack/babel Office Add-in scaffold, Jest + React Testing Library

---

## 1. Context

Scout is an AI procurement assistant living in the Outlook right-hand task pane (Microsoft Mail add-in). The design handoff in `.claude/assets/design_handoff_scout_addin/` specifies four features — **Order List** (home), **Otto-Mode** (email → ERP entry with human approval), **Check-ups** (scheduled supplier follow-ups), **Live Audit** (discrepancy detection) — plus a first-run flow (Microsoft sign-in → setup checklist → Orders).

The Overseer backend (Go, clean architecture) already implements all four features; its endpoint contracts are documented in `BE_Docs/Endpoints/` (`Order_List_Sync_Onboading.md`, `Order_List_Post_Sync_Webhooks`, `Checkups.md`, `Thread_Audit.md`, `Otto.md`). It is **not deployed yet**, so the frontend ships with **mock adapters seeded from the prototype's exact data**, behind ports whose HTTP implementations already match the documented contracts. Swapping mock → real is one config change.

**Design fidelity rule (from the handoff README):** low-fidelity monochrome is the *intended* MVP styling. Layout, copy, flows, and interactions are implemented exactly as the prototype specifies. Canonical sources: `Scout Prototype.dc.html` (behavior + markup, line-addressable), `Scout Login Wireframes.dc.html` (layout/copy).

## 2. Goals / Non-goals

**Goals**
- Recreate every prototype screen/flow 1:1 in React + JS inside the existing scaffold (`src/taskpane/`).
- Clean architecture: `domain` ← `application` ← (`infrastructure`, `presentation`); composition root wires adapters; dependency arrows never reverse.
- Mock data now; Overseer HTTP + WebSocket adapters written against the documented contracts, activated by config.
- Real Outlook compose for Audit replies via Office.js (mailto fallback in plain browser).
- SSO wired config-driven with fallback: `auth.mode: 'mock'` today; `'sso'` path implemented with placeholder IDs.
- TDD throughout (Jest + RTL); tests mirror the layers.

**Non-goals (this round)**
- Real MSAL/NAA token acquisition end-to-end (needs Azure app registration — not yet created).
- "Invite your team" functionality beyond the checklist toggle (prototype parity).
- Manifest/production URL changes, deployment, backend work.
- Re-theming; elaborate animation.

## 3. Architecture

```
src/taskpane/
├── domain/                    # Pure JS. Zero imports from React/Office/adapters.
│   ├── entities/              #   order.js, checkupFlow.js, checkupMessage.js,
│   │                          #   discrepancy.js, ottoScan.js, setupChecklist.js
│   └── rules/                 #   checkupTransitions.js, timingLine.js, orderStatus.js,
│                              #   checklistProgress.js
├── application/               # Imports domain only.
│   ├── ports/                 #   JSDoc-documented interface definitions (see §5)
│   ├── usecases/              #   one file per use case (see §5)
│   └── machines/              #   navigationMachine.js, ottoFlowMachine.js (pure)
├── infrastructure/
│   ├── mock/                  #   in-memory repos + seed data + mock realtime emitter
│   ├── http/                  #   overseerClient.js + repo implementations + wsGateway.js
│   ├── office/                #   officeComposeService.js, officeAuthService.js
│   └── storage/               #   localStorageService.js
├── presentation/              # React. Calls use cases via context; never touches adapters.
│   ├── app/                   #   App.jsx, AppProviders.jsx, useAppState.js
│   ├── screens/               #   one component per screen (§7)
│   ├── components/            #   shared primitives (§7)
│   ├── icons/                 #   inline SVGs extracted from the prototype
│   └── styles/                #   tokens.css + per-component css
├── config/
│   ├── app.config.js          #   { dataSource: 'mock'|'http', apiBaseUrl, wsUrl,
│   │                          #     auth: { mode: 'mock'|'sso', clientId, tenantId } }
│   └── container.js           #   composition root: builds ports per config
└── index.jsx                  # Office.onReady → mount App with container
```

- **Dependency rule:** presentation → application → domain; infrastructure implements application's ports; only `config/container.js` knows concrete adapters.
- **No router.** Navigation is state-driven (the pane has no URLs), exactly like the prototype.
- **State:** React Context + `useReducer`. The reducer delegates transitions to the pure machines; data flows through use cases.
- **Persistence:** UI/session state + mock data persist via `StorageService` → `localStorage` (parity with the prototype's `localStorage['scoutProto']`), so iterative testing survives reloads. Key: `scout`.

## 4. Domain model

| Entity | Fields (essential) | Rules |
|---|---|---|
| `Order` | id, poNumber, company, status (`delayed`\|`on-time`\|`quote-pending`\|`delivered`), originalEstDate, currentEstDate, lastMessenger, lastMessage, lastMessageDate, emailUrl, conversationId | status → pill variant mapping (`orderStatus.js`) |
| `CheckupMessage` | id, flowId, companyName, emailAddress, contactName, subject, body, sendDate, status (`pending`\|`paused`\|`sending`\|`sent`\|`cancelled`), cancelIfReply, conversationId | `canTransition(from, to)`: `paused ↔ pending`; either → `cancelled`; same-status = no-op success; `sent`/`cancelled` terminal; `sending` untouchable (mirrors backend entity) |
| `CheckupFlow` | derived grouping of messages by flowId; per-vendor UI view (vendor, contact, cadence, next send, on/off) | on = any pending message; timing line strings (`timingLine.js`, e.g. `↻ +3 DAYS IF NO REPLY · EVERY 3 DAYS`) |
| `Discrepancy` | id, title, priority (`HIGH`\|`MED`\|`LOW`), type (`price`\|`time`\|`qty`), company, poNumber, contactName, contactEmail, detail {leftLabel,left,rightLabel,right,impact}, quotes[{text,author,date,webLink}], status (`open`\|`resolved`\|`dismissed`), deeplink, draftReply {subject, body} | badge = any `open` finding not yet seen this session |
| `OttoScan` | scanId, sourceEmail {sender, senderEmail, subject, receivedDate, badge}, extractedFields {orderNumber, vendor, item, shipDate, shipDateWas, unitPrice, quantity}, destinations[≤3 {id, name, sheetName, editedNote, matchNote, isBestMatch}], status (`scanned`\|`recorded`\|`abandoned`) | record uses **user-edited** fields, never the raw extraction |
| `SetupChecklist` | signedIn (always true post-SSO), erp, otto, invite | progress = done/4 (`checklistProgress.js`) |

Entities are plain objects with factory/validator functions — no classes required, no framework imports.

## 5. Application layer

### Ports (`application/ports/`)

Each port is a JSDoc-typed factory contract; adapters satisfy it structurally (same discipline as Overseer's `ports.go`).

- `OrderRepository` — `list({status?, cursor?})` → `{orders, nextCursor}`; `startSync()` → `{syncId}`; `ensureSubscription()` → `{subscriptionId, expiresAt}`
- `CheckupRepository` — `createFlow(payload)` → `{flowId, checkups[]}`; `list({status?})` → `{checkups[]}`; `updateStatus(checkupId, status)` → row (409/404 mapped to typed errors)
- `DiscrepancyRepository` — `list({status?})` → `{discrepancies[]}`; `updateStatus(id, status)` → row
- `OttoRepository` — `scan({messageId, conversationId})` → `{scanId, extractedFields, destinations}`; `record(scanId, {selectedResource, fields})` → `{webUrl, status}`; `listScans()` → `{scans[]}` *(mock-only until backend adds the listing endpoint — their Otto gap #5)*
- `AuthService` — `signIn()` → `{user, token}`; `getToken()`; `isSignedIn()`
- `EmailContextService` — `getOpenEmail()` → `{messageId, conversationId, sender, senderEmail, subject} | null` (office adapter reads `Office.context.mailbox.item`; mock returns the Maria Chen / PO #4471 email)
- `ComposeService` — `openDraft({to, subject, body})`
- `RealtimeGateway` — `connect(token)`, `on(eventType, handler)`, `disconnect()`; events: `sync.completed`, `order.updated`, `discrepancy.found`
- `StorageService` — `get(key)`, `set(key, value)`, `remove(key)`

### Use cases (`application/usecases/`)

`signIn`, `completeOnboarding` (fires `startSync()` + `ensureSubscription()`, non-blocking — Orders listens for `sync.completed`), `listOrders`, `getOttoScanForOpenEmail`, `listOttoScans`, `recordOttoScan`, `listCheckups` (grouped to flows for the UI), `createCheckupFlow` (expands the form's timing selects into `{repeatFlow, repeatEveryDays, cancelIfReply, sendDate, …}`), `toggleCheckupFlow` (PATCH per affected row — backend has no per-flow PATCH; paused ↔ pending), `saveCheckupStep`/`addCheckupStep` (mock-side flow editing, maps to create/patch), `listDiscrepancies`, `updateDiscrepancyStatus`, `openReplyDraft` (builds pre-addressed draft from the finding), `subscribeToEvents` (wires RealtimeGateway → state dispatches).

All use cases: plain async functions `(ports) => (args) => Result`, returning `{ok: true, data}` or `{ok: false, error: {code, message}}`. No throws across the boundary.

### State machines (`application/machines/`)

**`navigationMachine`** — pure `(state, event) => state`. State shape mirrors the prototype:
`{phase, onb, tab, ottoOld, cuView, auditView, composeOpen, toastVisible, auditSeen, ottoBannerDismissed}`.
Transition table ported from the prototype (dc.html 511-834), including the explicit back-map:
- onboarding: `welcome →(SIGN_IN)→ checklist ↔ connect`, `checklist →(FINISH)→ app/suppliers`
- tabs: `GO_TAB(tab)` resets per-tab view (`otto → ottoOld:'list'`, `checkups → cuView:'list'`, `audit → auditView:'feed'` + `auditSeen:true`)
- audit badge: shown while `phase==='app' && !auditSeen`; set seen on first Audit visit or toast review
- toast: raised by `DISCREPANCY_FOUND` (this gives the prototype's orphaned toast its real trigger), cleared by dismiss/review/tab-change
- back: `{connect→checklist, otto-old reinstruct→list, erp→reinstruct, cu schedule→list, editStep→schedule, add→list, activity→schedule, audit detail→feed}`

**`ottoFlowMachine`** — separate machine for the overlay flow:
`idle → review → (edit ⇄ review) → erp → [erp==='Excel / Sheets' ? files → fileConfirm : ∅] → recording → verify → idle`
- `RECORD` from `erp` branches on the chosen ERP; `files` also accepts `NEW_SHEET` → `recording`
- `recording` is entered when the record call starts; `RECORD_DONE`/`RECORD_FAILED` exits it (mock resolves after 1.7 s to match the prototype's pacing; HTTP resolves on response)
- back-map: `{edit→review, erp→review, files→erp, fileConfirm→files, review→idle}`; nav hidden while overlay ≠ idle
- context carries `{scanId, fields (user-editable), selectedErp, selectedFileIndex, webUrl}`

## 6. Infrastructure

### Mock adapters (`infrastructure/mock/`)

Seeded **verbatim** from the prototype (single source: `mock/seed.js`):

- **Orders (4):** PO #4472 Delmar Tooling `DELAYED` (Est. Jun 28 → Jul 2; Ray: "Confirming a revised lead time shortly." Jun 24) · PO #4471 Acme Steel `ON-TIME` (Est. Jul 2; Maria: "Shipping Jul 2 — one line item back-ordered." Jun 27) · PO #4468 Vance Components `QUOTE PENDING` (Est. Jul 8; You: "Following up on the bracket quote." Jun 25) · PO #4459 Orbit Packaging `DELIVERED` (Delivered Jun 24; Orbit: "Delivered — signed POD attached." Jun 24). Header count string: `10 ACTIVE ORDERS`.
- **Otto:** open-email scan for PO #4471 (Maria Chen / Acme Steel): fields `ORDER # 4471`, `VENDOR Acme Steel`, `ITEM 3/8″ plate × 120`, `SHIP DATE Jul 2` (was Jun 28), `UNIT PRICE $42.50`; destinations: *Acme Steel — 2026 POs.xlsx* (Sheet "Open Orders", edited 2 days ago, BEST MATCH, "Row for PO #4471 already exists") and *Q3 Procurement Tracker.xlsx* (Sheet "Steel Orders", edited Jun 20, "Matched vendor Acme Steel"); file-confirm table row 14: `4471 | 150→120 | Jun 28→{shipDate} | UPD`. Old-email list (3): RE: PO #4471 ship date (DISMISSED, Maria Chen), Quote — bracket assembly (OLDER, Jess Dunn / vancecomp.com), Delivered: order #4459 (OLDER, Tom Silva / orbitpack.com).
- **Check-ups (3 + 1 addable):** Acme Steel PO #4471 (Maria Chen, on, Every 3 days, next Jul 1) · Delmar Tooling PO #4472 (Ray Park, on, Weekly, next Jul 3) · Vance Components PO #4468 (Jess Dunn, off, Paused). Default steps: Initial check ("Hi Maria — any update on the ship date for PO #4471?", Day 0, Always send, Don't repeat, 3 tries) · Follow-up ("Just following up on my note about PO #4471 — thanks!", +3 days, No reply yet, every 3 days, 3 tries) · Final nudge (empty, +3 days, No reply yet, Don't repeat, 1 try). "New check-up" prefills Orbit Packaging / Tom Silva / "Hi Tom — checking in on the status of our latest order. Any update?".
- **Audit (3 findings):** `price` HIGH — Acme Steel PO #4471, QUOTED $41.00 → BILLED $42.50, impact "+$1.50/unit · +$180 on 120 units", evidence May 3 + Jun 27 quotes, draft reply subject "PO #4471 — pricing discrepancy" · `time` MED — CONFIRMED Jun 28 → LATEST Jul 2, "+4 days · no revised PO issued" · `qty` HIGH — Delmar Tooling PO #4472, ORDERED 150 → SHIPPING 120, "30 units unaccounted for". Full evidence/draft bodies copied from the prototype's `findingData`.
- **Mock realtime:** in-memory emitter. `startSync()` emits `sync.completed` after ~1.2 s; a scripted `discrepancy.found` (the price finding) fires ~8 s after first landing on Orders to demo the toast + badge, once per storage lifetime.
- Each mock repo exposes `_failNext(error)` for failure-path tests. Mutations persist through `StorageService`.

### HTTP adapters (`infrastructure/http/`)

`overseerClient.js`: fetch wrapper — base URL from config, `Authorization: Bearer <token>` from `AuthService`, JSON in/out, error mapping `{401→AUTH_EXPIRED, 404→NOT_FOUND, 409→CONFLICT, 400→BAD_REQUEST, 5xx→UPSTREAM}`.

| Port method | HTTP call |
|---|---|
| `OrderRepository.startSync` | `POST /sync` → 202 `{syncId}` |
| `OrderRepository.list` | `GET /orders?cursor=` → `{orders, nextCursor}` |
| `OrderRepository.ensureSubscription` | `POST /subscriptions` → 201 |
| `CheckupRepository.createFlow` | `POST /checkups` `{companyName, emailAddress, subject, body, sendDate, cancelIfReply, repeatFlow, repeatEveryDays, conversationId}` → 201 `{flowId, checkups[]}` |
| `CheckupRepository.list` | `GET /checkups?status=` |
| `CheckupRepository.updateStatus` | `PATCH /checkups/{checkupId}` `{status}` |
| `DiscrepancyRepository.list` | `GET /discrepancies?status=` |
| `DiscrepancyRepository.updateStatus` | `PATCH /discrepancies/{discrepancyId}` `{status}` |
| `OttoRepository.scan` | `POST /otto/scans` `{messageId, conversationId}` → 200 `{scanId, extractedFields, destinations}` (502 → typed UPSTREAM error) |
| `OttoRepository.record` | `POST /otto/scans/{scanId}/record` `{selectedResource, fields}` → 200 `{webUrl, status}` |
| `OttoRepository.listScans` | **no backend endpoint yet** — http adapter returns typed `NOT_IMPLEMENTED`; UI keeps mock behavior meanwhile |
| `RealtimeGateway` | WebSocket `GET /ws`; JSON events `{type, data}`; reconnect with backoff; re-subscribes on reconnect |

### Office adapters (`infrastructure/office/`)

- `officeComposeService`: `Office.context.mailbox.displayNewMessageForm({toRecipients:[to], subject, body})`; if `Office.context.mailbox` unavailable (browser dev), fall back to `window.open('mailto:…')`.
- `officeAuthService` (`auth.mode: 'sso'`): `OfficeRuntime.auth.getAccessToken({allowSignInPrompt: true})` with config `clientId`/`tenantId`; errors fall back to mock sign-in with a console warning. Overseer MVP accepts any bearer, so the token passes through unvalidated for now.
- `mockAuthService` (`auth.mode: 'mock'`, default): `signIn()` resolves instantly with a fake token; the Welcome screen's button works offline.
- `officeEmailContextService`: reads `Office.context.mailbox.item` (`itemId`, `conversationId`, `from`) for Otto scans; returns `null` outside a read surface. Mock counterpart returns the seeded open email.

## 7. Presentation

### Screens (`presentation/screens/`), 1:1 with the prototype

| # | Screen | Prototype ref (dc.html) |
|---|---|---|
| 1 | `WelcomeScreen` (sign-in + WHAT SCOUT DOES) | 96-112 |
| 2 | `ChecklistScreen` (progress bar, 4 items, Go to Scout) | 114-130 |
| 3 | `ConnectErpScreen` (3 radio cards) | 132-144 |
| 4 | `OrdersScreen` (Otto banner + order cards + sort chip) | 146-165 |
| 5-11 | Otto overlay: `OttoReview`, `OttoEdit`, `OttoErp`, `OttoFiles`, `OttoFileConfirm`, `OttoRecording`, `OttoVerify` | 167-277 |
| 12-15 | Otto tab: `OttoOldList`, `OttoReinstruct`, `OttoOldErp`, `OttoRecorded` | 279-337 |
| 16-20 | Check-ups: `CheckupsList`, `CheckupSchedule`, `CheckupEditStep`, `CheckupAdd`, `CheckupActivity` | 339-426 |
| 21-22 | Audit: `AuditFeed`, `AuditDetail` | 428-468 |
| — | Overlays: `AuditToast`, (compose = Office handoff, no in-pane editor) | 474-482 |

Copy strings, element order, and interactions come from the prototype exactly; the design-handoff inventory (screen-by-screen copy) is the acceptance reference.

### Shared components

`PaneHeader` (back chevron / logo / title), `BottomNav` (Orders · Otto · Check-ups · Audit; active = filled circle; red `!` badge on Audit), `Card`, `FieldCard` (mono label + value), `PillTag` (status variants), `Toggle` (26×15 switch), `ErpPicker` (3 radio cards, reused ×3), `AvatarRow` (initials + name + email), `MonoLabel`, `PrimaryButton`/`OutlineButton`/`DashedButton`, `ProgressBar`, `Spinner`, `TokenChips`, `TimingSelects` (the 4 selects), `Compare` (left → right card), `Timeline`.

### Styling

- `tokens.css`: CSS custom properties for the full token set — ink `#141414`, text grays (`#3a3a3a`…`#bbb`), borders (`#e7e7e7`, `#eee`, inputs `#d4d4d4`), fills (`#fafafa`…`#f7f7f7`), alert red `#e0242b`, Excel green `#107c41`; radii 7/8/9/10/999; border styles (1px default, 1.5px emphasis, dashed CTA); shadows; JetBrains Mono label styles (uppercase, letter-spacing .06–.16em, 9–11px).
- Google Fonts `<link>` (Public Sans 400–800, JetBrains Mono 400–600) added to `taskpane.html`.
- Pane is fluid to the real task-pane width; 340px is the design reference width. Custom 6px scrollbar per prototype.
- Icons: extracted from the prototype as JSX components in `presentation/icons/` (compass logo ×2 variants, Microsoft 4-square, ERP glyphs, Excel-green glyph, bolt, clipboard-check, magnifier, cube, clock, pencil, chat, plus, send, check, refresh, external-link, arrow-right).

## 8. Error handling

- Use-case `Result` objects only; screens render inline error rows (mono label, e.g. `COULDN'T LOAD ORDERS — RETRY`) with a retry action. Minimal by intent — the handoff defines no error states.
- `AUTH_EXPIRED` anywhere → session reset to Welcome (state preserved in storage except auth).
- Otto record `CONFLICT` (409 already recorded) → treated as success → Verify screen. `UPSTREAM` (502 scan) → inline retry on the banner/list.
- Checkup PATCH `CONFLICT` → schedule refreshes from repo, brief inline notice.
- RealtimeGateway failures never break screens (events are enhancement; lists load via GET).

## 9. Testing strategy (TDD)

Add: `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `identity-obj-proxy` (CSS mock). `npm test` script. Babel config already compiles JSX.

Layer-mirrored pyramid, red-green-refactor per unit:
1. **Domain rules** — transition tables, timing-line strings, checklist %, status pills.
2. **Machines** — every transition + back-map arrow + branch (Excel vs direct record; badge set/clear; toast raise/clear).
3. **Use cases** — with hand-written in-memory fakes (checkup toggle patches only pending rows; createFlow payload expansion; record sends edited fields, not extraction).
4. **Mock adapters** — seed shape, persistence round-trip, `_failNext`.
5. **HTTP adapters** — fetch-mocked contract tests: exact paths/methods/bodies/auth header; error mapping (401/404/409/502); DTO shape parity with `BE_Docs`.
6. **Screens (RTL)** — rendered through the real container in mock mode: full flows ("Record to Excel / Sheets shows Matching files", "Go to Scout lands on Orders", "audit visit clears badge", "Dismiss PATCHes dismissed", compose fallback invoked with pre-filled draft).

Target: every prototype behavior in §5's machines and §7's screens has at least one test that would fail if the behavior regressed.

## 10. Scaffold changes

- Remove Fluent UI usage (`App.jsx`, `Header.jsx`, `HeroList.jsx`, `TextInsertion.jsx` replaced by the new app; `@fluentui/*` dropped from `package.json`).
- Fix stray diff-header line in `src/commands/commands.html`.
- Add fonts + `<title>Scout</title>` to `taskpane.html`.
- Keep: webpack entries, dev-server (https, port 3000), manifest, commands pipeline, eslint/prettier.
- Initialize git (repo currently has no VCS) — needed for the superpowers TDD/commit workflow.

## 11. Mock-only seams (pending backend)

1. **Otto old/dismissed email list** — needs `GET /otto/scans` (backend Otto gap #5). Mock-driven until then; http adapter returns `NOT_IMPLEMENTED`.
2. **"Record to a new sheet instead"** — no backend support; mock-only, marked in UI code.
3. **NetSuite / QuickBooks record targets** — backend is Excel-first; non-Excel picks complete in mock only. Ports are function-named so real adapters slot in later.
4. **Check-up step editing granularity** — backend rows are messages, not editable steps. Pinned mapping: in mock mode steps edit in place (prototype parity); in http mode `saveCheckupStep`/`addCheckupStep` cancel the flow's remaining `pending` rows (PATCH each) and create a new flow from the edited steps (`POST /checkups`) — all inside the use case, invisible to the UI.
5. **SSO** — waiting on Azure app registration (clientId/tenantId) and the backend's token validation hardening.

## 12. Deliverables

1. The implemented add-in (mock mode default), `npm run dev-server` + sideload works for iterative testing; `npm test` green.
2. This spec + implementation plan under `docs/superpowers/`.
3. **Building journal** in `.claude/Building_Journal/` — in-depth: build narrative (brainstorm → spec → plan → TDD), architecture rationale, decisions + why, deviations, test progression, backend contract mapping, and **emphatically: what's next, what's needed (from Julian/backend: Azure IDs, deploy URL, `GET /otto/scans`, per-flow PATCH), and what was missed** — plus a summary of Loki. Format mirrors the Overseer walkthrough docs (overview / design decisions / where-things-live / flows / gaps / what's next).
