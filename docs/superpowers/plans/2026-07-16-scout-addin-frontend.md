# Scout Add-in Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the Scout Outlook add-in frontend (Orders, Otto-Mode, Check-ups, Audit + first-run) 1:1 from the design handoff, in clean architecture with mock adapters now and Overseer HTTP adapters ready behind a config flag.

**Architecture:** Four layers — `domain` (pure rules) ← `application` (use cases, ports, two pure state machines) ← `infrastructure` (mock/http/office/storage adapters) and `presentation` (React, no router; navigation is state-driven). `config/container.js` is the only file that knows concrete adapters; `dataSource: 'mock'|'http'` picks the set.

**Tech Stack:** React 18 + JavaScript (JSX only, no TS), existing webpack/babel Office scaffold, Jest + jsdom + React Testing Library + user-event, CSS custom properties (no Fluent UI).

**Canonical references (read before implementing a screen):**
- Spec: `docs/superpowers/specs/2026-07-16-scout-addin-frontend-design.md`
- Behavior + markup: `.claude/assets/design_handoff_scout_addin/Scout Prototype.dc.html` (line refs below point here)
- Layout/copy: `.claude/assets/design_handoff_scout_addin/Scout Login Wireframes.dc.html`
- Backend contracts: `BE_Docs/Endpoints/` (Order_List_Sync_Onboading.md, Order_List_Post_Sync_Webhooks, Checkups.md, Thread_Audit.md, Otto.md)

## Global Constraints

- **JS/JSX only** — no `.ts`/`.tsx`; babel presets already handle JSX.
- **Dependency rule:** domain imports nothing; application imports domain only; presentation imports application (+ its own files) only; only `config/container.js` imports infrastructure.
- **New runtime deps: none.** Dev deps added only in Task 1 (jest + testing-library stack).
- **Copy is sacred:** UI strings must match the prototype exactly (tests pin them). Mono labels are uppercase in the DOM via text, not CSS `text-transform` (matches prototype markup).
- **Design tokens:** ink `#141414`; borders `#e7e7e7` (default 1px) / `#141414` 1.5px (emphasis) / `#c4c4c4` dashed (CTA); fills `#fafafa`/`#f6f6f6`/`#f7f7f7`; text grays `#5a5a5a` `#777` `#8a8a8a` `#999` `#bbb`; alert red `#e0242b` (audit only); Excel green `#107c41`; radii 7px buttons/inputs, 8–9px cards, 999px pills; fonts Public Sans (400–800) + JetBrains Mono (400–600, uppercase labels letter-spacing .06–.16em).
- **Persistence key:** all localStorage state under `scout` (single JSON doc), via `StorageService` only.
- **Result convention:** use cases and repos never throw across boundaries; they return `ok(data)` / `err(code, message)` objects (Task 5).
- **Commits:** one per task minimum, message prefix `feat:`/`test:`/`chore:` as shown; every commit ends with the Claude Code trailer.
- **All commands run from the repo root:** `/Users/juliancabrera/Desktop/ThirdEye/Loki FE/Scout`.

## File Structure (target)

```
src/taskpane/
├── domain/rules/            checkupTransitions.js · timingLine.js · orderStatus.js ·
│                            checklistProgress.js · checkupFlows.js
├── application/
│   ├── result.js
│   ├── ports.js             (JSDoc typedefs for every port + DTO shapes)
│   ├── machines/            navigationMachine.js · ottoFlowMachine.js
│   └── usecases/            session.js · orders.js · otto.js · checkups.js · audit.js
├── infrastructure/
│   ├── storage/localStorageService.js
│   ├── mock/                seed.js · mockRepos.js · mockServices.js
│   ├── http/                overseerClient.js · httpRepos.js · wsGateway.js
│   └── office/              officeServices.js
├── config/                  app.config.js · container.js
├── presentation/
│   ├── icons/index.jsx
│   ├── styles/              tokens.css · app.css
│   ├── components/          primitives.jsx · PaneHeader.jsx · BottomNav.jsx
│   ├── screens/             onboarding/ · orders/ · otto/ · checkups/ · audit/
│   └── app/                 AppContext.jsx · useAppController.js · App.jsx
└── index.jsx
tests mirror: src/taskpane/__tests__/<layer>/... (jest picks up *.test.js[x])
```

---

### Task 1: Test harness + scaffold hygiene

**Files:**
- Modify: `package.json` (devDeps + `test` script)
- Create: `jest.config.js`, `jest.setup.js`
- Modify: `src/commands/commands.html` (remove stray first line `@@ -1,18 +0,0 @@`)
- Test: `src/taskpane/__tests__/smoke.test.js`

**Interfaces:**
- Produces: working `npm test` (jest + jsdom + RTL); CSS imports mocked via `identity-obj-proxy`.

- [ ] **Step 1: Install dev dependencies**

```bash
npm install --save-dev jest@^29 jest-environment-jsdom@^29 @testing-library/react@^14 @testing-library/user-event@^14 @testing-library/jest-dom@^6 identity-obj-proxy@^3
```

- [ ] **Step 2: Add jest config + setup**

`jest.config.js`:
```js
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: { "\\.(css|less)$": "identity-obj-proxy" },
  clearMocks: true,
};
```

`jest.setup.js`:
```js
require("@testing-library/jest-dom");
```

Add to `package.json` scripts: `"test": "jest"`.

- [ ] **Step 3: Write smoke test** — `src/taskpane/__tests__/smoke.test.js`:

```js
describe("test harness", () => {
  it("runs jsdom with RTL matchers", () => {
    document.body.innerHTML = "<div>scout</div>";
    expect(document.querySelector("div")).toHaveTextContent("scout");
  });
});
```

- [ ] **Step 4: Run** `npm test` — Expected: 1 suite, 1 test PASS.

- [ ] **Step 5: Fix `src/commands/commands.html`** — delete the stray first line `@@ -1,18 +0,0 @@` (file must start with `<!-- Copyright ... -->`). Run `npm run build:dev` — Expected: webpack exits 0.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: add jest+RTL test harness, fix commands.html artifact"
```

---

### Task 2: Domain rules

**Files:**
- Create: `src/taskpane/domain/rules/checkupTransitions.js`, `timingLine.js`, `orderStatus.js`, `checklistProgress.js`, `checkupFlows.js`
- Test: `src/taskpane/__tests__/domain/rules.test.js`

**Interfaces (Produces):**
- `canTransition(from, to) -> boolean`; `CLIENT_SETTABLE = ["pending","paused","cancelled"]`
- `timingLine(step) -> string` where `step = {send, cond, repeat, stop}`; send ∈ `"day0"|"+1"|"+2"|"+3"|"+5"|"+7"`, cond ∈ `"noreply"|"always"`, repeat ∈ `"none"|"2d"|"3d"|"weekly"`, stop ∈ `"1"|"2"|"3"|"5"`
- `statusLabel(status) -> "DELAYED"|"ON-TIME"|"QUOTE PENDING"|"DELIVERED"`; `pillVariant(status) -> "filled"|"outline"|"dim"`
- `checklistProgress({erp,otto,invite}) -> {done, total: 4, pct, count}` (pct like `"50%"`, count like `"2 / 4"`; done includes the always-true sign-in)
- `groupIntoFlows(flows) -> flows` passthrough helpers: `flowCadenceLabel(flow) -> "Every 3 days"|"Weekly"|"Paused"`, `flowInitials(contactName) -> "MC"`

- [ ] **Step 1: Write failing tests** — `src/taskpane/__tests__/domain/rules.test.js`:

```js
import { canTransition, CLIENT_SETTABLE } from "../../domain/rules/checkupTransitions";
import { timingLine } from "../../domain/rules/timingLine";
import { statusLabel, pillVariant } from "../../domain/rules/orderStatus";
import { checklistProgress } from "../../domain/rules/checklistProgress";
import { flowCadenceLabel, flowInitials } from "../../domain/rules/checkupFlows";

describe("checkupTransitions", () => {
  it.each([
    ["paused", "pending", true], ["pending", "paused", true],
    ["pending", "cancelled", true], ["paused", "cancelled", true],
    ["pending", "pending", true], // same-status no-op success
    ["sent", "pending", false], ["cancelled", "pending", false],
    ["sending", "paused", false], ["pending", "sent", false],
  ])("%s -> %s = %s", (from, to, ok) => expect(canTransition(from, to)).toBe(ok));
  it("clients may only set pending/paused/cancelled", () =>
    expect(CLIENT_SETTABLE).toEqual(["pending", "paused", "cancelled"]));
});

describe("timingLine (prototype dc.html 827-833)", () => {
  it("day 0 always", () =>
    expect(timingLine({ send: "day0", cond: "always", repeat: "none", stop: "3" }))
      .toBe("↻ SENDS DAY 0"));
  it("+3 days if no reply, repeat every 3 days", () =>
    expect(timingLine({ send: "+3", cond: "noreply", repeat: "3d", stop: "3" }))
      .toBe("↻ +3 DAYS IF NO REPLY · EVERY 3 DAYS"));
  it("weekly repeat", () =>
    expect(timingLine({ send: "+7", cond: "noreply", repeat: "weekly", stop: "1" }))
      .toBe("↻ +7 DAYS IF NO REPLY · WEEKLY"));
});

describe("orderStatus", () => {
  it.each([
    ["delayed", "DELAYED", "filled"],
    ["on-time", "ON-TIME", "outline"],
    ["quote-pending", "QUOTE PENDING", "outline"],
    ["delivered", "DELIVERED", "dim"],
  ])("%s", (s, label, variant) => {
    expect(statusLabel(s)).toBe(label);
    expect(pillVariant(s)).toBe(variant);
  });
});

describe("checklistProgress", () => {
  it("sign-in alone = 1/4", () =>
    expect(checklistProgress({ erp: false, otto: false, invite: false }))
      .toEqual({ done: 1, total: 4, pct: "25%", count: "1 / 4" }));
  it("all done = 4/4", () =>
    expect(checklistProgress({ erp: true, otto: true, invite: true }))
      .toEqual({ done: 4, total: 4, pct: "100%", count: "4 / 4" }));
});

describe("checkupFlows", () => {
  it("cadence label", () => {
    expect(flowCadenceLabel({ on: true, cadence: "Every 3 days" })).toBe("Every 3 days");
    expect(flowCadenceLabel({ on: false, cadence: "Every 3 days" })).toBe("Paused");
  });
  it("initials", () => expect(flowInitials("Maria Chen")).toBe("MC"));
});
```

- [ ] **Step 2: Run** `npm test -- domain` — Expected: FAIL (modules not found).

- [ ] **Step 3: Implement** the five rule files:

`checkupTransitions.js`:
```js
export const CLIENT_SETTABLE = ["pending", "paused", "cancelled"];
const TERMINAL = ["sent", "cancelled"];
export function canTransition(from, to) {
  if (from === to) return !TERMINAL.includes(from) && from !== "sending";
  if (from === "sending" || TERMINAL.includes(from)) return false;
  if (to === "cancelled") return true;
  return (from === "paused" && to === "pending") || (from === "pending" && to === "paused");
}
```

`timingLine.js`:
```js
const REPEAT_LABEL = { "2d": "EVERY 2 DAYS", "3d": "EVERY 3 DAYS", weekly: "WEEKLY" };
export function timingLine(step) {
  const base = step.send === "day0" ? "SENDS DAY 0" : `${step.send} DAYS`;
  const cond = step.cond === "noreply" ? " IF NO REPLY" : "";
  const rep = step.repeat !== "none" ? ` · ${REPEAT_LABEL[step.repeat]}` : "";
  return `↻ ${base}${cond}${rep}`;
}
```

`orderStatus.js`:
```js
const MAP = {
  delayed: ["DELAYED", "filled"],
  "on-time": ["ON-TIME", "outline"],
  "quote-pending": ["QUOTE PENDING", "outline"],
  delivered: ["DELIVERED", "dim"],
};
export const statusLabel = (s) => MAP[s][0];
export const pillVariant = (s) => MAP[s][1];
```

`checklistProgress.js`:
```js
export function checklistProgress({ erp, otto, invite }) {
  const done = 1 + [erp, otto, invite].filter(Boolean).length;
  return { done, total: 4, pct: `${done * 25}%`, count: `${done} / 4` };
}
```

`checkupFlows.js`:
```js
export const flowCadenceLabel = (flow) => (flow.on ? flow.cadence : "Paused");
export const flowInitials = (name) =>
  name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
```

⚠️ Before finalizing `timingLine`, open `Scout Prototype.dc.html` lines 827-833 and match its exact output strings; adjust tests+impl together if the prototype differs.

- [ ] **Step 4: Run** `npm test -- domain` — Expected: PASS (all).

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: domain rules (transitions, timing lines, status pills, checklist, flows)"`

---

### Task 3: navigationMachine

**Files:**
- Create: `src/taskpane/application/machines/navigationMachine.js`
- Test: `src/taskpane/__tests__/application/navigationMachine.test.js`

**Interfaces (Produces):**
- `initialNavState` — `{phase:"onboarding", onb:"welcome", erp:"NetSuite", checklist:{erp:false,otto:false,invite:false}, tab:"suppliers", ottoBannerDismissed:false, ottoOld:"list", ottoOldIndex:0, cuView:"list", cuVendor:0, editStepIdx:0, cuAddMode:false, auditView:"feed", findKey:"price", auditSeen:false, toastVisible:false}`
- `navReduce(state, event) -> state` (pure; unknown events return state unchanged)
- Event types: `SIGN_IN, OPEN_CONNECT, PICK_ERP{erp}, CONNECT_CONTINUE, TOGGLE_OTTO, TOGGLE_INVITE, FINISH_ONBOARDING, GO_TAB{tab}, BACK, OTTO_BANNER_DISMISS, OTTO_OLD_OPEN{index}, OTTO_OLD_CONFIRM, OTTO_OLD_RECORD, OTTO_OLD_DONE, CU_OPEN_VENDOR{index}, CU_OPEN_ACTIVITY, CU_EDIT_STEP{stepIndex}, CU_OPEN_ADD, CU_SAVE_STEP, CU_CREATED, CU_ACTIVITY_TO_OTTO, AU_OPEN_FINDING{key}, DISCREPANCY_FOUND{key}, TOAST_DISMISS, TOAST_REVIEW`

