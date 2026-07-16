import { createLocalStorageService } from "../../infrastructure/storage/localStorageService";

it("round-trips objects under scout: namespace", () => {
  const s = createLocalStorageService();
  s.set("nav", { tab: "audit" });
  expect(JSON.parse(localStorage.getItem("scout:nav"))).toEqual({ tab: "audit" });
  expect(s.get("nav")).toEqual({ tab: "audit" });
  s.remove("nav");
  expect(s.get("nav")).toBeNull();
});
it("get returns null on corrupt json", () => {
  localStorage.setItem("scout:bad", "{nope");
  expect(createLocalStorageService().get("bad")).toBeNull();
});
