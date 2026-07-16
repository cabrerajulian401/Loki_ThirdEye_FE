const REPEAT_LABEL = { "2d": "EVERY 2 DAYS", "3d": "EVERY 3 DAYS", weekly: "WEEKLY" };
export function timingLine(step) {
  const base = step.send === "day0" ? "SENDS DAY 0" : `${step.send} DAYS`;
  const cond = step.cond === "noreply" ? " IF NO REPLY" : "";
  const rep = step.repeat !== "none" ? ` · ${REPEAT_LABEL[step.repeat]}` : "";
  return `↻ ${base}${cond}${rep}`;
}
