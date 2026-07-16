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
