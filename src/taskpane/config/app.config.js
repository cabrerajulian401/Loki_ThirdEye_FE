export const appConfig = {
  // 'mock' | 'http' — mock stays the default until (a) real Graph tokens exist
  // (Azure AD app registration + auth.mode 'sso') and (b) the http row→view-model
  // mapping lands (building journal gap #9). Flip to "http" to hit the live backend.
  dataSource: "mock",
  apiBaseUrl: "https://overseer.jollyfield-8dc50d6e.centralus.azurecontainerapps.io", // Overseer on Azure Container Apps
  wsUrl: "wss://overseer.jollyfield-8dc50d6e.centralus.azurecontainerapps.io/ws",
  auth: { mode: "mock", clientId: "00000000-0000-0000-0000-000000000000", tenantId: "common" },
};
