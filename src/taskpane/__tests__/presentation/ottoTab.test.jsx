import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
