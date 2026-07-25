import { canTransition, CLIENT_SETTABLE } from "../../domain/rules/checkupTransitions";
import { timingLine } from "../../domain/rules/timingLine";
import { statusLabel, pillVariant } from "../../domain/rules/orderStatus";
import { checklistProgress } from "../../domain/rules/checklistProgress";
import { flowCadenceLabel, flowInitials } from "../../domain/rules/checkupFlows";
import { orderTimingLine } from "../../domain/rules/orderTimingLine";

describe("checkupTransitions", () => {
  it.each([
    ["paused", "pending", true], ["pending", "paused", true],
    ["pending", "cancelled", true], ["paused", "cancelled", true],
    ["pending", "pending", true], // same-status no-op success
    ["sent", "pending", false], ["cancelled", "pending", false],
    ["sending", "paused", false], ["pending", "sent", false],
    ["sending", "sending", false],
  ])("%s -> %s = %s", (from, to, ok) => expect(canTransition(from, to)).toBe(ok));
  it("clients may only set pending/paused/cancelled", () =>
    expect(CLIENT_SETTABLE).toEqual(["pending", "paused", "cancelled"]));
});

describe("timingLine (prototype dc.html 827-833)", () => {
  it("day 0 always", () =>
    expect(timingLine({ send: "day0", cond: "always", repeat: "none", stop: "3" }))
      .toBe("↻ SENDS DAY 0"));
  it("+1 day singular", () =>
    expect(timingLine({ send: "+1", cond: "always", repeat: "none", stop: "1" }))
      .toBe("↻ +1 DAY"));
  it("+3 days if no reply, repeat every 3 days", () =>
    expect(timingLine({ send: "+3", cond: "noreply", repeat: "3d", stop: "3" }))
      .toBe("↻ +3 DAYS IF NO REPLY · EVERY 3 DAYS"));
  it("weekly repeat", () =>
    expect(timingLine({ send: "+7", cond: "noreply", repeat: "weekly", stop: "1" }))
      .toBe("↻ +7 DAYS IF NO REPLY · EVERY WEEKLY"));
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

// Gap #9: http mode gets order rows with raw status + estimate dates, not a
// formatted display line — this rule derives the seed-shaped `timingLine`
// string (dc.html's SUPPLIERS HOME cards) the same way checkups' timingLine
// derives a step's display line from its cadence fields.
describe("orderTimingLine", () => {
  it("delayed: original and current estimates differ -> arrow form", () =>
    expect(orderTimingLine({ status: "delayed", originalEstDate: "2026-06-28", currentEstDate: "2026-07-02" })).toBe(
      "Est. Jun 28 → Jul 2"
    ));
  it("on-time: single current estimate, no arrow", () =>
    expect(orderTimingLine({ status: "on-time", currentEstDate: "2026-07-02" })).toBe("Est. Jul 2"));
  it("quote-pending: awaiting-quote suffix", () =>
    expect(orderTimingLine({ status: "quote-pending", currentEstDate: "2026-07-08" })).toBe(
      "Est. Jul 8 · awaiting quote"
    ));
  it("delivered: delivered wording off currentEstDate", () =>
    expect(orderTimingLine({ status: "delivered", currentEstDate: "2026-06-24" })).toBe("Delivered Jun 24"));
  it("original equal to current collapses to the single-date form", () =>
    expect(orderTimingLine({ status: "delayed", originalEstDate: "2026-07-02", currentEstDate: "2026-07-02" })).toBe(
      "Est. Jul 2"
    ));
  it("missing currentEstDate degrades to empty string rather than crashing", () =>
    expect(orderTimingLine({ status: "on-time" })).toBe(""));
  it("quote-pending with no date falls back to a generic label", () =>
    expect(orderTimingLine({ status: "quote-pending" })).toBe("Awaiting quote"));
  it("delivered with no date degrades to empty string", () =>
    expect(orderTimingLine({ status: "delivered" })).toBe(""));
  it("unknown status with no dates degrades to empty string (never throws)", () =>
    expect(orderTimingLine({})).toBe(""));
});