Behavior source: prototype dc.html 511-834 (`goTab` 741-747, `back` 749-766, badge rule 819).

- [ ] **Step 1: Write failing tests** — `src/taskpane/__tests__/application/navigationMachine.test.js`:

```js
import { initialNavState as S0, navReduce as r } from "../../application/machines/navigationMachine";

const seq = (state, ...events) => events.reduce((s, e) => r(s, e), state);

describe("onboarding", () => {
  it("welcome -> SIGN_IN -> checklist", () =>
    expect(r(S0, { type: "SIGN_IN" })).toMatchObject({ onb: "checklist" }));
  it("checklist -> connect -> pick erp -> continue marks erp done", () => {
    const s = seq(S0, { type: "SIGN_IN" }, { type: "OPEN_CONNECT" },
      { type: "PICK_ERP", erp: "QuickBooks" }, { type: "CONNECT_CONTINUE" });
    expect(s).toMatchObject({ onb: "checklist", erp: "QuickBooks", checklist: { erp: true } });
  });
  it("BACK from connect returns to checklist", () => {
    const s = seq(S0, { type: "SIGN_IN" }, { type: "OPEN_CONNECT" }, { type: "BACK" });
    expect(s.onb).toBe("checklist");
  });
  it("FINISH_ONBOARDING -> app on suppliers tab", () =>
    expect(seq(S0, { type: "SIGN_IN" }, { type: "FINISH_ONBOARDING" }))
      .toMatchObject({ phase: "app", tab: "suppliers" }));
});

describe("tabs + audit badge (dc.html 741-747, 819)", () => {
  const app = seq(S0, { type: "SIGN_IN" }, { type: "FINISH_ONBOARDING" });
  it("badge shows until audit visited", () => {
    expect(app.auditSeen).toBe(false);
    const s = r(app, { type: "GO_TAB", tab: "audit" });
    expect(s).toMatchObject({ tab: "audit", auditSeen: true, auditView: "feed" });
  });
  it("entering otto/checkups resets their views", () => {
    expect(r(app, { type: "GO_TAB", tab: "otto" }).ottoOld).toBe("list");
    expect(r(app, { type: "GO_TAB", tab: "checkups" }).cuView).toBe("list");
  });
  it("tab change clears toast", () => {
    const s = r({ ...app, toastVisible: true }, { type: "GO_TAB", tab: "otto" });
    expect(s.toastVisible).toBe(false);
  });
});

describe("toast (DISCREPANCY_FOUND is the trigger the prototype lacked)", () => {
  const app = seq(S0, { type: "SIGN_IN" }, { type: "FINISH_ONBOARDING" });
  it("raises toast", () =>
    expect(r(app, { type: "DISCREPANCY_FOUND", key: "price" }).toastVisible).toBe(true));
  it("TOAST_REVIEW -> audit detail of that finding, seen, toast gone", () => {
    const s = seq(app, { type: "DISCREPANCY_FOUND", key: "price" }, { type: "TOAST_REVIEW" });
    expect(s).toMatchObject({ tab: "audit", auditView: "detail", findKey: "price",
      auditSeen: true, toastVisible: false });
  });
  it("TOAST_DISMISS just clears", () =>
    expect(seq(app, { type: "DISCREPANCY_FOUND", key: "qty" }, { type: "TOAST_DISMISS" }))
      .toMatchObject({ toastVisible: false, tab: "suppliers" }));
});

describe("otto-old + checkups + audit sub-navigation and BACK map (dc.html 749-766)", () => {
  const app = seq(S0, { type: "SIGN_IN" }, { type: "FINISH_ONBOARDING" });
  it("otto old: list -> reinstruct -> erp -> recorded -> done -> list", () => {
    let s = r(app, { type: "GO_TAB", tab: "otto" });
    s = r(s, { type: "OTTO_OLD_OPEN", index: 0 });
    expect(s).toMatchObject({ ottoOld: "reinstruct", ottoOldIndex: 0 });
    s = r(s, { type: "OTTO_OLD_CONFIRM" });
    expect(s.ottoOld).toBe("erp");
    s = r(s, { type: "OTTO_OLD_RECORD" });
    expect(s.ottoOld).toBe("recorded");
    s = r(s, { type: "OTTO_OLD_DONE" });
    expect(s.ottoOld).toBe("list");
  });
  it("BACK: erp->reinstruct, reinstruct->list", () => {
    let s = seq(app, { type: "GO_TAB", tab: "otto" },
      { type: "OTTO_OLD_OPEN", index: 1 }, { type: "OTTO_OLD_CONFIRM" });
    s = r(s, { type: "BACK" });
    expect(s.ottoOld).toBe("reinstruct");
    expect(r(s, { type: "BACK" }).ottoOld).toBe("list");
  });
  it("checkups: vendor -> schedule -> editStep -> save -> schedule; activity; add", () => {
    let s = r(app, { type: "GO_TAB", tab: "checkups" });
    s = r(s, { type: "CU_OPEN_VENDOR", index: 1 });
    expect(s).toMatchObject({ cuView: "schedule", cuVendor: 1 });
    s = r(s, { type: "CU_EDIT_STEP", stepIndex: 2 });
    expect(s).toMatchObject({ cuView: "editStep", editStepIdx: 2 });
    expect(r(s, { type: "CU_SAVE_STEP" }).cuView).toBe("schedule");
    expect(r(r(s, { type: "CU_SAVE_STEP" }), { type: "CU_OPEN_ACTIVITY" }).cuView).toBe("activity");
    const add = r(r(app, { type: "GO_TAB", tab: "checkups" }), { type: "CU_OPEN_ADD" });
    expect(add.cuView).toBe("add");
    expect(r(add, { type: "CU_CREATED" }).cuView).toBe("list");
  });
  it("BACK map for checkups: editStep->schedule, activity->schedule, schedule->list, add->list", () => {
    const base = r(app, { type: "GO_TAB", tab: "checkups" });
    const sched = r(base, { type: "CU_OPEN_VENDOR", index: 0 });
    expect(r(r(sched, { type: "CU_EDIT_STEP", stepIndex: 0 }), { type: "BACK" }).cuView).toBe("schedule");
    expect(r(r(sched, { type: "CU_OPEN_ACTIVITY" }), { type: "BACK" }).cuView).toBe("schedule");
    expect(r(sched, { type: "BACK" }).cuView).toBe("list");
    expect(r(r(base, { type: "CU_OPEN_ADD" }), { type: "BACK" }).cuView).toBe("list");
  });
  it("activity -> Send to Otto-Mode jumps tabs", () => {
    const s = seq(app, { type: "GO_TAB", tab: "checkups" }, { type: "CU_OPEN_VENDOR", index: 0 },
      { type: "CU_OPEN_ACTIVITY" }, { type: "CU_ACTIVITY_TO_OTTO" });
    expect(s).toMatchObject({ tab: "otto", ottoOld: "list" });
  });
  it("audit: feed -> detail -> BACK -> feed", () => {
    let s = r(app, { type: "GO_TAB", tab: "audit" });
    s = r(s, { type: "AU_OPEN_FINDING", key: "qty" });
    expect(s).toMatchObject({ auditView: "detail", findKey: "qty" });
    expect(r(s, { type: "BACK" }).auditView).toBe("feed");
  });
});
```

- [ ] **Step 2: Run** `npm test -- navigationMachine` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `src/taskpane/application/machines/navigationMachine.js`:

```js
export const initialNavState = {
  phase: "onboarding", onb: "welcome", erp: "NetSuite",
  checklist: { erp: false, otto: false, invite: false },
  tab: "suppliers", ottoBannerDismissed: false,
  ottoOld: "list", ottoOldIndex: 0,
  cuView: "list", cuVendor: 0, editStepIdx: 0, cuAddMode: false,
  auditView: "feed", findKey: "price", auditSeen: false, toastVisible: false,
};

const TAB_RESET = {
  otto: { ottoOld: "list" },
  checkups: { cuView: "list" },
  audit: { auditView: "feed", auditSeen: true },
  suppliers: {},
};

export function navReduce(s, e) {
  switch (e.type) {
    case "SIGN_IN": return { ...s, onb: "checklist" };
    case "OPEN_CONNECT": return { ...s, onb: "connect" };
    case "PICK_ERP": return { ...s, erp: e.erp };
    case "CONNECT_CONTINUE":
      return { ...s, onb: "checklist", checklist: { ...s.checklist, erp: true } };
    case "TOGGLE_OTTO":
      return { ...s, checklist: { ...s.checklist, otto: !s.checklist.otto } };
    case "TOGGLE_INVITE":
      return { ...s, checklist: { ...s.checklist, invite: !s.checklist.invite } };
    case "FINISH_ONBOARDING": return { ...s, phase: "app", tab: "suppliers" };
    case "GO_TAB":
      return { ...s, tab: e.tab, toastVisible: false, ...TAB_RESET[e.tab] };
    case "OTTO_BANNER_DISMISS": return { ...s, ottoBannerDismissed: true };
    case "OTTO_OLD_OPEN": return { ...s, ottoOld: "reinstruct", ottoOldIndex: e.index };
    case "OTTO_OLD_CONFIRM": return { ...s, ottoOld: "erp" };
    case "OTTO_OLD_RECORD": return { ...s, ottoOld: "recorded" };
    case "OTTO_OLD_DONE": return { ...s, ottoOld: "list" };
    case "CU_OPEN_VENDOR": return { ...s, cuView: "schedule", cuVendor: e.index };
    case "CU_OPEN_ACTIVITY": return { ...s, cuView: "activity" };
    case "CU_EDIT_STEP": return { ...s, cuView: "editStep", editStepIdx: e.stepIndex };
    case "CU_OPEN_ADD": return { ...s, cuView: "add" };
    case "CU_SAVE_STEP": return { ...s, cuView: "schedule" };
    case "CU_CREATED": return { ...s, cuView: "list" };
    case "CU_ACTIVITY_TO_OTTO": return { ...s, tab: "otto", ottoOld: "list" };
    case "AU_OPEN_FINDING": return { ...s, auditView: "detail", findKey: e.key };
    case "DISCREPANCY_FOUND": return { ...s, toastVisible: true, findKey: e.key };
    case "TOAST_DISMISS": return { ...s, toastVisible: false };
    case "TOAST_REVIEW":
      return { ...s, toastVisible: false, tab: "audit", auditView: "detail", auditSeen: true };
    case "BACK": return back(s);
    default: return s;
  }
}

function back(s) {
  if (s.phase === "onboarding") return s.onb === "connect" ? { ...s, onb: "checklist" } : s;
  if (s.tab === "otto") {
    if (s.ottoOld === "erp") return { ...s, ottoOld: "reinstruct" };
    if (s.ottoOld === "reinstruct") return { ...s, ottoOld: "list" };
    return s;
  }
  if (s.tab === "checkups") {
    if (s.cuView === "editStep" || s.cuView === "activity") return { ...s, cuView: "schedule" };
    if (s.cuView === "schedule" || s.cuView === "add") return { ...s, cuView: "list" };
    return s;
  }
  if (s.tab === "audit" && s.auditView === "detail") return { ...s, auditView: "feed" };
  return s;
}
```

- [ ] **Step 4: Run** `npm test -- navigationMachine` — Expected: PASS.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: navigation state machine with prototype-faithful back map"`

---

### Task 4: ottoFlowMachine

**Files:**
- Create: `src/taskpane/application/machines/ottoFlowMachine.js`
- Test: `src/taskpane/__tests__/application/ottoFlowMachine.test.js`

**Interfaces (Produces):**
- `initialOttoState` — `{step:"idle", selectedErp:"NetSuite", selectedFileIndex:0, error:null}`
- `ottoReduce(state, event) -> state`; events: `OPEN_REVIEW, ASK, SAVE_EDIT, CONFIRM, PICK_ERP{erp}, RECORD, PICK_FILE{index}, NEW_SHEET, CONFIRM_FILE, RECORD_DONE, RECORD_FAILED{error}, VERIFY_DONE, BACK`
- `isOverlayActive(state) -> boolean` (step !== "idle"; bottom nav hides while true)
- Excel branch rule: `RECORD` goes to `files` iff `selectedErp === "Excel / Sheets"`, else `recording`.

- [ ] **Step 1: Write failing tests** — `src/taskpane/__tests__/application/ottoFlowMachine.test.js`:

