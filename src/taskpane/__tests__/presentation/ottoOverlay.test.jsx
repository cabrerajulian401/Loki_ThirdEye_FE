import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAppAtOrders, __lastContainer } from "./testUtils";

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

// Regression (final whole-branch review, Important 5): a failed record must
// surface otto.error on the screen RECORD_FAILED routes back to, not fail
// silently. `_failNext` wraps record() via the repo's failable decorator, so
// the armed error resolves immediately (no 1700ms timer).
it("failed non-Excel record returns to the ERP screen with the error line", async () => {
  await openReview();
  await user.click(screen.getByRole("button", { name: "Confirm" }));
  await user.click(screen.getByText("QuickBooks"));
  __lastContainer().repos.ottoRepo._failNext({ code: "UPSTREAM", message: "scan failed" });
  await user.click(screen.getByRole("button", { name: "Record to QuickBooks" }));
  await act(async () => { jest.advanceTimersByTime(1700); });
  expect(await screen.findByText("COULDN'T RECORD — SCAN FAILED")).toBeInTheDocument();
  expect(screen.getByText("Which system should I update?")).toBeInTheDocument();
});

// Same family + the OttoFileConfirm guard (Critical 1): a failed new-sheet
// record routes back to fileConfirm with selectedFileIndex 2 (no destination
// behind it) — the screen must render (sans file header) with the error line
// instead of crashing on destinations[2].name.
it("failed new-sheet record returns to file-confirm with the error line (no crash)", async () => {
  await openReview();
  await user.click(screen.getByRole("button", { name: "Confirm" }));
  await user.click(screen.getByText("Excel / Sheets"));
  await user.click(screen.getByRole("button", { name: "Record to Excel / Sheets" }));
  await screen.findByText("I found where this belongs");
  __lastContainer().repos.ottoRepo._failNext({ code: "UPSTREAM", message: "sheet create failed" });
  await user.click(screen.getByRole("button", { name: "Record to a new sheet instead" }));
  await act(async () => { jest.advanceTimersByTime(1700); });
  expect(await screen.findByText("COULDN'T RECORD — SHEET CREATE FAILED")).toBeInTheDocument();
  expect(screen.getByText("Continue editing this sheet")).toBeInTheDocument();
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
