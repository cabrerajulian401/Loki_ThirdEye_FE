/**
 * Onboarding: Connect ERP (dc.html:133-144). Copy is verbatim from the task
 * brief. Reuses the `ErpPicker` primitive (Task 10).
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { ErpPicker, PrimaryButton } from "../../components/primitives";

export function ConnectErpScreen() {
  const { nav, actions } = useApp();

  return (
    <div className="connect-erp-screen">
      <p className="connect-erp-body">
        Pick where Scout writes order data. Otto-Mode and Check-ups use this connection.
      </p>
      <div className="connect-erp-picker-wrap">
        <ErpPicker selected={nav.erp} onPick={actions.pickErp} />
      </div>
      <div className="connect-erp-spacer" />
      <PrimaryButton onClick={actions.connectContinue}>Connect & continue</PrimaryButton>
    </div>
  );
}
