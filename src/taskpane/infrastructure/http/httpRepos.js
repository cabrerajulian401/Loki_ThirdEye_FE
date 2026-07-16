import { ok, err, CODES } from "../../application/result";

const NEW_STEP_DEFAULTS = { message: "", send: "+3", cond: "noreply", repeat: "none", stop: "1" };
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// The backend stores only repeat_flow (message count) + each row's computed
// sendDate — never a repeatEveryDays interval — so cadence must be derived
// from the gap between consecutive sendDates, not read off a field.
function daysBetween(a, b) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY);
}

function cadenceFromRows(rows) {
  if (!rows || rows.length < 2) return "One-time";
  const sorted = [...rows].sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate));
  const gap = daysBetween(sorted[0].sendDate, sorted[1].sendDate);
  return gap === 7 ? "Weekly" : `Every ${gap} days`;
}

function groupRowsToFlows(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.flowId)) groups.set(row.flowId, []);
    groups.get(row.flowId).push(row);
  }
  return Array.from(groups.values()).map((flowRows) => {
    const first = flowRows[0];
    return {
      flowId: first.flowId,
      companyName: first.companyName,
      emailAddress: first.emailAddress,
      contactName: first.contactName ?? "",
      // Never emit "Paused" here — that's flowCadenceLabel's job (domain rule
      // renders "Paused" when !on); this is always the real cadence label.
      on: flowRows.some((r) => r.status === "pending"),
      cadence: cadenceFromRows(flowRows),
      steps: [],
    };
  });
}

function stepToCadence(input) {
  const cancelIfReply = input.cond === "noreply";

  let repeatFlow;
  let repeatEveryDays;
  if (input.repeat === "2d") {
    repeatFlow = Number(input.stop);
    repeatEveryDays = 2;
  } else if (input.repeat === "3d") {
    repeatFlow = Number(input.stop);
    repeatEveryDays = 3;
  } else if (input.repeat === "weekly") {
    repeatFlow = Number(input.stop);
    repeatEveryDays = 7;
  } else {
    // "none" (or anything unrecognized): a single message, no repeat interval.
    repeatFlow = 1;
  }

  let sendDate;
  if (input.send === "day0") {
    sendDate = new Date().toISOString();
  } else if (typeof input.send === "string" && input.send.startsWith("+")) {
    const days = Number(input.send.slice(1));
    sendDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  } else {
    sendDate = new Date().toISOString();
  }

  const payload = {
    companyName: input.companyName,
    emailAddress: input.emailAddress,
    subject: input.subject ?? "Order check-up",
    body: input.message,
    sendDate,
    cancelIfReply,
    repeatFlow,
    conversationId: input.conversationId,
  };
  if (repeatEveryDays !== undefined) payload.repeatEveryDays = repeatEveryDays;
  return payload;
}

function createOrderRepo(client) {
  async function list(args = {}) {
    const params = [];
    if (args && args.status) params.push(`status=${encodeURIComponent(args.status)}`);
    if (args && args.cursor) params.push(`cursor=${encodeURIComponent(args.cursor)}`);
    const qs = params.length ? `?${params.join("&")}` : "";
    return client.get(`/orders${qs}`);
  }

  async function startSync() {
    return client.post("/sync");
  }

  async function ensureSubscription() {
    return client.post("/subscriptions");
  }

  return { list, startSync, ensureSubscription };
}