```js
import { initialOttoState as S0, ottoReduce as r, isOverlayActive }
  from "../../application/machines/ottoFlowMachine";

const seq = (s, ...es) => es.reduce((a, e) => r(a, e), s);

describe("otto flow (dc.html 662-680)", () => {
  it("idle -> review; overlay active", () => {
    const s = r(S0, { type: "OPEN_REVIEW" });
    expect(s.step).toBe("review");
    expect(isOverlayActive(s)).toBe(true);
    expect(isOverlayActive(S0)).toBe(false);
  });
  it("review -> ASK -> edit -> SAVE_EDIT -> erp", () => {
    const s = seq(S0, { type: "OPEN_REVIEW" }, { type: "ASK" });
    expect(s.step).toBe("edit");
    expect(r(s, { type: "SAVE_EDIT" }).step).toBe("erp");
  });
  it("review -> CONFIRM -> erp", () =>
    expect(seq(S0, { type: "OPEN_REVIEW" }, { type: "CONFIRM" }).step).toBe("erp"));
  it("RECORD branches: non-Excel goes straight to recording", () => {
    const s = seq(S0, { type: "OPEN_REVIEW" }, { type: "CONFIRM" },
      { type: "PICK_ERP", erp: "QuickBooks" }, { type: "RECORD" });
    expect(s.step).toBe("recording");
  });
  it("RECORD branches: Excel goes to files, then pick -> fileConfirm -> confirm -> recording", () => {
    let s = seq(S0, { type: "OPEN_REVIEW" }, { type: "CONFIRM" },
      { type: "PICK_ERP", erp: "Excel / Sheets" }, { type: "RECORD" });
    expect(s.step).toBe("files");
    s = r(s, { type: "PICK_FILE", index: 1 });
    expect(s).toMatchObject({ step: "fileConfirm", selectedFileIndex: 1 });
    expect(r(s, { type: "CONFIRM_FILE" }).step).toBe("recording");
  });
  it("NEW_SHEET skips fileConfirm (selectedFileIndex 2)", () => {
    const s = seq(S0, { type: "OPEN_REVIEW" }, { type: "CONFIRM" },
      { type: "PICK_ERP", erp: "Excel / Sheets" }, { type: "RECORD" }, { type: "NEW_SHEET" });
    expect(s).toMatchObject({ step: "recording", selectedFileIndex: 2 });
  });
  it("recording -> RECORD_DONE -> verify -> VERIFY_DONE -> idle", () => {
    const s = seq(S0, { type: "OPEN_REVIEW" }, { type: "CONFIRM" },
      { type: "PICK_ERP", erp: "QuickBooks" }, { type: "RECORD" }, { type: "RECORD_DONE" });
    expect(s.step).toBe("verify");
    expect(r(s, { type: "VERIFY_DONE" }).step).toBe("idle");
  });
  it("RECORD_FAILED returns to erp with error", () => {
    const s = seq(S0, { type: "OPEN_REVIEW" }, { type: "CONFIRM" },
      { type: "PICK_ERP", erp: "QuickBooks" }, { type: "RECORD" },
      { type: "RECORD_FAILED", error: { code: "UPSTREAM" } });
    expect(s).toMatchObject({ step: "erp", error: { code: "UPSTREAM" } });
  });
  it("BACK map: edit->review, erp->review, files->erp, fileConfirm->files, review->idle", () => {
    const at = (step) => ({ ...S0, step });
    expect(r(at("edit"), { type: "BACK" }).step).toBe("review");
    expect(r(at("erp"), { type: "BACK" }).step).toBe("review");
    expect(r(at("files"), { type: "BACK" }).step).toBe("erp");
    expect(r(at("fileConfirm"), { type: "BACK" }).step).toBe("files");
    expect(r(at("review"), { type: "BACK" }).step).toBe("idle");
  });
});
```

- [ ] **Step 2: Run** `npm test -- ottoFlowMachine` — Expected: FAIL.

- [ ] **Step 3: Implement** `src/taskpane/application/machines/ottoFlowMachine.js`:

```js
export const initialOttoState = { step: "idle", selectedErp: "NetSuite", selectedFileIndex: 0, error: null };
const BACK = { edit: "review", erp: "review", files: "erp", fileConfirm: "files", review: "idle" };

export const isOverlayActive = (s) => s.step !== "idle";

export function ottoReduce(s, e) {
  switch (e.type) {
    case "OPEN_REVIEW": return { ...s, step: "review", error: null };
    case "ASK": return { ...s, step: "edit" };
    case "SAVE_EDIT": return { ...s, step: "erp" };
    case "CONFIRM": return { ...s, step: "erp" };
    case "PICK_ERP": return { ...s, selectedErp: e.erp };
    case "RECORD":
      return { ...s, step: s.selectedErp === "Excel / Sheets" ? "files" : "recording", error: null };
    case "PICK_FILE": return { ...s, step: "fileConfirm", selectedFileIndex: e.index };
    case "NEW_SHEET": return { ...s, step: "recording", selectedFileIndex: 2 };
    case "CONFIRM_FILE": return { ...s, step: "recording" };
    case "RECORD_DONE": return { ...s, step: "verify" };
    case "RECORD_FAILED":
      return { ...s, step: s.selectedErp === "Excel / Sheets" ? "fileConfirm" : "erp", error: e.error };
    case "VERIFY_DONE": return { ...s, step: "idle" };
    case "BACK": return BACK[s.step] ? { ...s, step: BACK[s.step] } : s;
    default: return s;
  }
}
```

Note: `RECORD_FAILED` from the Excel path returns to `fileConfirm` — except the NEW_SHEET path has no fileConfirm; that still lands on `fileConfirm` which renders fine (Back leads to files). Accepted simplification; the failure test above covers the non-Excel path.

- [ ] **Step 4: Run** `npm test -- ottoFlowMachine` — Expected: PASS.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: otto flow state machine with Excel branch + failure paths"`

---

### Task 5: Result helper, port typedefs, StorageService

**Files:**
- Create: `src/taskpane/application/result.js`, `src/taskpane/application/ports.js`, `src/taskpane/infrastructure/storage/localStorageService.js`
- Test: `src/taskpane/__tests__/application/result.test.js`, `src/taskpane/__tests__/infrastructure/localStorageService.test.js`

**Interfaces (Produces):**
- `ok(data) -> {ok:true, data}` · `err(code, message) -> {ok:false, error:{code, message}}`
- Error codes (constants exported from result.js): `AUTH_EXPIRED, NOT_FOUND, CONFLICT, BAD_REQUEST, UPSTREAM, NOT_IMPLEMENTED, NETWORK`
- `createLocalStorageService() -> {get(key), set(key, value), remove(key)}` — values JSON-serialized under one namespace: actual localStorage key is `` `scout:${key}` ``.
- `ports.js` — JSDoc typedefs only (no runtime exports besides `{}`): `OrderRepository, CheckupRepository, DiscrepancyRepository, OttoRepository, AuthService, EmailContextService, ComposeService, RealtimeGateway, StorageService` with the method signatures from the spec §5.

- [ ] **Step 1: Write failing tests**

`src/taskpane/__tests__/application/result.test.js`:
```js
import { ok, err, CODES } from "../../application/result";
it("ok wraps data", () => expect(ok(5)).toEqual({ ok: true, data: 5 }));
it("err wraps code+message", () =>
  expect(err(CODES.CONFLICT, "already recorded"))
    .toEqual({ ok: false, error: { code: "CONFLICT", message: "already recorded" } }));
```

`src/taskpane/__tests__/infrastructure/localStorageService.test.js`:
```js
import { createLocalStorageService } from "../../infrastructure/storage/localStorageService";
it("round-trips objects under scout: namespace", () => {
  const s = createLocalStorageService();
  s.set("nav", { tab: "audit" });
  expect(JSON.parse(localStorage.getItem("scout:nav"))).toEqual({ tab: "audit" });
  expect(s.get("nav")).toEqual({ tab: "audit" });
  s.remove("nav");
  expect(s.get("nav")).toBeNull();
});
it("get returns null on corrupt json", () => {
  localStorage.setItem("scout:bad", "{nope");
  expect(createLocalStorageService().get("bad")).toBeNull();
});
```

- [ ] **Step 2: Run** `npm test -- result localStorage` — Expected: FAIL.

- [ ] **Step 3: Implement**

`application/result.js`:
```js
export const CODES = Object.freeze({
  AUTH_EXPIRED: "AUTH_EXPIRED", NOT_FOUND: "NOT_FOUND", CONFLICT: "CONFLICT",
  BAD_REQUEST: "BAD_REQUEST", UPSTREAM: "UPSTREAM",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED", NETWORK: "NETWORK",
});
export const ok = (data) => ({ ok: true, data });
export const err = (code, message) => ({ ok: false, error: { code, message } });
```

`infrastructure/storage/localStorageService.js`:
```js
export function createLocalStorageService() {
  const k = (key) => `scout:${key}`;
  return {
    get(key) {
      try { const raw = localStorage.getItem(k(key)); return raw ? JSON.parse(raw) : null; }
      catch { return null; }
    },
    set(key, value) { localStorage.setItem(k(key), JSON.stringify(value)); },
    remove(key) { localStorage.removeItem(k(key)); },
  };
}
```

`application/ports.js`: JSDoc typedefs for all nine ports (copy signatures verbatim from spec §5, e.g.):
```js
/**
 * @typedef {Object} OrderRepository
 * @property {(args?: {status?: string, cursor?: string}) => Promise<Result>} list        // ok: {orders, nextCursor}
 * @property {() => Promise<Result>} startSync                                            // ok: {syncId}
 * @property {() => Promise<Result>} ensureSubscription                                   // ok: {subscriptionId, expiresAt}
 */
// ...same pattern for CheckupRepository (createFlow/list/updateStatus/saveStep/addStep at flow level in mock — see Task 6),
// DiscrepancyRepository, OttoRepository (scan/record/listScans), AuthService (signIn/getToken/isSignedIn),
// EmailContextService (getOpenEmail), ComposeService (openDraft), RealtimeGateway (connect/on/disconnect), StorageService.
export {};
```

- [ ] **Step 4: Run** `npm test -- result localStorage` — Expected: PASS.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: result convention, port typedefs, localStorage service"`

---

### Task 6: Mock seed + mock adapters

**Files:**
- Create: `src/taskpane/infrastructure/mock/seed.js`, `src/taskpane/infrastructure/mock/mockRepos.js`, `src/taskpane/infrastructure/mock/mockServices.js`
- Test: `src/taskpane/__tests__/infrastructure/mockRepos.test.js`

**Interfaces:**
- Consumes: `ok/err/CODES` (Task 5), `canTransition` (Task 2), StorageService shape.
- Produces:
  - `seed` object: `{orders[4], ordersCountLabel:"10 ACTIVE ORDERS", ottoOpenScan, ottoOldEmails[3], checkupFlows[3], newCheckupPrefill, findings{price,time,qty}, openEmail}` — **every value copied verbatim from the prototype** (spec §6 lists them; prototype dc.html: orders 158-161, otto 172-176/218-224/279-337, checks 515-535, findings 557-576, open email 79-81).
  - `createMockRepos(storage) -> {orderRepo, checkupRepo, discrepancyRepo, ottoRepo}` — all methods async, return Results, persist mutations via `storage.set("mockdb", db)`, hydrate from `storage.get("mockdb")` when present. Each repo exposes `_failNext(error)` (next call returns `err`, then auto-resets).
  - `createMockServices(storage) -> {auth, emailContext, realtime}`:
    - `auth.signIn()` → `ok({user:{name:"Operator"}, token:"mock-token"})`, `getToken()` → `"mock-token"`, `isSignedIn()` from storage.
    - `emailContext.getOpenEmail()` → seed.openEmail (Maria Chen, `messageId:"msg-4471"`, `conversationId:"conv-4471"`).
    - `realtime`: `connect()`, `on(type, fn)`, `disconnect()`, plus test/demo helpers `_emit(type, data)`; `orderRepo.startSync()` schedules `sync.completed` after 1200 ms; on first `connect()` per storage lifetime, schedules `discrepancy.found` (price finding) after 8000 ms and sets `storage.set("demoToastFired", true)`.
- Key repo behaviors (all tested):
  - `orderRepo.list()` → 4 seeded orders; `startSync()` → `ok({syncId:"mock-sync-1"})`.
  - `checkupRepo.listFlows()` → 3 flows (Acme on / Delmar on / Vance off, steps = default steps); `setFlowOn(flowId, on)` flips + when turning on from Paused sets `cadence:"Every 3 days"` (prototype toggleCheck 690); `createFlow(input)` appends Orbit Packaging flow; `saveStep/addStep` mutate steps in place (mock-mode parity per spec §11.4).
  - `discrepancyRepo.list()` → 3 open findings; `updateStatus(id,"dismissed")` persists; unknown id → `err(NOT_FOUND)`.
  - `ottoRepo.scan()` → seed.ottoOpenScan (scanId `"scan-4471"`); `record(scanId, {selectedResource, fields})` → after 1700 ms resolves `ok({webUrl:"https://onedrive.live.com/mock/acme-2026-pos", status:"recorded"})`; second record of same scan → `err(CONFLICT)`; `listScans()` → 3 old emails.

- [ ] **Step 1: Write failing tests** — `src/taskpane/__tests__/infrastructure/mockRepos.test.js`:

