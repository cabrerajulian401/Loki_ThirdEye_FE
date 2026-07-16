/**
 * The ONLY place the presentation layer talks to use cases. Owns the nav
 * and otto machine reducers (persisting `nav` to storage), the screen data
 * state, and the actions screens call through `useApp()`.
 *
 * This task (11) wires the onboarding + shell subset of actions
 * (`signIn, openConnect, pickErp, connectContinue, toggleOtto, toggleInvite,
 * finishOnboarding, goTab, back`) plus the orders loader and the realtime
 * subscription. Tasks 12-16 extend `data`/`actions` for their own screens.
 */
import * as React from "react";
import { initialNavState, navReduce } from "../../application/machines/navigationMachine";
import { initialOttoState, ottoReduce, isOverlayActive } from "../../application/machines/ottoFlowMachine";

const NAV_STORAGE_KEY = "nav";

function initNav(storage) {
  let persisted = null;
  try {
    persisted = storage.get(NAV_STORAGE_KEY);
  } catch {
    persisted = null;
  }
  return persisted ? { ...initialNavState, ...persisted } : initialNavState;
}

const initialData = {
  orders: [],
  ordersLoading: false,
  ordersError: null,
  openScanAvailable: false,
  scan: null,
  recordResult: null,
  flows: [],
  findings: [],
  oldScans: [],
};

// Merge a live finding into `data.findings`: replace the entry with the
// same `id` if present, falling back to a same-`type` match (findings don't
// have a stable id until Task 16's real listFindings() loader runs — the
// realtime path only ever has the bare `{id?, type, ...}` payload), else
// append. Task 16's audit screens render `data.findings` directly.
function mergeFinding(findings, f) {
  let idx = f.id != null ? findings.findIndex((x) => x.id === f.id) : -1;
  if (idx === -1 && f.type != null) idx = findings.findIndex((x) => x.type === f.type);
  if (idx === -1) return [...findings, f];
  const next = findings.slice();
  next[idx] = { ...next[idx], ...f };
  return next;
}

