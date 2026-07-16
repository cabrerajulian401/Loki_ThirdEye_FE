import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAppAtOrders } from "./testUtils";

jest.useFakeTimers();
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

async function openReview() {
  await renderAppAtOrders();
  await user.click(await screen.findByRole("button", { name: "Review & insert" }));
  await screen.findByText("Found in this email");
}

it("review shows the 5 extracted fields", async () => {
  await openReview();
  expect(screen.getByText("ORDER #")).toBeInTheDocument();
  expect(screen.getByText("4471")).toBeInTheDocument();
  expect(screen.getByText("3/8″ plate × 120")).toBeInTheDocument();
  expect(screen.getByText("was Jun 28")).toBeInTheDocument();
  expect(screen.getByText("$42.50")).toBeInTheDocument();
});

it("editing the ship date flows into file-confirm table", async () => {
  await openReview();
  await user.click(screen.getByRole("button", { name: "Ask Scout" }));
  const input = screen.getByLabelText("SHIP DATE");
  await user.clear(input);
  await user.type(input, "Jul 9");
  await user.click(screen.getByRole("button", { name: "Save & continue" }));
  await user.click(screen.getByText("Excel / Sheets"));
  await user.click(screen.getByRole("button", { name: "Record to Excel / Sheets" }));
  await screen.findByText("I found where this belongs");
  await user.click(screen.getByText("Acme Steel — 2026 POs.xlsx"));
  expect(await screen.findByText("Continue editing this sheet")).toBeInTheDocument();
  expect(screen.getByText("Jul 9")).toBeInTheDocument();
});

it("non-Excel skips files: recording then verify", async () => {
  await openReview();
  await user.click(screen.getByRole("button", { name: "Confirm" }));
  await user.click(screen.getByText("QuickBooks"));
  await user.click(screen.getByRole("button", { name: "Record to QuickBooks" }));
  expect(screen.getByText("Recording to QuickBooks…")).toBeInTheDocument();
  await act(async () => { jest.advanceTimersByTime(1700); });
  expect(await screen.findByText("Recorded — please verify")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Verify & done" }));
  expect(await screen.findByText("10 ACTIVE ORDERS")).toBeInTheDocument();
  expect(screen.queryByText("New order info detected")).toBeNull(); // banner dismissed after verify
});

it("full Excel path reaches verify with sheet link", async () => {
  await openReview();
  await user.click(screen.getByRole("button", { name: "Confirm" }));
  await user.click(screen.getByText("Excel / Sheets"));
  await user.click(screen.getByRole("button", { name: "Record to Excel / Sheets" }));
  await user.click(await screen.findByText("Acme Steel — 2026 POs.xlsx"));
  await user.click(screen.getByRole("button", { name: "Continue & update sheet" }));
  await act(async () => { jest.advanceTimersByTime(1700); });
  expect(await screen.findByText("Recorded — please verify")).toBeInTheDocument();
});
