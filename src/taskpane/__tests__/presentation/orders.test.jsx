import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAppAtOrders } from "./testUtils";

it("renders header, count, and the 4 seeded order cards in order", async () => {
  await renderAppAtOrders();
  expect(screen.getByText("10 ACTIVE ORDERS")).toBeInTheDocument();
  const cards = screen.getAllByTestId("order-card");
  expect(cards).toHaveLength(4);
  expect(within(cards[0]).getByText("PO #4472")).toBeInTheDocument();
  expect(within(cards[0]).getByText("DELAYED")).toBeInTheDocument();
  expect(within(cards[0]).getByText("Est. Jun 28 → Jul 2")).toBeInTheDocument();
  expect(within(cards[1]).getByText("ON-TIME")).toBeInTheDocument();
  expect(within(cards[1]).getByText(/Shipping Jul 2 — one line item back-ordered/)).toBeInTheDocument();
  expect(within(cards[3]).getByText("DELIVERED")).toBeInTheDocument();
});

it("shows the Otto banner with detected copy; Dismiss hides it persistently", async () => {
  await renderAppAtOrders();
  expect(await screen.findByText("New order info detected")).toBeInTheDocument();
  expect(screen.getByText("5 fields ready to record")).toBeInTheDocument();
  expect(screen.getByText(/Scout found order details in the open email from Maria Chen/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(screen.queryByText("New order info detected")).toBeNull();
});

it("Review & insert opens the Otto review overlay and hides bottom nav", async () => {
  await renderAppAtOrders();
  await userEvent.click(await screen.findByRole("button", { name: "Review & insert" }));
  expect(await screen.findByText("Found in this email")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Check-ups/ })).toBeNull();
});

it("orders load failure renders inline retry state that recovers (spec §8)", async () => {
  const { __lastContainer, renderAppSignedIn } = await import("./testUtils");
  // renderAppSignedIn: like renderAppAtOrders but injects failure BEFORE landing on Orders:
  // sign in on Welcome, call container.repos.orderRepo._failNext({code:"NETWORK", message:"offline"}),
  // then click "Go to Scout".
  await renderAppSignedIn();
  expect(await screen.findByText("COULDN'T LOAD ORDERS — RETRY")).toBeInTheDocument();
  await userEvent.click(screen.getByText("COULDN'T LOAD ORDERS — RETRY"));
  expect(await screen.findByText("10 ACTIVE ORDERS")).toBeInTheDocument();
});
