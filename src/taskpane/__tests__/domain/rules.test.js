import { canTransition, CLIENT_SETTABLE } from "../../domain/rules/checkupTransitions";
import { timingLine } from "../../domain/rules/timingLine";
import { statusLabel, pillVariant } from "../../domain/rules/orderStatus";
import { checklistProgress } from "../../domain/rules/checklistProgress";
import { flowCadenceLabel, flowInitials } from "../../domain/rules/checkupFlows";

describe("checkupTransitions", () => {
  it.each([
    ["paused", "pending", true], ["pending", "paused", true],
    ["pending", "cancelled", true], ["paused", "cancelled", true],
    ["pending", "pending", true], // same-status no-op success
    ["sent", "pending", false], ["cancelled", "pending", false],
    ["sending", "paused", false], ["pending", "sent", false],
  ])("%s -> %s = %s", (from, to, ok) => expect(canTransition(from, to)).toBe(ok));
  it("clients may only set pending/paused/cancelled", () =>
    expect(CLIENT_SETTABLE).toEqual(["pending", "paused", "cancelled"]));
});

describe("timingLine (prototype dc.html 827-833)", () => {
  it("day 0 always", () =>
    expect(timingLine({ send: "day0", cond: "always", repeat: "none", stop: "3" }))
      .toBe("↻ SENDS DAY 0"));
  it("+3 days if no reply, repeat every 3 days", () =>
    expect(timingLine({ send: "+3", cond: "noreply", repeat: "3d", stop: "3" }))
      .toBe("↻ +3 DAYS IF NO REPLY · EVERY 3 DAYS"));
  it("weekly repeat", () =>
    expect(timingLine({ send: "+7", cond: "noreply", repeat: "weekly", stop: "1" }))
      .toBe("↻ +7 DAYS IF NO REPLY · WEEKLY"));
});

describe("orderStatus", () => {
  it.each([
    ["delayed", "DELAYED", "filled"],
    ["on-time", "ON-TIME", "outline"],
    ["quote-pending", "QUOTE PENDING", "outline"],
    ["delivered", "DELIVERED", "dim"],
  ])("%s", (s, label, variant) => {
    expect(statusLabel(s)).toBe(label);
    expect(pillVariant(s)).toBe(variant);
  });
});

describe("checklistProgress", () => {
  it("sign-in alone = 1/4", () =>
    expect(checklistProgress({ erp: false, otto: false, invite: false }))
      .toEqual({ done: 1, total: 4, pct: "25%", count: "1 / 4" }));
  it("all done = 4/4", () =>
    expect(checklistProgress({ erp: true, otto: true, invite: true }))
      .toEqual({ done: 4, total: 4, pct: "100%", count: "4 / 4" }));
});

describe("checkupFlows", () => {
  it("cadence label", () => {
    expect(flowCadenceLabel({ on: true, cadence: "Every 3 days" })).toBe("Every 3 days");
    expect(flowCadenceLabel({ on: false, cadence: "Every 3 days" })).toBe("Paused");
  });
  it("initials", () => expect(flowInitials("Maria Chen")).toBe("MC"));
});
