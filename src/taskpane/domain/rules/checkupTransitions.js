export const CLIENT_SETTABLE = ["pending", "paused", "cancelled"];
const TERMINAL = ["sent", "cancelled"];
export function canTransition(from, to) {
  if (from === to) return !TERMINAL.includes(from) && from !== "sending";
  if (from === "sending" || TERMINAL.includes(from)) return false;
  if (to === "cancelled") return true;
  return (from === "paused" && to === "pending") || (from === "pending" && to === "paused");
}
