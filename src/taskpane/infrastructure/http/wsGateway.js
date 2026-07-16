const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

/**
 * @param {{wsUrl: string, getToken: () => string|null}} deps
 * @returns {import("../../application/ports").RealtimeGateway}
 */
export function createWsGateway({ wsUrl, getToken }) {
  const handlers = new Map(); // type -> Set<fn>
  let socket = null;
  let reconnectTimer = null;
  let backoffMs = INITIAL_BACKOFF_MS;
  let disconnected = false;
  let warnedOnce = false;
  // Fallback only — used when no getToken dependency was supplied at all.
  // Every open() attempt (initial or reconnect) prefers a fresh getToken()
  // call so a rotated/refreshed token is picked up rather than retrying
  // forever with whatever was current at the original connect() call.
  let explicitToken = null;

  function dispatch(type, data) {
    const set = handlers.get(type);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(data);
      } catch (e) {
        // a handler's own error must never break the socket loop
      }
    }
  }

  function scheduleReconnect() {
    if (disconnected) return;
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      open();
    }, backoffMs);
    if (reconnectTimer && typeof reconnectTimer.unref === "function") reconnectTimer.unref();
  }

  function open() {
    if (disconnected) return;
    if (typeof WebSocket === "undefined") {
      if (!warnedOnce) {
        warnedOnce = true;
        console.warn("wsGateway: WebSocket is not available in this environment; realtime updates disabled.");
      }
      return;
    }

    const token = typeof getToken === "function" ? getToken() : explicitToken;
    const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;

    try {
      socket = new WebSocket(url);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      backoffMs = INITIAL_BACKOFF_MS;
    };

    socket.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        dispatch(type, data);
      } catch (e) {
        // malformed frame: ignore rather than crash the socket
      }
    };

    socket.onclose = () => {
      socket = null;
      scheduleReconnect();
    };

    socket.onerror = () => {
      // onclose fires after onerror for a failed connection; reconnect is handled there
    };
  }

  // Shared teardown for both connect() (replacing a live connection) and
  // disconnect() (stopping for good). Nulls the close handler first so
  // closing the old socket never fires another reconnect.
  function closeSocket() {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
    if (socket) {
      try {
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.close();
      } catch (e) {
        // best-effort close
      }
      socket = null;
    }
  }

  function connect(token) {
    disconnected = false;
    explicitToken = token ?? null;
    backoffMs = INITIAL_BACKOFF_MS;
    closeSocket(); // no duplicate live connections if connect() is called again
    open();
  }

  function on(eventType, handler) {
    if (!handlers.has(eventType)) handlers.set(eventType, new Set());
    handlers.get(eventType).add(handler);
  }

  function disconnect() {
    disconnected = true;
    closeSocket();
  }

  return { connect, on, disconnect };
}
