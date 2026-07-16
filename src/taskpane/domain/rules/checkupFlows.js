export const flowCadenceLabel = (flow) => (flow.on ? flow.cadence : "Paused");
export const flowInitials = (name) =>
  name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
