import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../presentation/app/App";
import { buildContainer } from "../../config/container";

const renderApp = () => {
  localStorage.clear();
  return render(<App container={buildContainer({ dataSource: "mock", auth: { mode: "mock" } })} />);
};

it("first run shows Welcome with the four feature rows", () => {
  renderApp();
  expect(screen.getByText("Welcome to Scout")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Sign in with Microsoft/ })).toBeInTheDocument();
  expect(screen.getByText("WHAT SCOUT DOES")).toBeInTheDocument();
  expect(screen.getByText("Reads emails, drafts ERP updates for your OK.")).toBeInTheDocument();
});

it("sign in -> checklist; ERP connect flow marks step done and bumps progress", async () => {
  renderApp();
  await userEvent.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  expect(screen.getByText("Finish setting up")).toBeInTheDocument();
  expect(screen.getByText("1 / 4")).toBeInTheDocument();
  await userEvent.click(screen.getByText("Connect your ERP"));
  expect(screen.getByText("Pick where Scout writes order data. Otto-Mode and Check-ups use this connection.")).toBeInTheDocument();
  await userEvent.click(screen.getByText("QuickBooks"));
  await userEvent.click(screen.getByRole("button", { name: "Connect & continue" }));
  expect(screen.getByText("2 / 4")).toBeInTheDocument();
});

it("Go to Scout lands on Orders with bottom nav", async () => {
  renderApp();
  await userEvent.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  await userEvent.click(screen.getByRole("button", { name: "Go to Scout" }));
  expect(await screen.findByText("Orders")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Check-ups/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Audit/ })).toBeInTheDocument();
});

it("session persists across remount (localStorage nav)", async () => {
  const { unmount } = renderApp();
  await userEvent.click(screen.getByRole("button", { name: /Sign in with Microsoft/ }));
  await userEvent.click(screen.getByRole("button", { name: "Go to Scout" }));
  unmount();
  render(<App container={buildContainer({ dataSource: "mock", auth: { mode: "mock" } })} />);
  expect(await screen.findByText("Orders")).toBeInTheDocument();
});