export function useAppController(container) {
  const { usecases, services } = container;
  const { storage } = services;

  const [nav, dispatchNav] = React.useReducer(navReduce, storage, initNav);
  const [otto, dispatchOtto] = React.useReducer(ottoReduce, initialOttoState);
  const [data, setData] = React.useState(initialData);

  // Persist nav on every change; restored on init (see initNav above).
  React.useEffect(() => {
    storage.set(NAV_STORAGE_KEY, nav);
  }, [storage, nav]);

  const refetchOrders = React.useCallback(async () => {
    setData((d) => ({ ...d, ordersLoading: true, ordersError: null }));
    const result = await usecases.orders.listOrders();
    if (result.ok) {
      setData((d) => ({ ...d, orders: result.data.orders, ordersLoading: false }));
    } else {
      setData((d) => ({ ...d, ordersLoading: false, ordersError: result.error }));
    }
  }, [usecases]);

  // Load orders once we're past onboarding (suppliers tab is the default
  // landing tab). Later tasks add lazy per-tab loaders alongside this.
  React.useEffect(() => {
    if (nav.phase === "app") {
      refetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.phase]);

  // Otto open-email scan pre-check: fired once on entering the app phase
  // (mock and Office modes both go through the same emailContext/ottoRepo
  // ports). Success means Scout found a scannable open email — the Orders
  // screen's banner (Task 12) and Task 13's review overlay both key off
  // `data.openScanAvailable`/`data.scan`. Guarded by a ref (not state) so
  // switching tabs back and forth within the same session doesn't re-scan.
  const scannedRef = React.useRef(false);
  React.useEffect(() => {
    if (nav.phase === "app" && !scannedRef.current) {
      scannedRef.current = true;
      usecases.otto.scanOpenEmail().then((result) => {
        if (result.ok) {
          setData((d) => ({ ...d, openScanAvailable: true, scan: result.data }));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.phase]);

  // Otto tab: lazy-load the old/dismissed email list the first time the
  // user opens the "otto" tab (mock-only seam — spec §11.1). Guarded by a
  // ref, same pattern as the open-email scan pre-check above, so navigating
  // away and back doesn't refetch.
  const oldScansLoadedRef = React.useRef(false);
  React.useEffect(() => {
    if (nav.tab === "otto" && !oldScansLoadedRef.current) {
      oldScansLoadedRef.current = true;
      usecases.otto.listOldScans().then((result) => {
        if (result.ok) {
          setData((d) => ({ ...d, oldScans: result.data.scans }));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.tab]);

  const refetchFlows = React.useCallback(async () => {
    const result = await usecases.checkups.listFlows();
    if (result.ok) {
      setData((d) => ({ ...d, flows: result.data.flows }));
    }
    return result;
  }, [usecases]);

  // Check-ups tab: lazy-load flows the first time the user opens the
  // "checkups" tab — same ref-guarded pattern as the otto tab's oldScans
  // above, so navigating away and back doesn't refetch.
  const flowsLoadedRef = React.useRef(false);
  React.useEffect(() => {
    if (nav.tab === "checkups" && !flowsLoadedRef.current) {
      flowsLoadedRef.current = true;
      refetchFlows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.tab]);

  // Only open findings feed the audit screens — dismissing one (or re-running
  // audits) refetches through the same filter, so it drops out everywhere
  // (feed groups, PaneHeader detail title) in one state write.
  const refetchFindings = React.useCallback(async () => {
    const result = await usecases.audit.listFindings({ status: "open" });
    if (result.ok) {
      setData((d) => ({ ...d, findings: result.data.discrepancies }));
    }
    return result;
  }, [usecases]);

  // Audit tab: lazy-load findings the first time the user lands on the
  // "audit" tab (via the nav bar OR the toast's "Review finding" deep link —
  // both flip nav.tab). Ref-guarded like the otto/checkups loaders above.
  const findingsLoadedRef = React.useRef(false);
  React.useEffect(() => {
    if (nav.tab === "audit" && !findingsLoadedRef.current) {
      findingsLoadedRef.current = true;
      refetchFindings();
    }
  }, [nav.tab, refetchFindings]);

  const upsertFinding = React.useCallback((f) => {
    if (!f) return;
    setData((d) => ({ ...d, findings: mergeFinding(d.findings, f) }));
  }, []);

  // Wire realtime exactly once on mount.
  React.useEffect(() => {
    const patchOrder = (updated) => {
      if (!updated || !updated.conversationId) return;
      setData((d) => ({
        ...d,
        orders: d.orders.map((o) => (o.conversationId === updated.conversationId ? { ...o, ...updated } : o)),
      }));
    };

    usecases.realtime.start({
      onSyncCompleted: refetchOrders,
      onOrderUpdated: patchOrder,
      onDiscrepancyFound: (f) => {
        // Store the finding before routing nav — PaneHeader's audit-detail
        // title lookup and Task 16's screens both read `data.findings`.
        upsertFinding(f);
        dispatchNav({ type: "DISCREPANCY_FOUND", key: (f && f.type) ?? "price" });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = React.useMemo(
    () => ({
      signIn: async () => {
        const result = await usecases.session.signIn();
        if (result.ok) dispatchNav({ type: "SIGN_IN" });
      },
      openConnect: () => dispatchNav({ type: "OPEN_CONNECT" }),
      pickErp: (erp) => dispatchNav({ type: "PICK_ERP", erp }),
      connectContinue: () => dispatchNav({ type: "CONNECT_CONTINUE" }),
      toggleOtto: () => dispatchNav({ type: "TOGGLE_OTTO" }),
      toggleInvite: () => dispatchNav({ type: "TOGGLE_INVITE" }),
      finishOnboarding: () => {
        // Fire-and-forget: the sync kickoff shouldn't block landing on Orders.
        usecases.session.completeOnboarding();
        dispatchNav({ type: "FINISH_ONBOARDING" });
      },
      goTab: (tab) => dispatchNav({ type: "GO_TAB", tab }),
      back: () => {
        if (isOverlayActive(otto)) dispatchOtto({ type: "BACK" });
        else dispatchNav({ type: "BACK" });
      },
      dismissBanner: () => dispatchNav({ type: "OTTO_BANNER_DISMISS" }),
      // The scan backing the banner is already loaded (data.scan, from the
      // pre-check effect above) by the time this is clickable, since the
      // banner only renders once that pre-check succeeded.
      ottoReview: () => dispatchOtto({ type: "OPEN_REVIEW" }),
      retryOrders: () => refetchOrders(),

      // --- Otto overlay flow (Task 13) ------------------------------------
      ottoAsk: () => dispatchOtto({ type: "ASK" }),
      ottoSaveEdit: () => dispatchOtto({ type: "SAVE_EDIT" }),
      ottoConfirm: () => dispatchOtto({ type: "CONFIRM" }),
      ottoPickErp: (erp) => dispatchOtto({ type: "PICK_ERP", erp }),
      // Immutably patches the one field being edited on the pre-fetched scan
      // (data.scan.extractedFields) — the edit screen's input and every
      // downstream screen (file-confirm table, verify card) read the same
      // `data.scan.extractedFields` object, so this is the single point of
      // truth for "what Scout will record."
      ottoEditField: (name, value) => {
        setData((d) => ({
          ...d,
          scan: { ...d.scan, extractedFields: { ...d.scan.extractedFields, [name]: value } },
        }));
      },
      // Prototype dismisses the Orders banner once verify completes, in
      // addition to returning the otto machine to idle.
      ottoVerifyDone: () => {
        dispatchOtto({ type: "VERIFY_DONE" });
        dispatchNav({ type: "OTTO_BANNER_DISMISS" });
      },
      // RECORD transitions the machine synchronously (to "files" for Excel,
      // "recording" otherwise) *before* the record call resolves, so the
      // recording screen's spinner is visible for the full duration of the
      // mock's 1700ms delay. Only non-Excel targets record immediately here —
      // the Excel branch waits for a destination pick (ottoPickFile ->
      // ottoConfirmFile/ottoNewSheet below).
      ottoRecord: async () => {
        dispatchOtto({ type: "RECORD" });
        if (otto.selectedErp === "Excel / Sheets") return;
        const result = await usecases.otto.recordScan(data.scan.scanId, {
          selectedResource: "erp:" + otto.selectedErp,
          fields: data.scan.extractedFields,
        });
        if (result.ok) {
          setData((d) => ({ ...d, recordResult: result.data }));
          dispatchOtto({ type: "RECORD_DONE" });
        } else {
          dispatchOtto({ type: "RECORD_FAILED", error: result.error });
        }
      },
      ottoPickFile: (index) => dispatchOtto({ type: "PICK_FILE", index }),
      ottoNewSheet: async () => {
        dispatchOtto({ type: "NEW_SHEET" });
        const result = await usecases.otto.recordScan(data.scan.scanId, {
          selectedResource: "new-sheet",
          fields: data.scan.extractedFields,
        });
        if (result.ok) {
          setData((d) => ({ ...d, recordResult: result.data }));
          dispatchOtto({ type: "RECORD_DONE" });
        } else {
          dispatchOtto({ type: "RECORD_FAILED", error: result.error });
        }
      },
      ottoConfirmFile: async () => {
        dispatchOtto({ type: "CONFIRM_FILE" });
        const destination = (data.scan.destinations || [])[otto.selectedFileIndex];
        const result = await usecases.otto.recordScan(data.scan.scanId, {
          selectedResource: destination && destination.id,
          fields: data.scan.extractedFields,
        });
        if (result.ok) {
          setData((d) => ({ ...d, recordResult: result.data }));
          dispatchOtto({ type: "RECORD_DONE" });
        } else {
          dispatchOtto({ type: "RECORD_FAILED", error: result.error });
        }
      },

      // --- Otto tab: old/dismissed emails (Task 14) -----------------------
      // This flow is driven entirely by the nav machine's `ottoOld` sub-state
      // (list/reinstruct/erp/recorded) — separate from the `otto` overlay
      // machine above, though it reuses `otto.selectedErp`/`ottoPickErp` for
      // its own ERP-selection screen (same shared picker, same state slot).
      ottoOldOpen: (index) => dispatchNav({ type: "OTTO_OLD_OPEN", index }),
      ottoOldConfirm: () => dispatchNav({ type: "OTTO_OLD_CONFIRM" }),
      // Prototype parity: recording a dismissed/older email skips both the
      // Excel files branch and the "recording…" timer screen — it goes
      // straight to the recorded confirmation, so this is a plain, immediate
      // nav transition (no usecases.otto.recordScan round trip to await).
      ottoOldRecord: () => dispatchNav({ type: "OTTO_OLD_RECORD" }),
      ottoOldDone: () => dispatchNav({ type: "OTTO_OLD_DONE" }),

      // --- Check-ups tab (Task 15) -----------------------------------------
      cuOpenVendor: (index) => dispatchNav({ type: "CU_OPEN_VENDOR", index }),
      cuOpenActivity: () => dispatchNav({ type: "CU_OPEN_ACTIVITY" }),
      cuEditStep: (stepIndex) => dispatchNav({ type: "CU_EDIT_STEP", stepIndex }),
      cuOpenAdd: () => dispatchNav({ type: "CU_OPEN_ADD" }),
      cuSaveStep: async (step) => {
        const flow = data.flows[nav.cuVendor];
        if (!flow) return;
        const result = await usecases.checkups.saveStep(flow.flowId, nav.editStepIdx, step);
        if (result.ok) {
          await refetchFlows();
          dispatchNav({ type: "CU_SAVE_STEP" });
        }
      },
      // addStep() appends a blank template step server-side and hands back
      // its index — refetch first so `data.flows` already has the new step
      // by the time CU_EDIT_STEP routes to the edit screen reading it.
      cuAddStep: async () => {
        const flow = data.flows[nav.cuVendor];
        if (!flow) return;
        const result = await usecases.checkups.addStep(flow.flowId);
        if (result.ok) {
          await refetchFlows();
          dispatchNav({ type: "CU_EDIT_STEP", stepIndex: result.data.stepIndex });
        }
      },
      cuCreate: async (input) => {
        const result = await usecases.checkups.createFlow(input);
        if (result.ok) {
          await refetchFlows();
          dispatchNav({ type: "CU_CREATED" });
        }
      },
      cuToggle: async (flowId, on) => {
        const result = await usecases.checkups.toggleFlow(flowId, on);
        if (result.ok) {
          await refetchFlows();
        }
      },
      // The tab-entry effect above (mirrors the otto tab's oldScans loader)
      // covers "ensure oldScans loaded" once nav.tab flips to "otto" here.
      cuActivityToOtto: () => dispatchNav({ type: "CU_ACTIVITY_TO_OTTO" }),

      // --- Audit tab (Task 16) ----------------------------------------------
      auOpenFinding: (key) => dispatchNav({ type: "AU_OPEN_FINDING", key }),
      // PATCH to "dismissed", then refetch (status:"open" filter drops it)
      // and return to the feed. BACK is the nav machine's audit-detail exit.
      auDismiss: async (finding) => {
        if (!finding) return;
        const result = await usecases.audit.setFindingStatus(finding.id, "dismissed");
        if (result.ok) {
          await refetchFindings();
          dispatchNav({ type: "BACK" });
        }
      },
      // Compose handoff: Office hosts get a real compose window, jsdom or a
      // plain browser tab falls back to a mailto: URL (ComposeService seam).
      auOpenReply: (finding) => usecases.audit.openReplyDraft(finding),
      auRerun: () => refetchFindings(),
      toastDismiss: () => dispatchNav({ type: "TOAST_DISMISS" }),
      toastReview: () => dispatchNav({ type: "TOAST_REVIEW" }),
    }),
    [usecases, otto, data, nav, refetchOrders, refetchFlows, refetchFindings]
  );

  return { nav, otto, data, actions };
}
