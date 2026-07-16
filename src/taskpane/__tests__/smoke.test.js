describe("test harness", () => {
  it("runs jsdom with RTL matchers", () => {
    document.body.innerHTML = "<div>scout</div>";
    expect(document.querySelector("div")).toHaveTextContent("scout");
  });
});
