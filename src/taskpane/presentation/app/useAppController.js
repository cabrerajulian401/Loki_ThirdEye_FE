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
      onDiscrepancyFound: (f) => dispatchNav({ type: "DISCREPANCY_FOUND", key: (f && f.type) ?? "price" }),
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
    }),
    [usecases, otto]
  );

  return { nav, otto, data, actions };
}
