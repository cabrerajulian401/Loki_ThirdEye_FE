import { ok, err, CODES } from "../../application/result";

it("ok wraps data", () => expect(ok(5)).toEqual({ ok: true, data: 5 }));
it("err wraps code+message", () =>
  expect(err(CODES.CONFLICT, "already recorded"))
    .toEqual({ ok: false, error: { code: "CONFLICT", message: "already recorded" } }));