```js
import { createMockRepos } from "../../infrastructure/mock/mockRepos";
import { createMockServices } from "../../infrastructure/mock/mockServices";

const memStorage = () => {
  const m = new Map();
  return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => m.set(k, v), remove: (k) => m.delete(k) };
};

describe("mock order repo", () => {
  it("lists the 4 seeded orders in prototype order", async () => {
    const { orderRepo } = createMockRepos(memStorage());
    const r = await orderRepo.list();
    expect(r.ok).toBe(true);
    expect(r.data.orders.map((o) => o.poNumber)).toEqual(["PO #4472", "PO #4471", "PO #4468", "PO #4459"]);
    expect(r.data.orders[0]).toMatchObject({ company: "Delmar Tooling", status: "delayed" });
  });
  it("startSync returns syncId", async () => {
    const { orderRepo } = createMockRepos(memStorage());
    expect((await orderRepo.startSync()).data.syncId).toBeDefined();
  });
  it("_failNext makes exactly one call fail", async () => {
    const { orderRepo } = createMockRepos(memStorage());
    orderRepo._failNext({ code: "NETWORK", message: "offline" });
    expect((await orderRepo.list()).ok).toBe(false);
    expect((await orderRepo.list()).ok).toBe(true);
  });
});

describe("mock checkup repo", () => {
  it("seeds 3 flows with default steps", async () => {
    const { checkupRepo } = createMockRepos(memStorage());
    const { data } = await checkupRepo.listFlows();
    expect(data.flows).toHaveLength(3);
    expect(data.flows[0]).toMatchObject({ companyName: "Acme Steel", contactName: "Maria Chen", on: true });
    expect(data.flows[2]).toMatchObject({ companyName: "Vance Components", on: false });
    expect(data.flows[0].steps[0].message).toBe("Hi Maria — any update on the ship date for PO #4471?");
  });
  it("turning a paused flow on sets cadence Every 3 days and persists", async () => {
    const storage = memStorage();
    const { checkupRepo } = createMockRepos(storage);
    const { data } = await checkupRepo.listFlows();
    await checkupRepo.setFlowOn(data.flows[2].flowId, true);
    const again = await createMockRepos(storage).checkupRepo.listFlows();
    expect(again.data.flows[2]).toMatchObject({ on: true, cadence: "Every 3 days" });
  });
  it("createFlow appends the Orbit Packaging flow", async () => {
    const { checkupRepo } = createMockRepos(memStorage());
    await checkupRepo.createFlow({ companyName: "Orbit Packaging", contactName: "Tom Silva",
      emailAddress: "tom@orbitpack.com",
      message: "Hi Tom — checking in on the status of our latest order. Any update?",
      send: "day0", cond: "noreply", repeat: "none", stop: "3" });
    const { data } = await checkupRepo.listFlows();
    expect(data.flows).toHaveLength(4);
    expect(data.flows[3]).toMatchObject({ companyName: "Orbit Packaging", poNumber: "PO #4459", on: true });
  });
});

describe("mock discrepancy repo", () => {
  it("lists price/time/qty findings", async () => {
    const { discrepancyRepo } = createMockRepos(memStorage());
    const { data } = await discrepancyRepo.list();
    expect(data.discrepancies.map((d) => d.type)).toEqual(["price", "time", "qty"]);
    expect(data.discrepancies[0]).toMatchObject({
      title: "Price changed", priority: "HIGH", company: "Acme Steel", poNumber: "PO #4471",
      detail: { left: "$41.00", right: "$42.50", impact: "+$1.50/unit · +$180 on 120 units" },
    });
  });
  it("dismiss persists; unknown id -> NOT_FOUND", async () => {
    const storage = memStorage();
    const { discrepancyRepo } = createMockRepos(storage);
    const { data } = await discrepancyRepo.list();
    await discrepancyRepo.updateStatus(data.discrepancies[0].id, "dismissed");
    const again = await createMockRepos(storage).discrepancyRepo.list({ status: "open" });
    expect(again.data.discrepancies).toHaveLength(2);
    expect((await discrepancyRepo.updateStatus("nope", "resolved")).error.code).toBe("NOT_FOUND");
  });
});

describe("mock otto repo", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it("scan returns the PO #4471 extraction with 2 destinations", async () => {
    const { ottoRepo } = createMockRepos(memStorage());
    const { data } = await ottoRepo.scan({ messageId: "msg-4471", conversationId: "conv-4471" });
    expect(data.extractedFields).toMatchObject({
      orderNumber: "4471", vendor: "Acme Steel", item: "3/8″ plate × 120",
      shipDate: "Jul 2", shipDateWas: "Jun 28", unitPrice: "$42.50" });
    expect(data.destinations[0]).toMatchObject({ name: "Acme Steel — 2026 POs.xlsx", isBestMatch: true });
  });
  it("record resolves after 1.7s; double record -> CONFLICT", async () => {
    const { ottoRepo } = createMockRepos(memStorage());
    const { data } = await ottoRepo.scan({ messageId: "m", conversationId: "c" });
    const p = ottoRepo.record(data.scanId, { selectedResource: "0", fields: data.extractedFields });
    jest.advanceTimersByTime(1700);
    expect((await p).data.webUrl).toMatch(/^https:/);
    const p2 = ottoRepo.record(data.scanId, { selectedResource: "0", fields: data.extractedFields });
    jest.advanceTimersByTime(1700);
    expect((await p2).error.code).toBe("CONFLICT");
  });
});

describe("mock services", () => {
  it("auth mock signs in instantly", async () => {
    const { auth } = createMockServices(memStorage());
    expect((await auth.signIn()).data.token).toBe("mock-token");
  });
  it("emailContext returns the Maria Chen email", async () => {
    const { emailContext } = createMockServices(memStorage());
    expect(await emailContext.getOpenEmail()).toMatchObject({
      sender: "Maria Chen", conversationId: "conv-4471" });
  });
  it("realtime emits to subscribers", () => {
    const { realtime } = createMockServices(memStorage());
    const fn = jest.fn();
    realtime.on("discrepancy.found", fn);
    realtime._emit("discrepancy.found", { key: "price" });
    expect(fn).toHaveBeenCalledWith({ key: "price" });
  });
});
```

- [ ] **Step 2: Run** `npm test -- mockRepos` — Expected: FAIL.

- [ ] **Step 3: Implement** `seed.js` (all prototype values — copy the full finding evidence/draft bodies from dc.html 557-576 including `\n` handling), `mockRepos.js` (single `loadDb(storage)`/`saveDb` around one object `{orders, flows, discrepancies, scans}`; `_failNext` wrapper via a small `failable(fn)` decorator), `mockServices.js`. Follow the exact shapes asserted above. The 1700 ms record delay uses `setTimeout` (tests use fake timers).

- [ ] **Step 4: Run** `npm test -- mockRepos` — Expected: PASS.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: mock adapters seeded verbatim from prototype"`

---

### Task 7: Use cases

**Files:**
- Create: `src/taskpane/application/usecases/session.js`, `orders.js`, `otto.js`, `checkups.js`, `audit.js`
- Test: `src/taskpane/__tests__/application/usecases.test.js`

**Interfaces:**
- Consumes: ports (Task 5 shapes), mock adapters only inside tests (Task 6).
- Produces (each factory takes the ports it needs and returns bound functions):
  - `createSessionUsecases({auth, orderRepo, realtime, storage})` → `{signIn(), completeOnboarding(), restoreSession(), resetSession()}`
    - `completeOnboarding()`: fire-and-forget `orderRepo.startSync()` + `orderRepo.ensureSubscription()`; returns `ok({})` even if either fails (Orders shows cached/mock list regardless; realtime `sync.completed` triggers refetch).
  - `createOrderUsecases({orderRepo})` → `{listOrders({status?})}`
  - `createOttoUsecases({ottoRepo, emailContext})` → `{scanOpenEmail(), listOldScans(), recordScan(scanId, {selectedResource, fields})}` — `recordScan` passes the **caller-supplied edited fields**, never re-reads the stored extraction.
  - `createCheckupUsecases({checkupRepo})` → `{listFlows(), createFlow(input), toggleFlow(flowId, on), saveStep(flowId, stepIndex, step), addStep(flowId)}`
  - `createAuditUsecases({discrepancyRepo, compose})` → `{listFindings({status?}), setFindingStatus(id, status), openReplyDraft(finding)}` — `openReplyDraft` calls `compose.openDraft({to: finding.contactEmail, subject: finding.draftReply.subject, body: finding.draftReply.body})`.
  - `createRealtimeUsecases({realtime, auth})` → `{start(handlers)}` — connects with token, wires `{onSyncCompleted, onOrderUpdated, onDiscrepancyFound}`.

- [ ] **Step 1: Write failing tests** — `src/taskpane/__tests__/application/usecases.test.js` (uses tiny hand fakes, not the mock adapters):

```js
import { createSessionUsecases } from "../../application/usecases/session";
import { createOttoUsecases } from "../../application/usecases/otto";
import { createCheckupUsecases } from "../../application/usecases/checkups";
import { createAuditUsecases } from "../../application/usecases/audit";
import { ok, err, CODES } from "../../application/result";

it("completeOnboarding fires sync + subscription and succeeds even if sync fails", async () => {
  const calls = [];
  const orderRepo = {
    startSync: async () => { calls.push("sync"); return err(CODES.NETWORK, "down"); },
    ensureSubscription: async () => { calls.push("sub"); return ok({}); },
  };
  const uc = createSessionUsecases({ auth: {}, orderRepo, realtime: {}, storage: { set() {}, get: () => null } });
  expect((await uc.completeOnboarding()).ok).toBe(true);
  expect(calls).toEqual(["sync", "sub"]);
});

it("scanOpenEmail feeds the open email ids to the repo", async () => {
  let seen;
  const uc = createOttoUsecases({
    ottoRepo: { scan: async (args) => { seen = args; return ok({ scanId: "s1" }); } },
    emailContext: { getOpenEmail: async () => ({ messageId: "m1", conversationId: "c1" }) },
  });
  await uc.scanOpenEmail();
  expect(seen).toEqual({ messageId: "m1", conversationId: "c1" });
});

it("scanOpenEmail with no open email -> NOT_FOUND", async () => {
  const uc = createOttoUsecases({ ottoRepo: {}, emailContext: { getOpenEmail: async () => null } });
  expect((await uc.scanOpenEmail()).error.code).toBe("NOT_FOUND");
});

it("recordScan sends caller-edited fields verbatim", async () => {
  let sent;
  const uc = createOttoUsecases({
    ottoRepo: { record: async (id, body) => { sent = { id, body }; return ok({ webUrl: "u" }); } },
    emailContext: {},
  });
  await uc.recordScan("s1", { selectedResource: "0", fields: { shipDate: "Jul 9 (edited)" } });
  expect(sent.body.fields.shipDate).toBe("Jul 9 (edited)");
});

it("toggleFlow delegates to repo", async () => {
  let got;
  const uc = createCheckupUsecases({ checkupRepo: { setFlowOn: async (id, on) => { got = [id, on]; return ok({}); } } });
  await uc.toggleFlow("f1", false);
  expect(got).toEqual(["f1", false]);
});

it("openReplyDraft builds the compose payload from the finding", async () => {
  let draft;
  const uc = createAuditUsecases({
    discrepancyRepo: {},
    compose: { openDraft: async (d) => { draft = d; return ok({}); } },
  });
  await uc.openReplyDraft({ contactEmail: "maria@acmesteel.com",
    draftReply: { subject: "PO #4471 — pricing discrepancy", body: "Hi Maria,\n\nQuick flag…" } });
  expect(draft).toMatchObject({ to: "maria@acmesteel.com", subject: "PO #4471 — pricing discrepancy" });
});
```

- [ ] **Step 2: Run** `npm test -- usecases` — Expected: FAIL.

- [ ] **Step 3: Implement** the five files. Every function: try the port call, pass Results through untouched, add `err(CODES.NOT_FOUND, "no open email")` guard in `scanOpenEmail`, wrap thrown exceptions with `err(CODES.NETWORK, e.message)`. `session.js` also implements `restoreSession()` (reads `storage.get("session")`) and `resetSession()`; `signIn()` stores `{signedIn: true}` on success.

- [ ] **Step 4: Run** `npm test -- usecases` — Expected: PASS.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: application use cases over ports"`

---

### Task 8: HTTP adapters + WebSocket gateway

**Files:**
- Create: `src/taskpane/infrastructure/http/overseerClient.js`, `httpRepos.js`, `wsGateway.js`
- Test: `src/taskpane/__tests__/infrastructure/httpRepos.test.js`

**Interfaces:**
- Consumes: `ok/err/CODES` (Task 5); config shape `{apiBaseUrl, wsUrl}`; `auth.getToken()`.
- Produces:
  - `createOverseerClient({baseUrl, getToken})` → `{get(path), post(path, body), patch(path, body)}` — JSON, `Authorization: Bearer <token>`, maps status → codes: 401→AUTH_EXPIRED, 404→NOT_FOUND, 409→CONFLICT, 400→BAD_REQUEST, ≥500→UPSTREAM, fetch-throw→NETWORK. Success → `ok(json)` (202/201 included).
  - `createHttpRepos(client) -> {orderRepo, checkupRepo, discrepancyRepo, ottoRepo}` — same port surface as Task 6 mocks. Endpoint map (BE_Docs):
    - orders: `POST /sync` · `GET /orders` (`?cursor=` when given) · `POST /subscriptions`
    - checkups: `listFlows` = `GET /checkups` + `groupRowsToFlows(rows)`; `createFlow` = `POST /checkups` with `{companyName, emailAddress, subject, body, sendDate, cancelIfReply, repeatFlow, repeatEveryDays, conversationId}` derived via `stepToCadence` (`cond:"noreply"`→`cancelIfReply:true`; `repeat:"3d"`+`stop:"3"`→`repeatFlow:3, repeatEveryDays:3`; `repeat:"none"`→`repeatFlow:1`, omit `repeatEveryDays`); `setFlowOn` = PATCH **each** row of the flow whose status is `pending`↔`paused` (no per-flow PATCH in backend); `saveStep/addStep` = PATCH-cancel remaining pending rows + `POST /checkups` new flow (spec §11.4).
    - discrepancies: `GET /discrepancies?status=` · `PATCH /discrepancies/{id}`
    - otto: `POST /otto/scans` · `POST /otto/scans/{id}/record` · `listScans()` → `err(NOT_IMPLEMENTED, "GET /otto/scans not yet in Overseer")`
  - `createWsGateway({wsUrl, getToken})` — RealtimeGateway port over `WebSocket`; parses `{type, data}` JSON; `on(type, fn)` registry; reconnect with capped exponential backoff (1s→30s); `disconnect()` stops reconnecting.

- [ ] **Step 1: Write failing tests** — `src/taskpane/__tests__/infrastructure/httpRepos.test.js` (mock `global.fetch`):

