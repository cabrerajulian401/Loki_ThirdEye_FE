import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAppAtOrders } from "./testUtils";

async function gotoCheckups() {
  await renderAppAtOrders();
  await userEvent.click(screen.getByRole("button", { name: /Check-ups/ }));
  await screen.findByText("2 ACTIVE · BY ORDER");
}

it("lists 3 flows with toggles; Vance is paused", async () => {
  await gotoCheckups();
  expect(screen.getByText("Maria Chen")).toBeInTheDocument();
  expect(screen.getByText("⏱ Every 3 days · next Jul 1")).toBeInTheDocument();
  expect(screen.getByText("Paused")).toBeInTheDocument();
  const switches = screen.getAllByRole("switch");
  expect(switches).toHaveLength(3);
  expect(switches[2]).toHaveAttribute("aria-checked", "false");
});

it("toggling Vance on updates cadence to Every 3 days", async () => {
  await gotoCheckups();
  await userEvent.click(screen.getAllByRole("switch")[2]);
  expect(await screen.findByText("3 ACTIVE · BY ORDER")).toBeInTheDocument();
  expect(screen.getAllByText(/Every 3 days/).length).toBeGreaterThanOrEqual(2);
});

it("schedule shows 3 default steps with timing lines; edit step round-trip", async () => {
  await gotoCheckups();
  await userEvent.click(screen.getByText("PO #4471"));
  expect(await screen.findByText("3 STEPS · Every 3 days")).toBeInTheDocument();
  expect(screen.getByText("↻ SENDS DAY 0")).toBeInTheDocument();
  expect(screen.getByText("↻ +3 DAYS IF NO REPLY · EVERY 3 DAYS")).toBeInTheDocument();
  await userEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
  const box = await screen.findByRole("textbox");
  expect(box).toHaveValue("Hi Maria — any update on the ship date for PO #4471?");
  await userEvent.clear(box);
  await userEvent.type(box, "Hola Maria — status?");
  await userEvent.click(screen.getByRole("button", { name: "Save step" }));
  expect(await screen.findByText(/Hola Maria — status\?/)).toBeInTheDocument();
});

it("new check-up prefills Orbit Packaging and creates 4th flow", async () => {
  await gotoCheckups();
  await userEvent.click(screen.getByRole("button", { name: "Add check-up" }));
  expect(await screen.findByRole("textbox"))
    .toHaveValue("Hi Tom — checking in on the status of our latest order. Any update?");
  await userEvent.click(screen.getByRole("button", { name: "Create & turn on" }));
  expect(await screen.findByText("3 ACTIVE · BY ORDER")).toBeInTheDocument();
  expect(screen.getByText("tom@orbitpack.com")).toBeInTheDocument();
});

it("activity timeline + Send to Otto-Mode jumps tab", async () => {
  await gotoCheckups();
  await userEvent.click(screen.getByText("PO #4471"));
  await userEvent.click(await screen.findByText("ACTIVITY"));
  expect(await screen.findByText("Initial check sent")).toBeInTheDocument();
  expect(screen.getByText("Shipping Jul 2 — one line item was back-ordered.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Send to Otto-Mode" }));
  expect(await screen.findByText("Otto-Mode")).toBeInTheDocument();
});
