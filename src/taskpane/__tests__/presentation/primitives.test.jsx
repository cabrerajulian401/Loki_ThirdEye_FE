import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PillTag, Toggle, ErpPicker, TimingSelects } from "../../presentation/components/primitives";

it("PillTag renders label", () => {
  render(<PillTag variant="filled">DELAYED</PillTag>);
  expect(screen.getByText("DELAYED")).toBeInTheDocument();
});

it("Toggle is an accessible switch", async () => {
  const fn = jest.fn();
  render(<Toggle on={false} onChange={fn} ariaLabel="Acme Steel check-up" />);
  const sw = screen.getByRole("switch", { name: "Acme Steel check-up" });
  expect(sw).toHaveAttribute("aria-checked", "false");
  await userEvent.click(sw);
  expect(fn).toHaveBeenCalledWith(true);
});

it("ErpPicker lists the 3 systems and reports picks verbatim", async () => {
  const fn = jest.fn();
  render(<ErpPicker selected="NetSuite" onPick={fn} />);
  expect(screen.getByText("NetSuite")).toBeInTheDocument();
  expect(screen.getByText("QuickBooks")).toBeInTheDocument();
  await userEvent.click(screen.getByText("Excel / Sheets"));
  expect(fn).toHaveBeenCalledWith("Excel / Sheets");
});

it("TimingSelects exposes the 4 prototype selects", () => {
  render(<TimingSelects value={{ send: "day0", cond: "noreply", repeat: "none", stop: "3" }}
    onChange={() => {}} firstLabel="Send this step" />);
  expect(screen.getByLabelText("Send this step")).toHaveValue("day0");
  expect(screen.getByLabelText("Only if")).toHaveValue("noreply");
  expect(screen.getByLabelText("Repeat every")).toHaveValue("none");
  expect(screen.getByLabelText("Stop after")).toHaveValue("3");
});
