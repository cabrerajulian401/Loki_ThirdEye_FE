module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: { "\\.(css|less)$": "identity-obj-proxy" },
  clearMocks: true,
  // Require ".test." in the filename (not just a `__tests__` folder) so
  // shared, non-test helper modules living alongside specs — e.g.
  // presentation/testUtils.jsx — aren't themselves picked up as suites.
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
};