```js
import { createOverseerClient } from "../../infrastructure/http/overseerClient";
import { createHttpRepos } from "../../infrastructure/http/httpRepos";

const jsonRes = (status, body) => Promise.resolve({
  ok: status < 400, status, json: () => Promise.resolve(body) });
const makeClient = () => createOverseerClient({ baseUrl: "https://api.test", getToken: () => "tok-1" });

beforeEach(() => { global.fetch = jest.fn(); });

it("sends bearer auth and parses success", async () => {
  fetch.mockReturnValue(jsonRes(200, { orders: [], nextCursor: null }));
  const r = await makeClient().get("/orders");
  expect(fetch).toHaveBeenCalledWith("https://api.test/orders", expect.objectContaining({
    headers: expect.objectContaining({ Authorization: "Bearer tok-1" }) }));
  expect(r).toEqual({ ok: true, data: { orders: [], nextCursor: null } });
});

it.each([[401, "AUTH_EXPIRED"], [404, "NOT_FOUND"], [409, "CONFLICT"], [400, "BAD_REQUEST"], [502, "UPSTREAM"]])(
  "maps %s -> %s", async (status, code) => {
    fetch.mockReturnValue(jsonRes(status, {}));
    expect((await makeClient().get("/x")).error.code).toBe(code);
  });

it("fetch throw -> NETWORK", async () => {
  fetch.mockRejectedValue(new Error("offline"));
  expect((await makeClient().get("/x")).error.code).toBe("NETWORK");
});

it("otto record posts edited fields to the right path", async () => {
  fetch.mockReturnValue(jsonRes(200, { webUrl: "https://1drv.ms/x", status: "recorded" }));
  const { ottoRepo } = createHttpRepos(makeClient());
  await ottoRepo.record("scan-9", { selectedResource: "res-1", fields: { shipDate: "Jul 9" } });
  const [url, init] = fetch.mock.calls[0];
  expect(url).toBe("https://api.test/otto/scans/scan-9/record");
  expect(JSON.parse(init.body)).toEqual({ selectedResource: "res-1", fields: { shipDate: "Jul 9" } });
});

it("otto listScans -> NOT_IMPLEMENTED (backend gap #5)", async () => {
  const { ottoRepo } = createHttpRepos(makeClient());
  expect((await ottoRepo.listScans()).error.code).toBe("NOT_IMPLEMENTED");
});

it("createFlow maps UI step to Overseer cadence payload", async () => {
  fetch.mockReturnValue(jsonRes(201, { flowId: "f1", checkups: [] }));
  const { checkupRepo } = createHttpRepos(makeClient());
  await checkupRepo.createFlow({
    companyName: "Orbit Packaging", emailAddress: "tom@orbitpack.com", contactName: "Tom Silva",
    message: "Hi Tom — checking in on the status of our latest order. Any update?",
    conversationId: "conv-4459", send: "day0", cond: "noreply", repeat: "3d", stop: "3" });
  const body = JSON.parse(fetch.mock.calls[0][1].body);
  expect(body).toMatchObject({ companyName: "Orbit Packaging", cancelIfReply: true,
    repeatFlow: 3, repeatEveryDays: 3, conversationId: "conv-4459" });
  expect(body.sendDate).toBeDefined();
});

it("setFlowOn PATCHes every pending row of the flow", async () => {
  fetch
    .mockReturnValueOnce(jsonRes(200, { checkups: [
      { id: "r1", flowId: "f1", status: "pending" },
      { id: "r2", flowId: "f1", status: "pending" },
      { id: "r3", flowId: "f2", status: "pending" }] }))
    .mockReturnValue(jsonRes(200, {}));
  const { checkupRepo } = createHttpRepos(makeClient());
  await checkupRepo.setFlowOn("f1", false);
  const patched = fetch.mock.calls.slice(1).map(([u]) => u);
  expect(patched).toEqual(["https://api.test/checkups/r1", "https://api.test/checkups/r2"]);
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ status: "paused" });
});
```

- [ ] **Step 2: Run** `npm test -- httpRepos` — Expected: FAIL.

- [ ] **Step 3: Implement** the three files per the Interfaces block. `groupRowsToFlows`: group by `flowId`, derive `{companyName, emailAddress, on: rows.some(r => r.status === "pending"), cadence}`. `wsGateway` guards `typeof WebSocket === "undefined"` (no-ops, warns once) so http mode still works without ws in tests.

- [ ] **Step 4: Run** `npm test -- httpRepos` — Expected: PASS.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: Overseer HTTP adapters + ws gateway against documented contracts"`

---

### Task 9: Office adapters + config + container

**Files:**
- Create: `src/taskpane/infrastructure/office/officeServices.js`, `src/taskpane/config/app.config.js`, `src/taskpane/config/container.js`
- Test: `src/taskpane/__tests__/infrastructure/officeServices.test.js`, `src/taskpane/__tests__/config/container.test.js`

**Interfaces:**
- Produces:
  - `createOfficeComposeService()` — `openDraft({to, subject, body})`: if `window.Office?.context?.mailbox?.displayNewMessageForm` exists → call it with `{toRecipients:[to], subject, htmlBody: body.replace(/\n/g, "<br>")}` → `ok({via:"office"})`; else `window.open("mailto:...?subject=...&body=..." )` (URL-encoded) → `ok({via:"mailto"})`.
  - `createOfficeEmailContextService()` — `getOpenEmail()`: reads `Office.context.mailbox.item` (`itemId`, `conversationId`, `from.displayName`, `from.emailAddress`, `subject`), null when absent.
  - `createOfficeAuthService({clientId, tenantId, fallback})` — `signIn()`: try `OfficeRuntime.auth.getAccessToken({allowSignInPrompt:true})`; on any error, `console.warn` + delegate to `fallback.signIn()` (mock). `getToken()` returns last token or fallback's.
  - `app.config.js`:
    ```js
    export const appConfig = {
      dataSource: "mock",                       // 'mock' | 'http'
      apiBaseUrl: "https://localhost:8080",     // Overseer — set when deployed
      wsUrl: "wss://localhost:8080/ws",
      auth: { mode: "mock", clientId: "00000000-0000-0000-0000-000000000000", tenantId: "common" },
    };
    ```
  - `buildContainer(config)` → `{repos, services, usecases}` with `usecases = {session, orders, otto, checkups, audit, realtime}` fully wired; `dataSource: "mock"` → mock repos/services; `"http"` → http repos + wsGateway + office services (auth mode still respected).

- [ ] **Step 1: Write failing tests**

`officeServices.test.js`:
```js
import { createOfficeComposeService, createOfficeEmailContextService }
  from "../../infrastructure/office/officeServices";

afterEach(() => { delete global.Office; });

it("uses displayNewMessageForm when Office mailbox exists", async () => {
  const spy = jest.fn();
  global.Office = { context: { mailbox: { displayNewMessageForm: spy } } };
  const r = await createOfficeComposeService().openDraft({ to: "a@b.com", subject: "S", body: "L1\nL2" });
  expect(spy).toHaveBeenCalledWith({ toRecipients: ["a@b.com"], subject: "S", htmlBody: "L1<br>L2" });
  expect(r.data.via).toBe("office");
});

it("falls back to mailto without Office", async () => {
  const open = jest.spyOn(window, "open").mockImplementation(() => null);
  const r = await createOfficeComposeService().openDraft({ to: "a@b.com", subject: "S", body: "B" });
  expect(open).toHaveBeenCalledWith(expect.stringContaining("mailto:a@b.com?subject=S&body=B"));
  expect(r.data.via).toBe("mailto");
});

it("email context maps mailbox.item and returns null when absent", async () => {
  global.Office = { context: { mailbox: { item: { itemId: "m1", conversationId: "c1",
    from: { displayName: "Maria Chen", emailAddress: "maria@acmesteel.com" }, subject: "RE: PO" } } } };
  expect(await createOfficeEmailContextService().getOpenEmail()).toEqual({
    messageId: "m1", conversationId: "c1", sender: "Maria Chen",
    senderEmail: "maria@acmesteel.com", subject: "RE: PO" });
  delete global.Office;
  expect(await createOfficeEmailContextService().getOpenEmail()).toBeNull();
});
```

`container.test.js`:
```js
import { buildContainer } from "../../config/container";

it("mock container wires end-to-end (sign in, list orders)", async () => {
  const c = buildContainer({ dataSource: "mock", auth: { mode: "mock" } });
  expect((await c.usecases.session.signIn()).ok).toBe(true);
  const r = await c.usecases.orders.listOrders();
  expect(r.data.orders).toHaveLength(4);
});

it("http container uses fetch-backed repos", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200,
    json: async () => ({ orders: [], nextCursor: null }) });
  const c = buildContainer({ dataSource: "http", apiBaseUrl: "https://api.x", wsUrl: "wss://api.x/ws",
    auth: { mode: "mock" } });
  await c.usecases.orders.listOrders();
  expect(fetch).toHaveBeenCalledWith("https://api.x/orders", expect.anything());
});
```

- [ ] **Step 2: Run** `npm test -- officeServices container` — Expected: FAIL.

