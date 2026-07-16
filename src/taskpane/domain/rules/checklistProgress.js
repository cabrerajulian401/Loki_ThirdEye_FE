export function checklistProgress({ erp, otto, invite }) {
  const done = 1 + [erp, otto, invite].filter(Boolean).length;
  return { done, total: 4, pct: `${done * 25}%`, count: `${done} / 4` };
}
