const REPEAT_LABEL = { "2d": "EVERY 2 DAYS", "3d": "EVERY 3 DAYS", weekly: "EVERY WEEKLY" };
export function timingLine(step) {
  let base;
  if (step.send === "day0") {
    base = "SENDS DAY 0";
  } else if (step.send === "+1") {
    base = "+1 DAY";
  } else {
    base = `${step.send} DAYS`;
  }
  const cond = step.cond === "noreply" ? " IF NO REPLY" : "";
  const rep = step.repeat !== "none" ? ` · ${REPEAT_LABEL[step.repeat]}` : "";
  return `↻ ${base}${cond}${rep}`;
}