- [ ] **Step 3: Implement.** In `container.js`, mock mode uses mock emailContext/compose (compose logs + returns `ok({via:"mock"})`... **no** — mock mode still uses `createOfficeComposeService()` so compose works in Outlook even while data is mock; only auth/email-context/data follow `dataSource`. Wait: emailContext in mock mode must return the seeded email so Otto works in a browser. Decision (final): mock mode → office compose service with mailto fallback + mock emailContext + mock auth; http mode → office compose + office emailContext + auth per `auth.mode`.

- [ ] **Step 4: Run** `npm test -- officeServices container` — Expected: PASS.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: office adapters, app config, composition root"`

---

### Task 10: Styles, icons, shared primitives

**Files:**
- Create: `src/taskpane/presentation/styles/tokens.css`, `src/taskpane/presentation/styles/app.css`, `src/taskpane/presentation/icons/index.jsx`, `src/taskpane/presentation/components/primitives.jsx`
- Modify: `src/taskpane/taskpane.html` (fonts + title)
- Test: `src/taskpane/__tests__/presentation/primitives.test.jsx`

**Interfaces (Produces):**
- `icons/index.jsx` exports (all `({size, stroke}) => <svg…>`; extract path data from the prototype at the dc.html lines in parentheses): `CompassLogo` (99), `CompassMark` (89), `MicrosoftGlyph` (102), `BoltIcon` (151), `CalendarCheckIcon` (107), `MagnifierIcon` (490), `PeopleIcon` (109), `CheckIcon` (121), `NetSuiteGlyph`/`QuickBooksGlyph`/`ExcelGridGlyph` (137-139), `ExcelGreenGlyph` (213), `ClockIcon` (158), `PencilIcon` (175), `ChatIcon` (179), `PlusIcon` (343), `SendIcon` (503), `RefreshIcon` (445), `CubeIcon` (487), `ClipboardCheckIcon` (489), `ExternalLinkIcon` (464), `ArrowRightIcon` (454), `ChevronLeftIcon` (header), `DollarCircleIcon` (437), `EnvelopeOpenIcon` (422)
- `primitives.jsx` exports:
  - `Card({children, emphasis, onClick, className})` — 1px `#e7e7e7` border, 9px radius; `emphasis` → 1.5px `#141414`
  - `MonoLabel({children})` — JetBrains Mono 10px uppercase letter-spacing .08em `#8a8a8a`
  - `PillTag({variant, children})` — variant `filled|outline|dim` (Task 2 `pillVariant`)
  - `PrimaryButton / OutlineButton / DashedButton({children, onClick, icon, disabled})`
  - `Toggle({on, onChange, ariaLabel})` — 26×15 pill, `role="switch"`, `aria-checked`
  - `FieldCard({label, value, trailing, onClick})` — mono label + 13px value row
  - `ErpPicker({selected, onPick})` — the 3 radio cards (NetSuite / QuickBooks / Excel / Sheets) with glyphs; selected = 1.5px border + filled dot; fires `onPick(erpName)` with the exact string `"Excel / Sheets"` etc.
  - `AvatarRow({initials, name, sub})` · `ProgressBar({pct})` · `Spinner()` (scoutspin animation) · `Compare({leftLabel, left, rightLabel, right, impact})` · `TokenChips()` (static `+ {vendor} + {order #} + {ship date}`) · `TimingSelects({value, onChange, firstLabel})` — the 4 selects with option sets from dc.html 383-388 (`Send this step|Send first message`: Day 0/+1 day/+2 days/+3 days/+5 days/+7 days · `Only if`: No reply yet/Always send · `Repeat every`: Don't repeat/2 days/3 days/Weekly · `Stop after`: 1 try/2 tries/3 tries/5 tries) mapping to `{send, cond, repeat, stop}` codes from Task 2
- `tokens.css` — CSS custom properties, complete:

```css
:root {
  --ink: #141414; --text: #3a3a3a; --text-2: #5a5a5a; --text-3: #777;
  --text-4: #8a8a8a; --text-5: #999; --placeholder: #bbb;
  --border: #e7e7e7; --border-2: #ececec; --border-input: #d4d4d4; --border-dash: #c4c4c4;
  --fill: #fafafa; --fill-2: #f6f6f6; --fill-3: #f7f7f7; --avatar: #e6e6e6;
  --alert: #e0242b; --excel: #107c41; --surface: #fff;
  --r-btn: 7px; --r-card: 9px; --r-pane: 10px; --r-pill: 999px;
  --font-ui: "Public Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --shadow-card: 0 1px 2px rgba(0,0,0,.04);
}
```

- `app.css` — base layout (`.pane`, `.pane-header` 46px, `.pane-body` scroll + 6px scrollbar, `.bottom-nav` 4 items + active circle + red `!` badge, `@keyframes scoutspin`) plus primitive classes. For screen-specific styling, copy the inline styles from the prototype at each screen's line refs — the prototype IS the stylesheet source; translate inline styles to classes as screens are built (Tasks 11-16 may append to app.css).
- `taskpane.html`: replace title with `<title>Scout</title>`, add
  `<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />`

- [ ] **Step 1: Write failing tests** — `primitives.test.jsx`:

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PillTag, Toggle, ErpPicker, TimingSelects } from "../../presentation/components/primitives";

it("PillTag renders label", () => {
  render(<PillTag variant="filled">DELAYED</PillTag>);
  expect(screen.getByText("DELAYED")).toBeInTheDocument();
});

it("Toggle is an accessible switch", async () => {
  const fn = jest.fn();
  render(<Toggle on={false} onChange={fn} ariaLabel="Acme Steel check-up" />);
  const sw = screen.getByRole("switch", { name: "Acme Steel check-up" });
  expect(sw).toHaveAttribute("aria-checked", "false");
  await userEvent.click(sw);
  expect(fn).toHaveBeenCalledWith(true);
});

it("ErpPicker lists the 3 systems and reports picks verbatim", async () => {
  const fn = jest.fn();
  render(<ErpPicker selected="NetSuite" onPick={fn} />);
  expect(screen.getByText("NetSuite")).toBeInTheDocument();
  expect(screen.getByText("QuickBooks")).toBeInTheDocument();
  await userEvent.click(screen.getByText("Excel / Sheets"));
  expect(fn).toHaveBeenCalledWith("Excel / Sheets");
});

it("TimingSelects exposes the 4 prototype selects", () => {
  render(<TimingSelects value={{ send: "day0", cond: "noreply", repeat: "none", stop: "3" }}
    onChange={() => {}} firstLabel="Send this step" />);
  expect(screen.getByLabelText("Send this step")).toHaveValue("day0");
  expect(screen.getByLabelText("Only if")).toHaveValue("noreply");
  expect(screen.getByLabelText("Repeat every")).toHaveValue("none");
  expect(screen.getByLabelText("Stop after")).toHaveValue("3");
});
```

- [ ] **Step 2: Run** `npm test -- primitives` — Expected: FAIL.
- [ ] **Step 3: Implement** tokens.css, app.css baseline, icons (read the actual `<svg>` markup from the prototype lines listed above — do not invent paths), primitives.jsx, taskpane.html edits.
- [ ] **Step 4: Run** `npm test -- primitives` — Expected: PASS. Also `npm run build:dev` — Expected: exit 0.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: design tokens, prototype icons, shared UI primitives"`

---

### Task 11: App shell, controller hook, onboarding screens

**Files:**
- Create: `src/taskpane/presentation/app/AppContext.jsx`, `useAppController.js`, `App.jsx`, `src/taskpane/presentation/components/PaneHeader.jsx`, `BottomNav.jsx`, `src/taskpane/presentation/screens/onboarding/WelcomeScreen.jsx`, `ChecklistScreen.jsx`, `ConnectErpScreen.jsx`
- Modify: `src/taskpane/index.jsx` (mount new App with container; delete Fluent imports)
- Test: `src/taskpane/__tests__/presentation/onboarding.test.jsx`

**Interfaces:**
- Consumes: machines (Tasks 3-4), container (Task 9), primitives/icons (Task 10).
- Produces:
  - `useAppController(container)` → `{nav, otto, data, actions}`:
    - `nav`/`otto`: machine states via `useReducer`; nav persisted to `storage.set("nav", …)` on change, restored on init (merge over `initialNavState`).
    - `data`: `{orders, ordersLoading, flows, findings, oldScans, scan, session}` loaded lazily per tab via use cases.
    - `actions`: `signIn, openConnect, pickErp, connectContinue, toggleOtto, toggleInvite, finishOnboarding` (calls `usecases.session.completeOnboarding()` then dispatch), `goTab, back, dismissBanner, ottoReview` (calls `usecases.otto.scanOpenEmail()`, stores scan, dispatches OPEN_REVIEW), `ottoAsk, ottoSaveEdit, ottoConfirm, ottoPickErp, ottoRecord` (dispatch RECORD; if non-Excel → immediately calls `usecases.otto.recordScan` and dispatches RECORD_DONE/RECORD_FAILED on settle), `ottoPickFile, ottoNewSheet, ottoConfirmFile` (both also trigger recordScan), `ottoVerifyDone, ottoEditField(name, value)` (updates `data.scan.fields`), old-scan actions, checkup actions, audit actions (`openFinding, dismissFinding, resolveFromCompose, openReply, rerunAudits`), `toastDismiss, toastReview`.
    - `useEffect` once: `usecases.realtime.start({ onSyncCompleted: refetchOrders, onOrderUpdated: patchOrder, onDiscrepancyFound: (f) => { upsertFinding(f); dispatch({type:"DISCREPANCY_FOUND", key: f.type}); } })`.
  - `App.jsx` render map (single switch, no router):
    - `phase==='onboarding'`: onb → Welcome/Checklist/ConnectErp
    - otto overlay active (`isOverlayActive(otto)`) → OttoReview/OttoEdit/OttoErp/OttoFiles/OttoFileConfirm/OttoRecording/OttoVerify by `otto.step`
    - else by `nav.tab`: suppliers→OrdersScreen · otto→OttoOldList/OttoReinstruct/OttoOldErp/OttoRecorded by `nav.ottoOld` · checkups→CheckupsList/CheckupSchedule/CheckupEditStep/CheckupAdd/CheckupActivity by `nav.cuView` · audit→AuditFeed/AuditDetail by `nav.auditView`
    - `PaneHeader` gets `{title, showBack, showLogo}` from the **title map** (prototype renderVals 588-612): default `"Scout"`+logo; connect `"Connect your ERP"`+back; review `"Found in this email"`+back; edit `"Edit details"`+back; erp (both flows) `"Where to record"`+back; files `"Matching files"`+back; fileConfirm `"Continue editing"`+back; reinstruct `"Re-run on this email"`+back; cu schedule → order po (e.g. `"PO #4471"`)+back; editStep `"Edit step"`+back; add `"New check-up"`+back; activity `` `${po} · activity` ``+back; audit detail → finding title+back; recording/verify `"Scout"` no back.
    - `BottomNav` shown iff `phase==='app' && !isOverlayActive(otto)`; items Orders/Otto/Check-ups/Audit; red `!` badge on Audit iff `!nav.auditSeen`.
  - Screens (copy from wireframes + dc.html 96-144): Welcome — compass logo, H1 `Welcome to Scout`, body `Let's get you set up — it takes about a minute. Sign in to start, then skim what Scout does below.`, button `Sign in with Microsoft`, `WHAT SCOUT DOES` + 4 feature rows (`Otto-Mode` / `Reads emails, drafts ERP updates for your OK.` · `Check-ups` / `Scheduled check-up emails to every vendor.` · `Thread Audit` / `Flags price, date & item discrepancies, live.` · `Team Threads` / `Share threads & doc access across the team.`). Checklist — H1 `Finish setting up`, sub `A few quick steps to get the most out of Scout.`, ProgressBar + count, 4 rows (`Sign in with Microsoft` pre-checked strikethrough · `Connect your ERP`/`Sync orders to NetSuite, QuickBooks…` · `Turn on Otto-Mode`/`Let Scout read & draft updates` · `Invite your team`/`Share threads & documents`), button `Go to Scout`, footer `You can finish these anytime from Settings.` ConnectErp — body `Pick where Scout writes order data. Otto-Mode and Check-ups use this connection.`, ErpPicker, button `Connect & continue`.

- [ ] **Step 1: Write failing tests** — `onboarding.test.jsx` (full-flow through real mock container):

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../presentation/app/App";
import { buildContainer } from "../../config/container";

const renderApp = () => {
  localStorage.clear();
  return render(<App container={buildContainer({ dataSource: "mock", auth: { mode: "mock" } })} />);
};

it("first run shows Welcome with the four feature rows", () => {
  renderApp();
  expect(screen.getByText("Welcome to Scout")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Sign in with Microsoft/ })).toBeInTheDocument();
  expect(screen.getByText("WHAT SCOUT DOES")).toBeInTheDocument();
  expect(screen.getByText("Reads emails, drafts ERP updates for your OK.")).toBeInTheDocument();
});

it("sign in -> checklist; ERP connect flow marks step done and bumps progress", async () => {
  renderApp();
  await userEvent.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  expect(screen.getByText("Finish setting up")).toBeInTheDocument();
  expect(screen.getByText("1 / 4")).toBeInTheDocument();
  await userEvent.click(screen.getByText("Connect your ERP"));
  expect(screen.getByText("Pick where Scout writes order data. Otto-Mode and Check-ups use this connection.")).toBeInTheDocument();
  await userEvent.click(screen.getByText("QuickBooks"));
  await userEvent.click(screen.getByRole("button", { name: "Connect & continue" }));
  expect(screen.getByText("2 / 4")).toBeInTheDocument();
});

it("Go to Scout lands on Orders with bottom nav", async () => {
  renderApp();
  await userEvent.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  await userEvent.click(screen.getByRole("button", { name: "Go to Scout" }));
  expect(await screen.findByText("Orders")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Check-ups/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Audit/ })).toBeInTheDocument();
});

