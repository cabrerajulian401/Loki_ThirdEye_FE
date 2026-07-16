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
