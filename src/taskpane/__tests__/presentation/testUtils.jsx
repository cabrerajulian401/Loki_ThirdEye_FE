import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../presentation/app/App";
import { buildContainer } from "../../config/container";

// Tracks the container from the most recent render helper call below, so
// tests can reach into its repos/services (e.g. orderRepo._failNext) without
// each helper having to thread it back through a bespoke return shape.
let lastContainer = null;

export function __lastContainer() {
  return lastContainer;
}

export async function renderAppAtOrders() {
  localStorage.clear();
  lastContainer = buildContainer({ dataSource: "mock", auth: { mode: "mock" } });
  const utils = render(<App container={lastContainer} />);
  await userEvent.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  await userEvent.click(screen.getByRole("button", { name: "Go to Scout" }));
  await screen.findByText("10 ACTIVE ORDERS");
  return utils;
}

// Like renderAppAtOrders, but injects an orders-load failure BEFORE landing
// on Orders: sign in on Welcome, arm orderRepo._failNext, then click "Go to
// Scout" — so the very first listOrders() call (fired by the controller's
// nav.phase==='app' effect) fails and the Orders screen renders its inline
// retry state (spec §8) instead of the loaded list.
export async function renderAppSignedIn() {
  localStorage.clear();
  lastContainer = buildContainer({ dataSource: "mock", auth: { mode: "mock" } });
  const utils = render(<App container={lastContainer} />);
  await userEvent.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  lastContainer.repos.orderRepo._failNext({ code: "NETWORK", message: "offline" });
  await userEvent.click(screen.getByRole("button", { name: "Go to Scout" }));
  return utils;
}