it("session persists across remount (localStorage nav)", async () => {
  const { unmount } = renderApp();
  await userEvent.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  await userEvent.click(screen.getByRole("button", { name: "Go to Scout" }));
  unmount();
  render(<App container={buildContainer({ dataSource: "mock", auth: { mode: "mock" } })} />);
  expect(await screen.findByText("Orders")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run** `npm test -- onboarding` — Expected: FAIL.
- [ ] **Step 3: Implement** controller/context/App/PaneHeader/BottomNav + 3 onboarding screens. `index.jsx` becomes:

```jsx
import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./presentation/app/App";
import { buildContainer } from "./config/container";
import { appConfig } from "./config/app.config";
import "./presentation/styles/tokens.css";
import "./presentation/styles/app.css";

const container = buildContainer(appConfig);
const root = createRoot(document.getElementById("container"));
const mount = () => root.render(<App container={container} />);
if (typeof Office !== "undefined" && Office.onReady) Office.onReady(mount); else mount();
```

(The `else mount()` keeps plain-browser testing working; office.js CDN script stays in taskpane.html.)

- [ ] **Step 4: Run** `npm test -- onboarding` — Expected: PASS. Then `npm test` — all suites PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: app shell, controller, onboarding flow (welcome/checklist/connect)"`

---

### Task 12: Orders screen + Otto banner + realtime updates

**Files:**
- Create: `src/taskpane/presentation/screens/orders/OrdersScreen.jsx`, `OrderCard.jsx`, `OttoBanner.jsx`
- Modify: `src/taskpane/presentation/app/App.jsx` (route suppliers tab), `useAppController.js` (orders loading + realtime patch)
- Test: `src/taskpane/__tests__/presentation/orders.test.jsx`

**Interfaces:**
- Consumes: `data.orders` + `actions.ottoReview/dismissBanner` (Task 11), `statusLabel/pillVariant` (Task 2), seed shapes (Task 6).
- Produces: `OrdersScreen` (prototype dc.html 146-165): OttoBanner (when open-email scan available and `!nav.ottoBannerDismissed`) → header row `Orders` + mono `10 ACTIVE ORDERS` + chip `Sort: Status ▾` (static) → one `OrderCard` per order (PO + PillTag + vendor + clock line + quoted last message + date).

- [ ] **Step 1: Write failing tests** — `orders.test.jsx` (helper `renderAppAtOrders()` = sign in + Go to Scout, reused via a small `testUtils.jsx` you create alongside):

```jsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAppAtOrders } from "./testUtils";

it("renders header, count, and the 4 seeded order cards in order", async () => {
  await renderAppAtOrders();
  expect(screen.getByText("10 ACTIVE ORDERS")).toBeInTheDocument();
  const cards = screen.getAllByTestId("order-card");
  expect(cards).toHaveLength(4);
  expect(within(cards[0]).getByText("PO #4472")).toBeInTheDocument();
  expect(within(cards[0]).getByText("DELAYED")).toBeInTheDocument();
  expect(within(cards[0]).getByText("Est. Jun 28 → Jul 2")).toBeInTheDocument();
  expect(within(cards[1]).getByText("ON-TIME")).toBeInTheDocument();
  expect(within(cards[1]).getByText(/Shipping Jul 2 — one line item back-ordered/)).toBeInTheDocument();
  expect(within(cards[3]).getByText("DELIVERED")).toBeInTheDocument();
});

it("shows the Otto banner with detected copy; Dismiss hides it persistently", async () => {
  await renderAppAtOrders();
  expect(await screen.findByText("New order info detected")).toBeInTheDocument();
  expect(screen.getByText("5 fields ready to record")).toBeInTheDocument();
  expect(screen.getByText(/Scout found order details in the open email from Maria Chen/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(screen.queryByText("New order info detected")).toBeNull();
});

it("Review & insert opens the Otto review overlay and hides bottom nav", async () => {
  await renderAppAtOrders();
  await userEvent.click(await screen.findByRole("button", { name: "Review & insert" }));
  expect(await screen.findByText("Found in this email")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Check-ups/ })).toBeNull();
});

it("orders load failure renders inline retry state that recovers (spec §8)", async () => {
  const { __lastContainer, renderAppSignedIn } = await import("./testUtils");
  // renderAppSignedIn: like renderAppAtOrders but injects failure BEFORE landing on Orders:
  // sign in on Welcome, call container.repos.orderRepo._failNext({code:"NETWORK", message:"offline"}),
  // then click "Go to Scout".
  await renderAppSignedIn();
  expect(await screen.findByText("COULDN'T LOAD ORDERS — RETRY")).toBeInTheDocument();
  await userEvent.click(screen.getByText("COULDN'T LOAD ORDERS — RETRY"));
  expect(await screen.findByText("10 ACTIVE ORDERS")).toBeInTheDocument();
});
```

`testUtils.jsx`:
```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../presentation/app/App";
import { buildContainer } from "../../config/container";

export async function renderAppAtOrders() {
  localStorage.clear();
  const utils = render(<App container={buildContainer({ dataSource: "mock", auth: { mode: "mock" } })} />);
  await userEvent.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  await userEvent.click(screen.getByRole("button", { name: "Go to Scout" }));
  await screen.findByText("10 ACTIVE ORDERS");
  return utils;
}
```

- [ ] **Step 2: Run** `npm test -- orders` — Expected: FAIL.
- [ ] **Step 3: Implement** the three components; controller loads orders on entering app phase, exposes `data.openScanAvailable` (from `usecases.otto.scanOpenEmail()` pre-check in mock = seeded email present). Banner copy: title `New order info detected`, sub `5 fields ready to record`, body `Scout found order details in the open email from Maria Chen.`, buttons `Dismiss` / `Review & insert` (dc.html 149-155). Realtime: `order.updated` patches the matching order card in place (find by `conversationId`, replace).
- [ ] **Step 4: Run** `npm test -- orders` — Expected: PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: orders screen with otto banner and realtime patching"`

---

### Task 13: Otto overlay (7 screens)

**Files:**
- Create: `src/taskpane/presentation/screens/otto/OttoReview.jsx`, `OttoEdit.jsx`, `OttoErp.jsx`, `OttoFiles.jsx`, `OttoFileConfirm.jsx`, `OttoRecording.jsx`, `OttoVerify.jsx`
- Modify: `App.jsx` (overlay routing), `useAppController.js` (record wiring)
- Test: `src/taskpane/__tests__/presentation/ottoOverlay.test.jsx`

**Interfaces:**
- Consumes: `otto` machine state + actions (Task 11), scan data from `data.scan` (`{scanId, extractedFields, destinations}`), primitives.
- Produces: the 7 overlay screens, copy per prototype dc.html 167-277:
  - **Review** (`Found in this email`): helper `Check what Scout pulled out. Tap any field to edit.`; FieldCards `ORDER # 4471`, `VENDOR Acme Steel`, `ITEM 3/8″ plate × 120`, `SHIP DATE {shipDate}` + pill `was Jun 28` + pencil (→ edit), `UNIT PRICE $42.50`; buttons `Ask Scout` (→ edit) + `Confirm` (→ erp).
  - **Edit** (`Edit details`): assistant bubble `I read the ship date as Jul 2 from "we can ship… on Jul 2." Edit it below or tell me what to change.`; labeled input `SHIP DATE` bound to `data.scan.extractedFields.shipDate` via `actions.ottoEditField("shipDate", v)`; helper `Type a new date — it updates the field you'll record.`; button `Save & continue` (→ erp).
  - **Erp** (`Where to record`): H `Which system should I update?`; sub `Scout will write Order #4471 and its 5 fields here.`; ErpPicker; button `Record to {selectedErp}` → `actions.ottoRecord()`.
  - **Files** (`Matching files`): mono `MICROSOFT EXCEL` (green); H `I found where this belongs`; sub `Scout searched your connected Excel files and found sheets already tracking Order #4471 · Acme Steel.`; mono `FILES FOUND`; destination cards from `data.scan.destinations` (name, `Sheet "{sheetName}" · {editedNote}`, `BEST MATCH` badge, match row); dashed button `Record to a new sheet instead`.
  - **FileConfirm** (`Continue editing`): file header (name + sheet); H `Continue editing this sheet`; sub `Scout will keep your sheet's exact structure — updating the existing PO #4471 row in place. No new columns, no new tabs.`; mono `WHAT CHANGES · ROW 14`; mini table `PO # | QTY | SHIP DATE | STATUS` row `4471 | 150→120 | Jun 28→{shipDate} | UPD` (old values struck through); note `Same columns, formatting & formulas preserved`; buttons `Back` + `Continue & update sheet`.
  - **Recording**: Spinner; H `Recording to {selectedErp}…`; sub `Scout is reading the email and writing the order data. This takes a moment.`; 3 checklist rows (`Read the email` ✓, `Extracted order data` ✓, `Writing to {selectedErp}…` spinner).
  - **Verify**: big check; H `Recorded — please verify`; sub `Scout updated {selectedErp}. Open it to confirm everything looks right.`; card `Order #4471` + pill `UPDATED`; rows `Ship date {shipDate}` / `Quantity 120 units` / `Unit price $42.50`; button `Verify & done` — when `data.recordResult.webUrl` exists the card links to it (`<a href={webUrl} target="_blank">`).
- Controller record wiring (from Task 11 interfaces): `ottoRecord`/`ottoConfirmFile`/`ottoNewSheet` dispatch machine event, call `usecases.otto.recordScan(scanId, {selectedResource, fields: data.scan.extractedFields})` where `selectedResource` = destination id (or `"new-sheet"`), then dispatch `RECORD_DONE` (store `webUrl`) or `RECORD_FAILED`.

- [ ] **Step 1: Write failing tests** — `ottoOverlay.test.jsx`:

```jsx
import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAppAtOrders } from "./testUtils";

jest.useFakeTimers();
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

async function openReview() {
  await renderAppAtOrders();
  await user.click(await screen.findByRole("button", { name: "Review & insert" }));
  await screen.findByText("Found in this email");
}

it("review shows the 5 extracted fields", async () => {
  await openReview();
  expect(screen.getByText("ORDER #")).toBeInTheDocument();
  expect(screen.getByText("4471")).toBeInTheDocument();
  expect(screen.getByText("3/8″ plate × 120")).toBeInTheDocument();
  expect(screen.getByText("was Jun 28")).toBeInTheDocument();
  expect(screen.getByText("$42.50")).toBeInTheDocument();
});

it("editing the ship date flows into file-confirm table", async () => {
  await openReview();
  await user.click(screen.getByRole("button", { name: "Ask Scout" }));
  const input = screen.getByLabelText("SHIP DATE");
  await user.clear(input);
  await user.type(input, "Jul 9");
  await user.click(screen.getByRole("button", { name: "Save & continue" }));
  await user.click(screen.getByText("Excel / Sheets"));
  await user.click(screen.getByRole("button", { name: "Record to Excel / Sheets" }));
  await screen.findByText("I found where this belongs");
  await user.click(screen.getByText("Acme Steel — 2026 POs.xlsx"));
  expect(await screen.findByText("Continue editing this sheet")).toBeInTheDocument();
  expect(screen.getByText("Jul 9")).toBeInTheDocument();
});

it("non-Excel skips files: recording then verify", async () => {
  await openReview();
  await user.click(screen.getByRole("button", { name: "Confirm" }));
  await user.click(screen.getByText("QuickBooks"));
  await user.click(screen.getByRole("button", { name: "Record to QuickBooks" }));
  expect(screen.getByText("Recording to QuickBooks…")).toBeInTheDocument();
  await act(async () => { jest.advanceTimersByTime(1700); });
  expect(await screen.findByText("Recorded — please verify")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Verify & done" }));
  expect(await screen.findByText("10 ACTIVE ORDERS")).toBeInTheDocument();
  expect(screen.queryByText("New order info detected")).toBeNull(); // banner dismissed after verify
});

it("full Excel path reaches verify with sheet link", async () => {
  await openReview();
  await user.click(screen.getByRole("button", { name: "Confirm" }));
  await user.click(screen.getByText("Excel / Sheets"));
  await user.click(screen.getByRole("button", { name: "Record to Excel / Sheets" }));
  await user.click(await screen.findByText("Acme Steel — 2026 POs.xlsx"));
  await user.click(screen.getByRole("button", { name: "Continue & update sheet" }));
  await act(async () => { jest.advanceTimersByTime(1700); });
  expect(await screen.findByText("Recorded — please verify")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run** `npm test -- ottoOverlay` — Expected: FAIL.
- [ ] **Step 3: Implement** the 7 screens + controller wiring. `OTTO_BANNER_DISMISS` is also dispatched on `VERIFY_DONE` (prototype `ottoVerifyDone` sets `ottoBannerDismissed:true`).
- [ ] **Step 4: Run** `npm test -- ottoOverlay` — Expected: PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: otto overlay flow (review->edit->erp->files->confirm->recording->verify)"`

---

### Task 14: Otto tab (old/dismissed emails, 4 screens)

**Files:**
- Create: `src/taskpane/presentation/screens/otto/OttoOldList.jsx`, `OttoReinstruct.jsx`, `OttoOldErp.jsx`, `OttoRecorded.jsx`
- Modify: `App.jsx`, `useAppController.js`
- Test: `src/taskpane/__tests__/presentation/ottoTab.test.jsx`

**Interfaces:**
- Consumes: `nav.ottoOld` states + `OTTO_OLD_*` events (Task 3), `data.oldScans` via `usecases.otto.listOldScans()` (mock-only seam — spec §11.1), primitives.
- Produces (prototype dc.html 279-337):
  - **OttoOldList**: H `Otto-Mode`; sub `Older & dismissed emails Scout can still record — no need to dig them up yourself.`; 3 cards (subject + status pill + summary + avatar/name/email + `Record` button): `RE: PO #4471 ship date`/`DISMISSED`/`Ship date moved to Jul 2 with a new unit price — order update.`/Maria Chen · maria@acmesteel.com — `Quote — bracket assembly`/`OLDER`/Jess Dunn · jess@vancecomp.com — `Delivered: order #4459`/`OLDER`/Tom Silva · tom@orbitpack.com.
  - **OttoReinstruct** (`Re-run on this email`): pill `DISMISSED JUN 20 · RE-OPENED`; FROM row (Maria Chen · Acme Steel · maria@acmesteel.com); helper `Scout re-read the email. Confirm what to record, or tell Otto what to change.`; FieldCards `ORDER # 4471`, `SHIP DATE Jul 2`, `UNIT PRICE $42.50`; button `Confirm & record`.
  - **OttoOldErp** (`Where to record`): H `Which system should I update?`; sub `Scout will write Order #4471 from this older email here.`; ErpPicker; button `Record to {erp}`.
  - **OttoRecorded**: big check; H `Added from older email`; sub `Scout recorded this dismissed email to {erp}. Verify it looks right.`; card `Order #4471` + `UPDATED`; rows `Source Dismissed · Jun 20` / `Ship date Jul 2`; button `Verify & done` → list.

- [ ] **Step 1: Write failing tests** — `ottoTab.test.jsx`:

```jsx
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAppAtOrders } from "./testUtils";

async function gotoOttoTab() {
  await renderAppAtOrders();
  await userEvent.click(screen.getByRole("button", { name: /^Otto$/ }));
  await screen.findByText("Otto-Mode");
}

it("lists the 3 old/dismissed emails", async () => {
  await gotoOttoTab();
  expect(screen.getByText("RE: PO #4471 ship date")).toBeInTheDocument();
  expect(screen.getByText("DISMISSED")).toBeInTheDocument();
  expect(screen.getAllByText("OLDER")).toHaveLength(2);
  expect(screen.getByText("jess@vancecomp.com")).toBeInTheDocument();
});

it("record flow: reinstruct -> erp -> recorded -> done back to list", async () => {
  await gotoOttoTab();
  await userEvent.click(screen.getAllByRole("button", { name: "Record" })[0]);
  expect(await screen.findByText("DISMISSED JUN 20 · RE-OPENED")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Confirm & record" }));
  expect(await screen.findByText("Scout will write Order #4471 from this older email here.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Record to NetSuite" }));
  expect(await screen.findByText("Added from older email")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Verify & done" }));
  expect(await screen.findByText("Otto-Mode")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run** `npm test -- ottoTab` — Expected: FAIL.
- [ ] **Step 3: Implement.** Note the old-flow "Record to X" completes without the files branch (prototype parity: old flow goes straight to recorded, dc.html 308-337 — no files step, no timer screen).
- [ ] **Step 4: Run** `npm test -- ottoTab` — Expected: PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: otto tab old-email record flow"`

---

### Task 15: Check-ups (5 screens)

**Files:**
- Create: `src/taskpane/presentation/screens/checkups/CheckupsList.jsx`, `CheckupSchedule.jsx`, `CheckupEditStep.jsx`, `CheckupAdd.jsx`, `CheckupActivity.jsx`
- Modify: `App.jsx`, `useAppController.js`
- Test: `src/taskpane/__tests__/presentation/checkups.test.jsx`

**Interfaces:**
- Consumes: `nav.cuView/cuVendor/editStepIdx` + `CU_*` events (Task 3), checkup use cases (Task 7), `timingLine`/`flowCadenceLabel`/`flowInitials` (Task 2), `TimingSelects`/`TokenChips`/`Toggle` (Task 10).
- Produces (prototype dc.html 339-426):
  - **CheckupsList**: H `Check-ups`; mono `{n} ACTIVE · BY ORDER`; button `Add check-up`; per flow: order # (opens schedule) + Toggle, AvatarRow (contact · vendor, email), cadence line `⏱ {cadence} · next {next}` or `Paused`; card dimmed when off.
  - **CheckupSchedule** (title = po, e.g. `PO #4471`): contact card + chip `ACTIVITY`; header `Schedule` + mono `{steps} STEPS · {cadence}`; numbered steps with `Edit` buttons + quoted message + mono timing line (from `timingLine`); dashed `Add a step`.
  - **CheckupEditStep** (`Edit step`): mono `MESSAGE`; textarea bound to draft; TokenChips; mono `REPETITION & RELAY TIMING`; TimingSelects (firstLabel `Send this step`); buttons `Cancel` + `Save step`.
  - **CheckupAdd** (`New check-up`): mono `VENDOR` → card `Orbit Packaging ▾`; mono `WHO YOU'RE EMAILING` → `TS · Tom Silva · tom@orbitpack.com ▾`; mono `FIRST MESSAGE` → textarea prefilled `Hi Tom — checking in on the status of our latest order. Any update?`; TokenChips + TimingSelects (firstLabel `Send first message`); button `Create & turn on`.
  - **CheckupActivity** (title `` `${po} · activity` ``): contact card + pill `REPLIED`; timeline: `Initial check sent` ("Any update on the ship date for PO #4471?", `JUN 24 · 9:00 AM`) → `Follow-up sent` (`No reply after 3 days — auto follow-up.`, `JUN 27 · 9:00 AM`) → `Maria Chen replied` (bubble `Shipping Jul 2 — one line item was back-ordered.`, `JUN 27 · 2:14 PM · CHECK PAUSED`); button `Send to Otto-Mode` → otto tab.

- [ ] **Step 1: Write failing tests** — `checkups.test.jsx`:

```jsx
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAppAtOrders } from "./testUtils";

async function gotoCheckups() {
  await renderAppAtOrders();
  await userEvent.click(screen.getByRole("button", { name: /Check-ups/ }));
  await screen.findByText("2 ACTIVE · BY ORDER");
}

it("lists 3 flows with toggles; Vance is paused", async () => {
  await gotoCheckups();
  expect(screen.getByText("Maria Chen")).toBeInTheDocument();
  expect(screen.getByText("⏱ Every 3 days · next Jul 1")).toBeInTheDocument();
  expect(screen.getByText("Paused")).toBeInTheDocument();
  const switches = screen.getAllByRole("switch");
  expect(switches).toHaveLength(3);
  expect(switches[2]).toHaveAttribute("aria-checked", "false");
});

it("toggling Vance on updates cadence to Every 3 days", async () => {
  await gotoCheckups();
  await userEvent.click(screen.getAllByRole("switch")[2]);
  expect(await screen.findByText("3 ACTIVE · BY ORDER")).toBeInTheDocument();
  expect(screen.getAllByText(/Every 3 days/).length).toBeGreaterThanOrEqual(2);
});

it("schedule shows 3 default steps with timing lines; edit step round-trip", async () => {
  await gotoCheckups();
  await userEvent.click(screen.getByText("PO #4471"));
  expect(await screen.findByText("3 STEPS · Every 3 days")).toBeInTheDocument();
  expect(screen.getByText("↻ SENDS DAY 0")).toBeInTheDocument();
  expect(screen.getByText("↻ +3 DAYS IF NO REPLY · EVERY 3 DAYS")).toBeInTheDocument();
  await userEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
  const box = await screen.findByRole("textbox");
  expect(box).toHaveValue("Hi Maria — any update on the ship date for PO #4471?");
  await userEvent.clear(box);
  await userEvent.type(box, "Hola Maria — status?");
  await userEvent.click(screen.getByRole("button", { name: "Save step" }));
  expect(await screen.findByText(/Hola Maria — status\?/)).toBeInTheDocument();
});

it("new check-up prefills Orbit Packaging and creates 4th flow", async () => {
  await gotoCheckups();
  await userEvent.click(screen.getByRole("button", { name: "Add check-up" }));
  expect(await screen.findByRole("textbox"))
    .toHaveValue("Hi Tom — checking in on the status of our latest order. Any update?");
  await userEvent.click(screen.getByRole("button", { name: "Create & turn on" }));
  expect(await screen.findByText("3 ACTIVE · BY ORDER")).toBeInTheDocument();
  expect(screen.getByText("tom@orbitpack.com")).toBeInTheDocument();
});

it("activity timeline + Send to Otto-Mode jumps tab", async () => {
  await gotoCheckups();
  await userEvent.click(screen.getByText("PO #4471"));
  await userEvent.click(await screen.findByText("ACTIVITY"));
  expect(await screen.findByText("Initial check sent")).toBeInTheDocument();
  expect(screen.getByText("Shipping Jul 2 — one line item was back-ordered.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Send to Otto-Mode" }));
  expect(await screen.findByText("Otto-Mode")).toBeInTheDocument();
});
```

Note: `2 ACTIVE · BY ORDER` because seeds have 2 flows on (Acme, Delmar), Vance off.

- [ ] **Step 2: Run** `npm test -- checkups` — Expected: FAIL.
- [ ] **Step 3: Implement.** Activity content is static seed data attached to the Acme flow (`flow.activity` array in seed.js) — prototype shows it only for the selected vendor. Controller: `saveStep` writes drafts through `usecases.checkups.saveStep`, then refetches flows.
- [ ] **Step 4: Run** `npm test -- checkups` — Expected: PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: check-ups list/schedule/edit/add/activity"`

---

### Task 16: Audit (feed, detail, toast, compose handoff)

**Files:**
- Create: `src/taskpane/presentation/screens/audit/AuditFeed.jsx`, `AuditDetail.jsx`, `src/taskpane/presentation/components/AuditToast.jsx`
- Modify: `App.jsx`, `useAppController.js`
- Test: `src/taskpane/__tests__/presentation/audit.test.jsx`

**Interfaces:**
- Consumes: `nav.auditView/findKey/auditSeen/toastVisible` (Task 3), audit use cases incl. `openReplyDraft` (Task 7), findings seed (Task 6).
- Produces (prototype dc.html 428-482):
  - **AuditFeed**: H `Audit`; mono `LIVE · MONITORING 8 ORDERS`; pill `● ON` (red dot); info card `Catching discrepancies before they reach your books — automatically.`; mono `RECENT FINDINGS`; groups: `PO #4471 · ACME STEEL · 14 MSGS` → `Price changed` `$41.00 → $42.50 / unit` badge `HIGH`, `Ship date slipped` `Jun 28 → Jul 2` badge `MED`; `PO #4472 · DELMAR TOOLING · 9 MSGS` → `Quantity mismatch` `150 → 120 units` badge `HIGH`; outline button `Re-run audits` (refetches findings).
  - **AuditDetail** (title = finding title): contact header (`{po} · {vendor}` / `{contact} · {email}`, mono `IN THREAD`); `Compare` card (labels/values/impact from finding.detail); mono `EVIDENCE FROM THREAD` + 2 quote cards (2nd emphasized); mono `DRAFT A REPLY`; helper `Scout has a reply ready. Click the address to open it in Outlook — review & send from there.`; black button = contact email + external-link icon → `actions.openReply(finding)`; `Dismiss` button → PATCH `dismissed` + back to feed.
  - **AuditToast** (rendered above nav when `toastVisible`): red dot + mono `AUDIT ALERT · NOW`; H `Discrepancy found`; body `PO #4471 · Acme Steel — quoted $41.00, latest bills $42.50/unit.`; buttons `Dismiss` + `Review finding`.
  - Nav badge: red `!` on Audit item while `!auditSeen` (Task 11 BottomNav already renders it; this task's tests pin clearing).

- [ ] **Step 1: Write failing tests** — `audit.test.jsx`:

```jsx
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAppAtOrders } from "./testUtils";

async function gotoAudit() {
  await renderAppAtOrders();
  await userEvent.click(screen.getByRole("button", { name: /Audit/ }));
  await screen.findByText("LIVE · MONITORING 8 ORDERS");
}

it("badge shows before visiting audit and clears after", async () => {
  await renderAppAtOrders();
  expect(screen.getByTestId("audit-badge")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Audit/ }));
  await screen.findByText("LIVE · MONITORING 8 ORDERS");
  expect(screen.queryByTestId("audit-badge")).toBeNull();
});

it("feed groups findings by order", async () => {
  await gotoAudit();
  expect(screen.getByText("PO #4471 · ACME STEEL · 14 MSGS")).toBeInTheDocument();
  expect(screen.getByText("Price changed")).toBeInTheDocument();
  expect(screen.getByText("$41.00 → $42.50 / unit")).toBeInTheDocument();
  expect(screen.getAllByText("HIGH")).toHaveLength(2);
  expect(screen.getByText("Quantity mismatch")).toBeInTheDocument();
});

it("detail shows compare card, evidence, and email CTA; dismiss removes finding", async () => {
  await gotoAudit();
  await userEvent.click(screen.getByText("Price changed"));
  expect(await screen.findByText("+$1.50/unit · +$180 on 120 units")).toBeInTheDocument();
  expect(screen.getByText(/happy to hold pricing at \$41\.00 per unit/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /maria@acmesteel\.com/ })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(await screen.findByText("LIVE · MONITORING 8 ORDERS")).toBeInTheDocument();
  expect(screen.queryByText("Price changed")).toBeNull();
});

it("email CTA opens compose with the drafted reply (mailto fallback in jsdom)", async () => {
  const open = jest.spyOn(window, "open").mockImplementation(() => null);
  await gotoAudit();
  await userEvent.click(screen.getByText("Ship date slipped"));
  await userEvent.click(await screen.findByRole("button", { name: /maria@acmesteel\.com/ }));
  expect(open).toHaveBeenCalledWith(expect.stringContaining("mailto:maria@acmesteel.com"));
  expect(open.mock.calls[0][0]).toContain(encodeURIComponent("PO #4471 — ship date moved"));
});

it("realtime discrepancy raises the toast; Review finding deep-links", async () => {
  await renderAppAtOrders();
  const { act } = await import("@testing-library/react");
  const { __lastContainer } = await import("./testUtils");
  act(() => __lastContainer().services.realtime._emit("discrepancy.found",
    { type: "price", title: "Price changed" }));
  expect(await screen.findByText("Discrepancy found")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Review finding" }));
  expect(await screen.findByText("+$1.50/unit · +$180 on 120 units")).toBeInTheDocument();
});
```

(Extend `testUtils.jsx` to export `__lastContainer()` returning the container used by the last `renderAppAtOrders` call. Mailto format is pinned by Task 9: recipient raw, `subject`/`body` via `encodeURIComponent`.)

- [ ] **Step 2: Run** `npm test -- audit` — Expected: FAIL.
- [ ] **Step 3: Implement.** `openReply` goes through `usecases.audit.openReplyDraft` → ComposeService (office → real compose window; jsdom/browser → mailto). Feed groups by `poNumber`, msgs-count strings are seed fields (`threadLabel: "PO #4471 · ACME STEEL · 14 MSGS"`).
- [ ] **Step 4: Run** `npm test -- audit` — Expected: PASS. Then `npm test` — everything PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: audit feed/detail, toast via realtime event, outlook compose handoff"`

---

### Task 17: Fluent removal, dead code cleanup, full build

**Files:**
- Delete: `src/taskpane/components/App.jsx`, `Header.jsx`, `HeroList.jsx`, `TextInsertion.jsx`, `src/taskpane/taskpane.js` (insertText helper unused by Scout)
- Modify: `package.json` (remove `@fluentui/react-components`, `@fluentui/react-icons`)
- Test: existing suite + build

- [ ] **Step 1: Delete** the four template components and `taskpane.js`; `grep -r "fluentui\|HeroList\|TextInsertion" src/` — Expected: no hits.
- [ ] **Step 2: Remove Fluent deps** from package.json, run `npm install` (prunes lockfile).
- [ ] **Step 3: Run** `npm test` — all suites PASS; `npm run build:dev` — exit 0; `npm run lint` — no new errors (fix any).
- [ ] **Step 4: Manual smoke (with the user):** `npm run dev-server`, open `https://localhost:3000/taskpane.html` in a browser → full mock flow works; optionally `npm start` to sideload in Outlook desktop.
- [ ] **Step 5: Commit** `git add -A && git commit -m "chore: remove fluent template code; scout app is the taskpane"`

---

### Task 18: Building journal + Loki summary

**Files:**
- Create: `.claude/Building_Journal/2026-07-16-scout-fe-build.md`, `.claude/Building_Journal/loki-summary.md`

- [ ] **Step 1: Write the build journal** — style mirrors the Overseer walkthroughs (`BE_Docs/Endpoints/*`): ⚡ What was built · 🎓 Design decisions (one line each, with the why) · 🌳 Where things live (tree) · 🔄 How the flows run · ✅ State of the system (test counts, what's proven/unproven) · 🚧 Known gaps (priority order) · 🗺 What's next. **Per Julian's explicit request, be exhaustive in the last three sections**: what's next, what's needed from him/backend (Azure app registration clientId+tenantId, Overseer deploy URL + wsUrl, `GET /otto/scans` listing endpoint, per-flow PATCH, whether new-sheet record will be supported), and what was missed/deferred (toast trigger origin, checkup step→flow mapping compromise, NetSuite/QuickBooks mock-only targets, sort chip static, `10 ACTIVE ORDERS` label vs 4 seeded orders discrepancy inherited from the prototype).
- [ ] **Step 2: Write the Loki summary** — what Loki is (the umbrella project: Scout FE add-in + Overseer BE), how the pieces relate, current state of each, integration path (flip `dataSource` to `http`, set URLs, auth mode sso).
- [ ] **Step 3: Commit** `git add -A && git commit -m "docs: building journal + loki summary"` (note: `.claude/` is gitignored but the design handoff was force-added historically; use `git add -f .claude/Building_Journal` if needed).

---

## Verification (end-to-end)

1. `npm test` — all suites green (expect ~90-120 tests across 12+ suites).
2. `npm run build:dev` + `npm run lint` — clean.
3. `npm run dev-server` → browser `https://localhost:3000/taskpane.html`: walk Welcome → Checklist → Connect ERP → Orders (banner) → full Otto Excel path → Otto tab record → Check-ups toggle/edit/add/activity → Audit feed/detail → toast appears ~8 s after landing → compose fallback opens.
4. In Outlook (`npm start`): pane loads on a read message; audit detail's email button opens a real pre-filled compose window.
5. Backend swap dry-run: in `app.config.js` set `dataSource: "http"` — app boots, orders list shows the error/retry state (backend absent), no crash; revert to `"mock"`.

## Deviation from spec noted during planning

- `CheckupRepository` port is **flow-level** (`listFlows/createFlow/setFlowOn/saveStep/addStep`) rather than the spec's row-level sketch; the row-level backend translation lives inside the http adapter (Task 8). Same architecture intent (adapters absorb backend shape), better use-case ergonomics. Spec §11.4's cancel+recreate mapping is unchanged.

