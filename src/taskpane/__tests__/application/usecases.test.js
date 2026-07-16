import { createSessionUsecases, createRealtimeUsecases } from "../../application/usecases/session";
import { createOrderUsecases } from "../../application/usecases/orders";
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

it("createRealtimeUsecases.start connects with the token and wires only the provided handlers", () => {
  const connectCalls = [];
  const onCalls = [];
  const realtime = {
    connect: (token) => { connectCalls.push(token); },
    on: (type, fn) => { onCalls.push([type, fn]); },
  };
  const auth = { getToken: () => "tok-9" };
  const uc = createRealtimeUsecases({ realtime, auth });
  const fn1 = () => {};
  const fn2 = () => {};

  uc.start({ onSyncCompleted: fn1, onDiscrepancyFound: fn2 });

  expect(connectCalls).toEqual(["tok-9"]);
  expect(onCalls.map(([type]) => type)).toEqual(["sync.completed", "discrepancy.found"]);
});

it("createRealtimeUsecases.start with all three handlers registers all three event types", () => {
  const onCalls = [];
  const realtime = {
    connect: () => {},
    on: (type) => { onCalls.push(type); },
  };
  const auth = { getToken: () => "tok-1" };
  const uc = createRealtimeUsecases({ realtime, auth });

  uc.start({ onSyncCompleted: () => {}, onOrderUpdated: () => {}, onDiscrepancyFound: () => {} });

  expect(onCalls).toEqual(["sync.completed", "order.updated", "discrepancy.found"]);
});

it("listOrders forwards its args to the repo and passes the Result through untouched", async () => {
  let seen;
  const listResult = ok({ orders: [{ id: "o1" }], nextCursor: null });
  const uc = createOrderUsecases({
    orderRepo: { list: async (args) => { seen = args; return listResult; } },
  });

  const got = await uc.listOrders({ status: "delayed" });

  expect(seen).toEqual({ status: "delayed" });
  expect(got).toBe(listResult);
});
