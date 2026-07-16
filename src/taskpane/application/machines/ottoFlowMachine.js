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
