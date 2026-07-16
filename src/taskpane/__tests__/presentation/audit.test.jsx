import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAppAtOrders, __lastContainer } from "./testUtils";

async function gotoAudit() {
  await renderAppAtOrders();
  await userEvent.click(screen.getByRole("button", { name: /Audit/ }));
  await screen.findByText("LIVE · MONITORING 8 ORDERS");
}

it("badge shows before visiting audit and clears after", async () => {
  await renderAppAtOrders();
  expect(screen.getByTestId("audit-badge")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Audit/ }));
  await screen.findByText("LIVE · MONITORING 8 ORDERS");
  expect(screen.queryByTestId("audit-badge")).toBeNull();
});

it("feed groups findings by order", async () => {
  await gotoAudit();
  expect(screen.getByText("PO #4471 · ACME STEEL · 14 MSGS")).toBeInTheDocument();
  expect(screen.getByText("Price changed")).toBeInTheDocument();
  expect(screen.getByText("$41.00 → $42.50 / unit")).toBeInTheDocument();
  expect(screen.getAllByText("HIGH")).toHaveLength(2);
  expect(screen.getByText("Quantity mismatch")).toBeInTheDocument();
});

it("detail shows compare card, evidence, and email CTA; dismiss removes finding", async () => {
  await gotoAudit();
  await userEvent.click(screen.getByText("Price changed"));
  expect(await screen.findByText("+$1.50/unit · +$180 on 120 units")).toBeInTheDocument();
  expect(screen.getByText(/happy to hold pricing at \$41\.00 per unit/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /maria@acmesteel\.com/ })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(await screen.findByText("LIVE · MONITORING 8 ORDERS")).toBeInTheDocument();
  expect(screen.queryByText("Price changed")).toBeNull();
});

it("email CTA opens compose with the drafted reply (mailto fallback in jsdom)", async () => {
  const open = jest.spyOn(window, "open").mockImplementation(() => null);
  await gotoAudit();
  await userEvent.click(screen.getByText("Ship date slipped"));
  await userEvent.click(await screen.findByRole("button", { name: /maria@acmesteel\.com/ }));
  expect(open).toHaveBeenCalledWith(expect.stringContaining("mailto:maria@acmesteel.com"));
  expect(open.mock.calls[0][0]).toContain(encodeURIComponent("PO #4471 — ship date moved"));
  open.mockRestore();
});

it("realtime discrepancy raises the toast; Review finding deep-links", async () => {
  await renderAppAtOrders();
  act(() => {
    __lastContainer().services.realtime._emit("discrepancy.found", { type: "price", title: "Price changed" });
  });
  expect(await screen.findByText("Discrepancy found")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Review finding" }));
  expect(await screen.findByText("+$1.50/unit · +$180 on 120 units")).toBeInTheDocument();
});
