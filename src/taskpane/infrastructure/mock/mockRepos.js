import { ok, err, CODES } from "../../application/result";
import { flowInitials } from "../../domain/rules/checkupFlows";
import { seed, poByVendor, repeatToCadence, newStepTemplate } from "./seed";
import { scheduleRealtimeEvent } from "./mockServices";

const DB_KEY = "mockdb";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadDb(storage) {
  const existing = storage.get(DB_KEY);
  if (existing) return existing;
  const db = {
    orders: clone(seed.orders),
    flows: clone(seed.checkupFlows),
    discrepancies: Object.values(seed.findings).map((f) => clone(f)),
    scans: clone(seed.ottoOldEmails),
    recordedScans: [],
  };
  storage.set(DB_KEY, db);
  return db;
}

function saveDb(storage, db) {
  storage.set(DB_KEY, db);
}

// Wraps repo methods so `_failNext(error)` makes exactly the next call on
// this repo resolve to `err(error.code, error.message)`, then auto-resets.
function makeFailable() {
  const state = { nextError: null };
  const wrap = (fn) => async (...args) => {
    if (state.nextError) {
      const error = state.nextError;
      state.nextError = null;
      return err(error.code, error.message);
    }
    return fn(...args);
  };
  const _failNext = (error) => {
    state.nextError = error;
  };
  return { wrap, _failNext };
}

function poNumberFromString(value) {
  const match = /\d+/.exec(value || "");
  return match ? match[0] : "";
}

function createOrderRepo(storage) {
  // Each method gets its OWN one-shot failable state (rather than one shared
  // across all three) because `completeOnboarding()` fires `startSync()` +
  // `ensureSubscription()` synchronously ahead of the orders-loading effect's
  // `list()` call (see useAppController.js) — a single shared "next call
  // fails" flag would always be consumed by `startSync()` first, so tests
  // arming a failure meant for `list()` (spec §8's inline-retry state) need
  // it to land on `list()` specifically, independent of those other two.
  const listFailable = makeFailable();
  const startSyncFailable = makeFailable();
  const ensureSubscriptionFailable = makeFailable();

  const list = listFailable.wrap(async (args = {}) => {
    const db = loadDb(storage);
    let orders = db.orders;
    if (args && args.status) orders = orders.filter((o) => o.status === args.status);
    return ok({ orders, nextCursor: null });
  });

  const startSync = startSyncFailable.wrap(async () => {
    const syncId = "mock-sync-1";
    scheduleRealtimeEvent(storage, "sync.completed", { syncId }, 1200);
    return ok({ syncId });
  });

  const ensureSubscription = ensureSubscriptionFailable.wrap(async () => {
    return ok({ subscriptionId: "mock-sub-1", expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() });
  });

  // Arms all three methods' independent flags — the next call to *each* of
  // them fails exactly once, regardless of which one is actually invoked
  // (or in what order relative to the others).
  const _failNext = (error) => {
    listFailable._failNext(error);
    startSyncFailable._failNext(error);
    ensureSubscriptionFailable._failNext(error);
  };

  return { list, startSync, ensureSubscription, _failNext };
}

