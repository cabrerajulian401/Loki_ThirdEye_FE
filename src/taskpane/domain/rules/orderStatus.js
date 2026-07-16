const MAP = {
  delayed: ["DELAYED", "filled"],
  "on-time": ["ON-TIME", "outline"],
  "quote-pending": ["QUOTE PENDING", "outline"],
  delivered: ["DELIVERED", "dim"],
};
export const statusLabel = (s) => MAP[s][0];
export const pillVariant = (s) => MAP[s][1];
