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
