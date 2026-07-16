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
