export const CODES = Object.freeze({
  AUTH_EXPIRED: "AUTH_EXPIRED",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  BAD_REQUEST: "BAD_REQUEST",
  UPSTREAM: "UPSTREAM",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
  NETWORK: "NETWORK",
});

export const ok = (data) => ({ ok: true, data });
export const err = (code, message) => ({ ok: false, error: { code, message } });
