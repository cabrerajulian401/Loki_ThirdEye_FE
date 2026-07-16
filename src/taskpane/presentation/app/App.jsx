/**
 * App shell: composes the controller + context around a single screen
 * switch (no router) plus the pane header/bottom nav chrome. See the task
 * brief's title map + render map for the exact routing rules this mirrors.
 */
import * as React from "react";
import { AppContext } from "./AppContext";
import { useAppController } from "./useAppController";
import { isOverlayActive } from "../../application/machines/ottoFlowMachine";
import { PaneHeader } from "../components/PaneHeader";
import { BottomNav } from "../components/BottomNav";
import { WelcomeScreen } from "../screens/onboarding/WelcomeScreen";
import { ChecklistScreen } from "../screens/onboarding/ChecklistScreen";
import { ConnectErpScreen } from "../screens/onboarding/ConnectErpScreen";
import { OrdersScreen } from "../screens/orders/OrdersScreen";
import { OttoReview } from "../screens/otto/OttoReview";
import { OttoEdit } from "../screens/otto/OttoEdit";
import { OttoErp } from "../screens/otto/OttoErp";
import { OttoFiles } from "../screens/otto/OttoFiles";
import { OttoFileConfirm } from "../screens/otto/OttoFileConfirm";
import { OttoRecording } from "../screens/otto/OttoRecording";
import { OttoVerify } from "../screens/otto/OttoVerify";

/* Otto overlay steps (Task 13). */
const OTTO_OVERLAY_SCREENS = {
  review: OttoReview,
  edit: OttoEdit,
  erp: OttoErp,
  files: OttoFiles,
  fileConfirm: OttoFileConfirm,
  recording: OttoRecording,
  verify: OttoVerify,
};

/* Otto tab (Task 14 replaces these), by nav.ottoOld. */
const OTTO_TAB_SCREENS = {
  list: () => <div>Otto old-scan list placeholder</div>,
  reinstruct: () => <div>Otto reinstruct placeholder</div>,
  erp: () => <div>Otto old-scan erp placeholder</div>,
  recorded: () => <div>Otto recorded placeholder</div>,
};

/* Check-ups tab (Task 15 replaces these), by nav.cuView. */
const CHECKUPS_SCREENS = {
  list: () => <div>Check-ups list placeholder</div>,
  schedule: () => <div>Check-up schedule placeholder</div>,
  editStep: () => <div>Check-up edit step placeholder</div>,
  add: () => <div>Check-up add placeholder</div>,
  activity: () => <div>Check-up activity placeholder</div>,
};

/* Audit tab (Task 16 replaces these), by nav.auditView. */
const AUDIT_SCREENS = {
  feed: () => <div>Audit feed placeholder</div>,
  detail: () => <div>Audit detail placeholder</div>,
};

function renderScreen(nav, otto) {
  if (nav.phase === "onboarding") {
    if (nav.onb === "checklist") return <ChecklistScreen />;
    if (nav.onb === "connect") return <ConnectErpScreen />;
    return <WelcomeScreen />;
  }

  if (isOverlayActive(otto)) {
    const Screen = OTTO_OVERLAY_SCREENS[otto.step];
    return Screen ? <Screen /> : null;
  }

  switch (nav.tab) {
    case "otto": {
      const Screen = OTTO_TAB_SCREENS[nav.ottoOld] || OTTO_TAB_SCREENS.list;
      return <Screen />;
    }
    case "checkups": {
      const Screen = CHECKUPS_SCREENS[nav.cuView] || CHECKUPS_SCREENS.list;
      return <Screen />;
    }
    case "audit": {
      const Screen = AUDIT_SCREENS[nav.auditView] || AUDIT_SCREENS.feed;
      return <Screen />;
    }
    case "suppliers":
    default:
      return <OrdersScreen />;
  }
}

export function App({ container }) {
  const controller = useAppController(container);
  const { nav, otto } = controller;
  const showNav = nav.phase === "app" && !isOverlayActive(otto);

  return (
    <AppContext.Provider value={controller}>
      <div className="pane">
        <PaneHeader />
        <div className="pane-body">{renderScreen(nav, otto)}</div>
        {showNav && <BottomNav />}
      </div>
    </AppContext.Provider>
  );
}
