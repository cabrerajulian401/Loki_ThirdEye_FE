// Gap #9 (http render-readiness): the Overseer backend's DTOs — shapes
// documented in BE_Docs/Endpoints/*.md — carry the durable business fields
// but not every seed-shaped view-model field the screens bind. These tests
// feed BE-doc-shaped rows (not seed.js rows) into the mappers and assert
// seed-shaped output, including the fallback path for fields the backend
// genuinely has no source data for yet.
import {
  mapOrderRow,
  mapDiscrepancyRow,
  mapDestinationRow,
  mapDestinations,
  checkupFlowExtras,
} from "../../infrastructure/http/mappers";

describe("mapOrderRow", () => {
  it("maps a BE-doc-shaped order row (Order_List_Sync_Onboading.md) to the seed-shaped view model", () => {
    const row = {
      poNumber: "PO #4472",
      company: "Delmar Tooling",
      status: "delayed",
      originalEstDate: "2026-06-28",
      currentEstDate: "2026-07-02",
      lastMessenger: "Ray",
      conversationId: "conv-4472",
    };
    expect(mapOrderRow(row)).toMatchObject({
      poNumber: "PO #4472",
      company: "Delmar Tooling",
      status: "delayed",
      conversationId: "conv-4472",
      timingLine: "Est. Jun 28 → Jul 2",
      lastMessenger: "Ray",
    });
  });

  it("falls back lastMessenger to '' when the row carries no such field (BE gap: not confirmed on the read DTO)", () => {
    const row = { poNumber: "PO #4468", company: "Vance Components", status: "quote-pending", currentEstDate: "2026-07-08" };
    const mapped = mapOrderRow(row);
    expect(mapped.lastMessenger).toBe("");
    expect(mapped.timingLine).toBe("Est. Jul 8 · awaiting quote");
  });

  it("never throws on a bare row", () => {
    expect(() => mapOrderRow({})).not.toThrow();
    expect(mapOrderRow({})).toMatchObject({ timingLine: "", lastMessenger: "" });
  });
});

describe("mapDiscrepancyRow", () => {
  const baseRow = {
    id: "d1",
    type: "price",
    status: "open",
    priority: "HIGH",
    title: "Price changed",
    company: "Acme Steel",
    poNumber: "PO #4471",
    contactName: "Maria Chen",
    detail: { leftLabel: "QUOTED", left: "$41.00", rightLabel: "BILLED", right: "$42.50", impact: "+$1.50/unit" },
    quotes: [{ author: "Maria Chen", date: "May 3", text: "...", emphasized: false }],
  };

  it("derives threadLabel/initials from the fields the discrepancy DTO already carries (Thread_Audit.md)", () => {
    const mapped = mapDiscrepancyRow(baseRow);
    expect(mapped.threadLabel).toBe("PO #4471 · ACME STEEL");
    expect(mapped.initials).toBe("MC");
  });

  it("falls back contactEmail to '' and draftReply to a safe empty shape when the row carries neither (BE gap)", () => {
    const mapped = mapDiscrepancyRow(baseRow);
    expect(mapped.contactEmail).toBe("");
    expect(mapped.draftReply).toEqual({ subject: "", body: "" });
  });

  it("passes contactEmail/draftReply through when a row does carry them", () => {
    const row = { ...baseRow, contactEmail: "maria@acmesteel.com", draftReply: { subject: "s", body: "b" } };
    const mapped = mapDiscrepancyRow(row);
    expect(mapped.contactEmail).toBe("maria@acmesteel.com");
    expect(mapped.draftReply).toEqual({ subject: "s", body: "b" });
  });

  it("degrades threadLabel to '' when company and poNumber are both missing, never throws", () => {
    expect(() => mapDiscrepancyRow({})).not.toThrow();
    expect(mapDiscrepancyRow({}).threadLabel).toBe("");
    expect(mapDiscrepancyRow({}).draftReply).toEqual({ subject: "", body: "" });
  });
});

describe("mapDestinations (Otto scan destinations, Otto.md)", () => {
  const rows = [
    { id: "0", name: "Acme Steel — 2026 POs.xlsx" },
    { id: "1", name: "Q3 Procurement Tracker.xlsx" },
  ];

  it("marks only the first-ranked destination as the best match", () => {
    const mapped = mapDestinations(rows);
    expect(mapped[0].isBestMatch).toBe(true);
    expect(mapped[1].isBestMatch).toBe(false);
  });

  it("falls back subtitle/matchNote to '' when the row carries no explanatory text (BE gap: RankDestinations resolves index->item only)", () => {
    const [first] = mapDestinations(rows);
    expect(first.subtitle).toBe("");
    expect(first.matchNote).toBe("");
  });

  it("passes subtitle/matchNote through when a row does carry them", () => {
    const [mapped] = mapDestinations([{ id: "0", name: "x.xlsx", subtitle: "s", matchNote: "m" }]);
    expect(mapped.subtitle).toBe("s");
    expect(mapped.matchNote).toBe("m");
  });

  it("mapDestinationRow(row, index) matches the array form for a single row", () => {
    expect(mapDestinationRow(rows[1], 1)).toEqual(mapDestinations(rows)[1]);
  });

  it("handles an empty/missing destinations list without throwing", () => {
    expect(mapDestinations([])).toEqual([]);
    expect(mapDestinations(undefined)).toEqual([]);
  });
});

describe("checkupFlowExtras (Checkups.md rows -> flow extras)", () => {
  it("derives initials from contactName and next from the earliest pending row's sendDate", () => {
    const rows = [
      {
        id: "r1", flowId: "f1", companyName: "Orbit Packaging", emailAddress: "tom@orbitpack.com",
        contactName: "Tom Silva", status: "pending", sendDate: "2026-07-05T00:00:00.000Z",
      },
      {
        id: "r2", flowId: "f1", companyName: "Orbit Packaging", emailAddress: "tom@orbitpack.com",
        contactName: "Tom Silva", status: "pending", sendDate: "2026-07-01T00:00:00.000Z",
      },
    ];
    expect(checkupFlowExtras(rows)).toEqual({ poNumber: "", initials: "TS", next: "Jul 1" });
  });

  it("next is '' when no rows are pending (all sent/cancelled, or flow paused)", () => {
    const rows = [{ id: "r1", flowId: "f2", companyName: "Vance", status: "sent", sendDate: "2026-07-01T00:00:00.000Z" }];
    expect(checkupFlowExtras(rows).next).toBe("");
  });

  it("poNumber falls back to '' — Checkups.md's create payload and rows carry no PO-number field (BE gap)", () => {
    const rows = [{ flowId: "f3", status: "pending", sendDate: "2026-07-01T00:00:00.000Z" }];
    expect(checkupFlowExtras(rows).poNumber).toBe("");
  });

  it("poNumber passes through if a row happens to carry one", () => {
    const rows = [{ flowId: "f3", poNumber: "PO #99", status: "pending", sendDate: "2026-07-01T00:00:00.000Z" }];
    expect(checkupFlowExtras(rows).poNumber).toBe("PO #99");
  });

  it("initials falls back to '' when contactName is missing, never throws", () => {
    const rows = [{ flowId: "f4", status: "pending", sendDate: "2026-07-01T00:00:00.000Z" }];
    expect(() => checkupFlowExtras(rows)).not.toThrow();
    expect(checkupFlowExtras(rows).initials).toBe("");
  });
});
