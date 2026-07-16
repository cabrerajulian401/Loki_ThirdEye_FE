import { ok } from "../../application/result";
import { seed } from "./seed";

// A tiny pub/sub "bus" per storage instance, so that mock repos (mockRepos.js)
// and the mock realtime gateway created here can talk to each other without a
// direct import cycle — as long as both were created from the same storage
// object (as the real container will do), events raised by one side reach
// subscribers registered on the other.
const busRegistry = new WeakMap();

function getBus(storage) {
  let bus = busRegistry.get(storage);
  if (!bus) {
    bus = new Map(); // eventType -> Set<handler>
    busRegistry.set(storage, bus);
  }
  return bus;
}

export function emitRealtimeEvent(storage, type, data) {
  const bus = getBus(storage);
  const handlers = bus.get(type);
  if (handlers) handlers.forEach((fn) => fn(data));
}

export function scheduleRealtimeEvent(storage, type, data, delayMs) {
  const t = setTimeout(() => emitRealtimeEvent(storage, type, data), delayMs);
  if (t && typeof t.unref === "function") t.unref();
  return t;
}

export function createMockServices(storage) {
  const auth = {
    async signIn() {
      storage.set("mockAuthSignedIn", true);
      return ok({ user: { name: "Operator" }, token: "mock-token" });
    },
    getToken() {
      return "mock-token";
    },
    isSignedIn() {
      return !!storage.get("mockAuthSignedIn");
    },
  };

  const emailContext = {
    async getOpenEmail() {
      return seed.openEmail;
    },
  };

  const realtime = {
    connect(/* token */) {
      if (!storage.get("demoToastFired")) {
        storage.set("demoToastFired", true);
        // The ws contract's `discrepancy.found` payload IS the discrepancy
        // DTO itself (see wsGateway/BE_Docs) — emit the seeded price finding
        // as-is, exactly like tests emit through `_emit`.
        scheduleRealtimeEvent(storage, "discrepancy.found", seed.findings.price, 8000);
      }
    },
    on(type, fn) {
      const bus = getBus(storage);
      if (!bus.has(type)) bus.set(type, new Set());
      bus.get(type).add(fn);
    },
    disconnect() {
      busRegistry.delete(storage);
    },
    // test/demo helper — fires a realtime event to current subscribers immediately.
    _emit(type, data) {
      emitRealtimeEvent(storage, type, data);
    },
  };

  return { auth, emailContext, realtime };
}
