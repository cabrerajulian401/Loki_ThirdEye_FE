// Gap #9 (http render-readiness): the Overseer order row carries a status
// plus originalEstDate/currentEstDate (Order_List_Sync_Onboading.md merge
// semantics — "OriginalEstDate never moves once set, CurrentEstDate/Status
// ... update when the extraction has them"), never a formatted display
// string. This mirrors timingLine.js's style (a step in, a display line out)
// for the Orders screen's card (dc.html 158-161).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Parses the YYYY-MM-DD prefix directly rather than `new Date(...).getMonth()`
// so a caller's local timezone can never shift the calendar day. Returns ""
// for anything that isn't a recognizable ISO date (including missing/blank).
export function monthDayLabel(dateStr) {
  const match = typeof dateStr === "string" && /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return "";
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return "";
  return `${month} ${Number(match[3])}`;
}

export function orderTimingLine(order = {}) {
  const current = monthDayLabel(order.currentEstDate);

  if (order.status === "delivered") {
    return current ? `Delivered ${current}` : "";
  }

  if (order.status === "quote-pending") {
    return current ? `Est. ${current} · awaiting quote` : "Awaiting quote";
  }

  if (!current) return "";
  const original = monthDayLabel(order.originalEstDate);
  return original && original !== current ? `Est. ${original} → ${current}` : `Est. ${current}`;
}
