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

it("createFlow returns the flow derived from the POST response, cadence from sendDate gaps", async () => {
  fetch.mockReturnValue(jsonRes(201, { flowId: "f1", checkups: [
    { id: "r1", flowId: "f1", companyName: "Orbit Packaging", emailAddress: "tom@orbitpack.com",
      status: "pending", sendDate: "2026-07-01T00:00:00.000Z" },
    { id: "r2", flowId: "f1", companyName: "Orbit Packaging", emailAddress: "tom@orbitpack.com",
      status: "pending", sendDate: "2026-07-04T00:00:00.000Z" }] }));
  const { checkupRepo } = createHttpRepos(makeClient());
  const r = await checkupRepo.createFlow({
    companyName: "Orbit Packaging", emailAddress: "tom@orbitpack.com", contactName: "Tom Silva",
    message: "Hi Tom — checking in on the status of our latest order. Any update?",
    conversationId: "conv-4459", send: "day0", cond: "noreply", repeat: "3d", stop: "3" });
  expect(r.ok).toBe(true);
  expect(r.data.flow).toMatchObject({ flowId: "f1", on: true, cadence: "Every 3 days" });
});

it("setFlowOn returns the flow reflecting the applied change", async () => {
  fetch
    .mockReturnValueOnce(jsonRes(200, { checkups: [
      { id: "r1", flowId: "f9", companyName: "Acme", emailAddress: "a@acme.com",
        status: "pending", sendDate: "2026-07-01T00:00:00.000Z" },
      { id: "r2", flowId: "f9", companyName: "Acme", emailAddress: "a@acme.com",
        status: "pending", sendDate: "2026-07-04T00:00:00.000Z" }] }))
    .mockReturnValue(jsonRes(200, {}));
  const { checkupRepo } = createHttpRepos(makeClient());
  const r = await checkupRepo.setFlowOn("f9", false);
  expect(r.ok).toBe(true);
  expect(r.data.flow).toMatchObject({ flowId: "f9", on: false, cadence: "Every 3 days" });
});

it("groupRowsToFlows (via listFlows) derives One-time cadence for a single-row flow", async () => {
  fetch.mockReturnValue(jsonRes(200, { checkups: [
    { id: "r1", flowId: "f5", companyName: "Solo Co", emailAddress: "solo@co.com",
      status: "pending", sendDate: "2026-07-01T00:00:00.000Z" }] }));
  const { checkupRepo } = createHttpRepos(makeClient());
  const r = await checkupRepo.listFlows();
  expect(r.data.flows[0]).toMatchObject({ flowId: "f5", cadence: "One-time", on: true });
});

it("addStep cancels pending rows then returns the new flow and its stepIndex", async () => {
  fetch
    .mockReturnValueOnce(jsonRes(200, { checkups: [
      { id: "r1", flowId: "f2", companyName: "Beta LLC", emailAddress: "beta@llc.com",
        conversationId: "conv-1", status: "pending", sendDate: "2026-07-01T00:00:00.000Z" }] }))
    .mockReturnValueOnce(jsonRes(200, {}))
    .mockReturnValue(jsonRes(201, { flowId: "f2-new", checkups: [
      { id: "r2", flowId: "f2-new", companyName: "Beta LLC", emailAddress: "beta@llc.com",
        status: "pending", sendDate: "2026-07-05T00:00:00.000Z" }] }));
  const { checkupRepo } = createHttpRepos(makeClient());
  const r = await checkupRepo.addStep("f2");
  expect(r.ok).toBe(true);
  expect(r.data.flow.flowId).toBe("f2-new");
  expect(r.data.stepIndex).toBe(0);
  expect(fetch.mock.calls[1][0]).toBe("https://api.test/checkups/r1");
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ status: "cancelled" });
});

// Gap #9: http render-readiness — each repo below wires the row->view-model
// mappers (src/taskpane/infrastructure/http/mappers.js) into its read path,
// using BE-doc-shaped fixture rows (not seed.js rows) as the mock fetch body.

it("listFlows returns flows with poNumber/initials/next added by the mapper", async () => {
  fetch.mockReturnValue(jsonRes(200, { checkups: [
    { id: "r1", flowId: "f5", companyName: "Orbit Packaging", emailAddress: "tom@orbitpack.com",
      contactName: "Tom Silva", status: "pending", sendDate: "2026-07-05T00:00:00.000Z" },
    { id: "r2", flowId: "f5", companyName: "Orbit Packaging", emailAddress: "tom@orbitpack.com",
      contactName: "Tom Silva", status: "pending", sendDate: "2026-07-01T00:00:00.000Z" }] }));
  const { checkupRepo } = createHttpRepos(makeClient());
  const r = await checkupRepo.listFlows();
  expect(r.data.flows[0]).toMatchObject({ flowId: "f5", initials: "TS", next: "Jul 1", poNumber: "" });
});

it("orderRepo.list maps rows to seed-shaped view models (timingLine/lastMessenger)", async () => {
  fetch.mockReturnValue(jsonRes(200, { orders: [
    { poNumber: "PO #4472", company: "Delmar Tooling", status: "delayed",
      originalEstDate: "2026-06-28", currentEstDate: "2026-07-02", conversationId: "conv-4472" }],
    nextCursor: null }));
  const { orderRepo } = createHttpRepos(makeClient());
  const r = await orderRepo.list();
  expect(r.ok).toBe(true);
  expect(r.data.orders[0]).toMatchObject({
    poNumber: "PO #4472", timingLine: "Est. Jun 28 → Jul 2", lastMessenger: "" });
});

it("discrepancyRepo.list maps rows to seed-shaped view models (threadLabel/initials)", async () => {
  fetch.mockReturnValue(jsonRes(200, { discrepancies: [
    { id: "d1", type: "price", status: "open", priority: "HIGH", title: "Price changed",
      company: "Acme Steel", poNumber: "PO #4471", contactName: "Maria Chen",
      detail: { leftLabel: "QUOTED", left: "$41.00", rightLabel: "BILLED", right: "$42.50", impact: "+$1.50/unit" },
      quotes: [] }] }));
  const { discrepancyRepo } = createHttpRepos(makeClient());
  const r = await discrepancyRepo.list();
  expect(r.data.discrepancies[0]).toMatchObject({
    threadLabel: "PO #4471 · ACME STEEL", initials: "MC", contactEmail: "", draftReply: { subject: "", body: "" } });
});

it("discrepancyRepo.updateStatus maps the returned row too", async () => {
  fetch.mockReturnValue(jsonRes(200, { id: "d1", company: "Acme Steel", poNumber: "PO #4471",
    contactName: "Maria Chen", status: "resolved" }));
  const { discrepancyRepo } = createHttpRepos(makeClient());
  const r = await discrepancyRepo.updateStatus("d1", "resolved");
  expect(r.data.discrepancy).toMatchObject({ threadLabel: "PO #4471 · ACME STEEL", initials: "MC" });
});

it("ottoRepo.scan maps destinations, first-ranked as best match", async () => {
  fetch.mockReturnValue(jsonRes(200, { scanId: "scan-1", extractedFields: {}, destinations: [
    { id: "0", name: "Acme Steel — 2026 POs.xlsx" },
    { id: "1", name: "Q3 Procurement Tracker.xlsx" }] }));
  const { ottoRepo } = createHttpRepos(makeClient());
  const r = await ottoRepo.scan({ messageId: "m1", conversationId: "c1" });
  expect(r.data.destinations[0]).toMatchObject({ isBestMatch: true, subtitle: "", matchNote: "" });
  expect(r.data.destinations[1].isBestMatch).toBe(false);
});
