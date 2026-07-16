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
