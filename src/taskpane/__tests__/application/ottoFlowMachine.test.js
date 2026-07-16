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