function createCheckupRepo(client) {
  async function listFlows() {
    const res = await client.get("/checkups");
    if (!res.ok) return res;
    const rows = (res.data && res.data.checkups) || [];
    return ok({ flows: groupRowsToFlows(rows) });
  }

  // GET /checkups -> groupRowsToFlows -> find by flowId. Returns the flow
  // object or null (never a Result) — callers decide the fallback.
  async function fetchFlow(flowId) {
    const res = await client.get("/checkups");
    if (!res.ok) return null;
    const rows = (res.data && res.data.checkups) || [];
    return groupRowsToFlows(rows).find((f) => f.flowId === flowId) || null;
  }

  async function createFlow(input) {
    const res = await client.post("/checkups", stepToCadence(input));
    if (!res.ok) return res;
    const body = res.data || {};
    const rows = body.checkups || [];
    const flow =
      (rows.length ? groupRowsToFlows(rows)[0] : null) ||
      (await fetchFlow(body.flowId)) || { flowId: body.flowId, steps: [] };
    return ok({ flow });
  }

  async function setFlowOn(flowId, on) {
    const rowsRes = await client.get("/checkups");
    if (!rowsRes.ok) return rowsRes;
    const rows = (rowsRes.data && rowsRes.data.checkups) || [];
    const targetStatus = on ? "paused" : "pending";
    const newStatus = on ? "pending" : "paused";
    const toPatch = rows.filter((r) => r.flowId === flowId && r.status === targetStatus);
    for (const row of toPatch) {
      const res = await client.patch(`/checkups/${row.id}`, { status: newStatus });
      if (!res.ok) return res;
    }
    // Derived from the rows already fetched above (patched in-memory to
    // reflect the status change just applied) rather than a fresh fetchFlow()
    // round trip — this keeps setFlowOn a single GET + N PATCH call, with no
    // extra GET whose ordering/count a caller might depend on.
    const patchedIds = new Set(toPatch.map((r) => r.id));
    const updatedFlowRows = rows
      .filter((r) => r.flowId === flowId)
      .map((r) => (patchedIds.has(r.id) ? { ...r, status: newStatus } : r));
    const flow = groupRowsToFlows(updatedFlowRows)[0] || { flowId, on, steps: [] };
    return ok({ flow });
  }

  // Cancels remaining pending rows of a flow and returns the flow's rows
  // (as context for rebuilding a new flow from an edited step).
  async function cancelPendingRowsOfFlow(flowId) {
    const rowsRes = await client.get("/checkups");
    if (!rowsRes.ok) return rowsRes;
    const rows = (rowsRes.data && rowsRes.data.checkups) || [];
    const flowRows = rows.filter((r) => r.flowId === flowId);
    const pending = flowRows.filter((r) => r.status === "pending");
    for (const row of pending) {
      const res = await client.patch(`/checkups/${row.id}`, { status: "cancelled" });
      if (!res.ok) return res;
    }
    return ok({ rows: flowRows });
  }

  async function saveStep(flowId, stepIndex, step) {
    const cancelRes = await cancelPendingRowsOfFlow(flowId);
    if (!cancelRes.ok) return cancelRes;
    const context = cancelRes.data.rows[0] || {};
    return createFlow({ ...context, ...step });
  }

  async function addStep(flowId) {
    const cancelRes = await cancelPendingRowsOfFlow(flowId);
    if (!cancelRes.ok) return cancelRes;
    const context = cancelRes.data.rows[0] || {};
    const createRes = await createFlow({ ...context, ...NEW_STEP_DEFAULTS });
    if (!createRes.ok) return createRes;
    // Seam: individual step detail isn't reconstructable from backend rows
    // until a GET /otto-style listing exists for checkup steps (spec §11.4
    // seam) — http mode's flow.steps is always [], so the freshly created
    // flow's one step lives at index 0.
    return ok({ flow: createRes.data.flow, stepIndex: createRes.data.flow.steps.length });
  }

  return { listFlows, createFlow, setFlowOn, saveStep, addStep };
}

function createDiscrepancyRepo(client) {
  async function list(args = {}) {
    const qs = args && args.status ? `?status=${encodeURIComponent(args.status)}` : "";
    return client.get(`/discrepancies${qs}`);
  }

  async function updateStatus(id, status) {
    const res = await client.patch(`/discrepancies/${id}`, { status });
    if (!res.ok) return res;
    return ok({ discrepancy: res.data });
  }

  return { list, updateStatus };
}

function createOttoRepo(client) {
  async function scan(args = {}) {
    return client.post("/otto/scans", args);
  }

  async function record(scanId, args) {
    return client.post(`/otto/scans/${scanId}/record`, args);
  }

  async function listScans() {
    return err(CODES.NOT_IMPLEMENTED, "GET /otto/scans not yet in Overseer");
  }

  return { scan, record, listScans };
}

export function createHttpRepos(client) {
  return {
    orderRepo: createOrderRepo(client),
    checkupRepo: createCheckupRepo(client),
    discrepancyRepo: createDiscrepancyRepo(client),
    ottoRepo: createOttoRepo(client),
  };
}
