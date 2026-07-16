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

// Detection mirrors @testing-library/dom's internal jestFakeTimersAreEnabled.
// Plain `userEvent.click()` internally awaits a real `setTimeout` (delay: 0
// by default) — under Jest's fake timers that timer is captured and never
// fires unless something advances the clock, hanging forever. Suites that
// opt into fake timers (e.g. ottoOverlay.test.jsx, to drive the 1700ms mock
// record delay) need every click routed through an `advanceTimers`-aware
// instance instead; suites on real timers keep using the plain module so
// nothing changes for them.
function fakeTimersActive() {
  return (
    typeof jest !== "undefined" &&
    jest !== null &&
    (setTimeout._isMockFunction === true || Object.prototype.hasOwnProperty.call(setTimeout, "clock"))
  );
}

function getUser() {
  return fakeTimersActive() ? userEvent.setup({ advanceTimers: jest.advanceTimersByTime }) : userEvent;
}

export async function renderAppAtOrders() {
  localStorage.clear();
  lastContainer = buildContainer({ dataSource: "mock", auth: { mode: "mock" } });
  const utils = render(<App container={lastContainer} />);
  const user = getUser();
  await user.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  // `findByRole` (not `getByRole`): signIn is async (usecases.session.signIn ->
  // auth.signIn), so under fake timers the SIGN_IN dispatch lands a few
  // microtask turns after the click resolves — `find*` polls (and, per
  // @testing-library/dom, advances fake timers itself) until the checklist
  // screen's button actually appears instead of asserting on the first tick.
  await user.click(await screen.findByRole("button", { name: "Go to Scout" }));
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
  const user = getUser();
  await user.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  lastContainer.repos.orderRepo._failNext({ code: "NETWORK", message: "offline" });
  await user.click(await screen.findByRole("button", { name: "Go to Scout" }));
  return utils;
}
