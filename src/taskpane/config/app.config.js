export const appConfig = {
  // 'mock' | 'http' — mock stays the default until Overseer's on-behalf-of
  // exchange lands (until then Graph-backed reads 502 and orders stay empty).
  // Flip to "http" to hit the live backend.
  dataSource: "mock",
  apiBaseUrl: "https://overseer.jollyfield-8dc50d6e.centralus.azurecontainerapps.io", // Overseer on Azure Container Apps
  wsUrl: "wss://overseer.jollyfield-8dc50d6e.centralus.azurecontainerapps.io/ws",
  // 'sso' tries OfficeRuntime.auth.getAccessToken (silent for signed-in Outlook
  // users; one-time Microsoft consent dialog on first run) and falls back to
  // mock sign-in outside Office or if SSO fails.
  auth: {
    mode: "sso",
    clientId: "87c43ea2-88ae-4034-acf1-da843b626893",
    tenantId: "82c8098b-11b0-4577-9c27-1e8869f85b52",
  },
};
