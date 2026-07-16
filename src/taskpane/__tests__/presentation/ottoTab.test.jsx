import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../presentation/app/App";
import { buildContainer } from "../../config/container";
import { renderAppAtOrders } from "./testUtils";

async function gotoOttoTab() {
  await renderAppAtOrders();
  await userEvent.click(screen.getByRole("button", { name: /^Otto$/ }));
  await screen.findByText("Otto-Mode");
}

it("lists the 3 old/dismissed emails", async () => {
  await gotoOttoTab();
  expect(screen.getByText("RE: PO #4471 ship date")).toBeInTheDocument();
  expect(screen.getByText("DISMISSED")).toBeInTheDocument();
  expect(screen.getAllByText("OLDER")).toHaveLength(2);
  expect(screen.getByText("jess@vancecomp.com")).toBeInTheDocument();
});

// Regression (final whole-branch review, Critical 1): nav persists in
// localStorage but data.oldScans starts [] — a reload landing directly on
// the reinstruct screen must not throw on the missing email (white pane
// forever); it renders nothing until the lazy oldScans load lands, then
// shows the screen. Can't use the render helpers here: they clear
// localStorage themselves, and this test must seed `scout:nav` BEFORE render.
it("reload with persisted otto reinstruct nav renders once oldScans load (no crash)", async () => {
  localStorage.clear();
  localStorage.setItem(
    "scout:nav",
    JSON.stringify({ phase: "app", tab: "otto", ottoOld: "reinstruct", ottoOldIndex: 0 })
  );
  const container = buildContainer({ dataSource: "mock", auth: { mode: "mock" } });
  expect(() => render(<App container={container} />)).not.toThrow();
  expect(await screen.findByText("DISMISSED JUN 20 · RE-OPENED")).toBeInTheDocument();
});

it("record flow: reinstruct -> erp -> recorded -> done back to list", async () => {
  await gotoOttoTab();
  await userEvent.click(screen.getAllByRole("button", { name: "Record" })[0]);
  expect(await screen.findByText("DISMISSED JUN 20 · RE-OPENED")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Confirm & record" }));
  expect(await screen.findByText("Scout will write Order #4471 from this older email here.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Record to NetSuite" }));
  expect(await screen.findByText("Added from older email")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Verify & done" }));
  expect(await screen.findByText("Otto-Mode")).toBeInTheDocument();
});