function createCheckupRepo(storage) {
  const { wrap, _failNext } = makeFailable();

  const listFlows = wrap(async () => {
    const db = loadDb(storage);
    return ok({ flows: db.flows });
  });

  const createFlow = wrap(async (input) => {
    const db = loadDb(storage);
    const poNumber = poByVendor[input.companyName] || input.poNumber || "";
    const flowId = `flow-${poNumberFromString(poNumber) || String(db.flows.length + 1)}`;
    const cadence = repeatToCadence[input.repeat] || "Every 3 days";
    const flow = {
      flowId,
      poNumber,
      companyName: input.companyName,
      contactName: input.contactName,
      emailAddress: input.emailAddress,
      initials: flowInitials(input.contactName || ""),
      on: true,
      cadence,
      next: "Jul 5",
      steps: [{ name: "Initial check", message: input.message, send: input.send, cond: input.cond, repeat: input.repeat, stop: input.stop }],
    };
    db.flows = [...db.flows, flow];
    saveDb(storage, db);
    return ok({ flow });
  });

  const setFlowOn = wrap(async (flowId, on) => {
    const db = loadDb(storage);
    const idx = db.flows.findIndex((f) => f.flowId === flowId);
    if (idx === -1) return err(CODES.NOT_FOUND, `Flow ${flowId} not found`);
    const current = db.flows[idx];
    const cadence = on && !current.on && current.cadence === "Paused" ? "Every 3 days" : current.cadence;
    const updated = { ...current, on, cadence };
    db.flows = db.flows.map((f, i) => (i === idx ? updated : f));
    saveDb(storage, db);
    return ok({ flow: updated });
  });

  const saveStep = wrap(async (flowId, stepIndex, step) => {
    const db = loadDb(storage);
    const idx = db.flows.findIndex((f) => f.flowId === flowId);
    if (idx === -1) return err(CODES.NOT_FOUND, `Flow ${flowId} not found`);
    const steps = db.flows[idx].steps.map((s, i) => (i === stepIndex ? { ...s, ...step } : s));
    db.flows = db.flows.map((f, i) => (i === idx ? { ...f, steps } : f));
    saveDb(storage, db);
    return ok({ flow: db.flows[idx] });
  });

  const addStep = wrap(async (flowId) => {
    const db = loadDb(storage);
    const idx = db.flows.findIndex((f) => f.flowId === flowId);
    if (idx === -1) return err(CODES.NOT_FOUND, `Flow ${flowId} not found`);
    const steps = [...db.flows[idx].steps, { ...newStepTemplate }];
    db.flows = db.flows.map((f, i) => (i === idx ? { ...f, steps } : f));
    saveDb(storage, db);
    return ok({ flow: db.flows[idx], stepIndex: steps.length - 1 });
  });

  return { listFlows, createFlow, setFlowOn, saveStep, addStep, _failNext };
}

function createDiscrepancyRepo(storage) {
  const { wrap, _failNext } = makeFailable();

  const list = wrap(async (args = {}) => {
    const db = loadDb(storage);
    let discrepancies = db.discrepancies;
    if (args && args.status) discrepancies = discrepancies.filter((d) => d.status === args.status);
    return ok({ discrepancies });
  });

  const updateStatus = wrap(async (id, status) => {
    const db = loadDb(storage);
    const idx = db.discrepancies.findIndex((d) => d.id === id);
    if (idx === -1) return err(CODES.NOT_FOUND, `Discrepancy ${id} not found`);
    const updated = { ...db.discrepancies[idx], status };
    db.discrepancies = db.discrepancies.map((d, i) => (i === idx ? updated : d));
    saveDb(storage, db);
    return ok({ discrepancy: updated });
  });

  return { list, updateStatus, _failNext };
}

function createOttoRepo(storage) {
  const { wrap, _failNext } = makeFailable();

  const scan = wrap(async (args = {}) => {
    return ok({
      scanId: seed.ottoOpenScan.scanId,
      messageId: args.messageId || seed.openEmail.messageId,
      conversationId: args.conversationId || seed.openEmail.conversationId,
      extractedFields: clone(seed.ottoOpenScan.extractedFields),
      destinations: clone(seed.ottoOpenScan.destinations),
    });
  });

  const record = wrap((scanId /*, args */) => {
    const db = loadDb(storage);
    if (db.recordedScans.includes(scanId)) {
      return Promise.resolve(err(CODES.CONFLICT, `Scan ${scanId} was already recorded`));
    }
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        const latest = loadDb(storage);
        latest.recordedScans = [...latest.recordedScans, scanId];
        saveDb(storage, latest);
        resolve(ok({ webUrl: "https://onedrive.live.com/mock/acme-2026-pos", status: "recorded" }));
      }, 1700);
      if (t && typeof t.unref === "function") t.unref();
    });
  });

  const listScans = wrap(async () => {
    const db = loadDb(storage);
    return ok({ scans: db.scans });
  });

  return { scan, record, listScans, _failNext };
}

export function createMockRepos(storage) {
  loadDb(storage);
  return {
    orderRepo: createOrderRepo(storage),
    checkupRepo: createCheckupRepo(storage),
    discrepancyRepo: createDiscrepancyRepo(storage),
    ottoRepo: createOttoRepo(storage),
  };
}
