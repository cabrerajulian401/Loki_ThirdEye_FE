export const appConfig = {
  dataSource: "mock", // 'mock' | 'http'
  apiBaseUrl: "https://localhost:8080", // Overseer — set when deployed
  wsUrl: "wss://localhost:8080/ws",
  auth: { mode: "mock", clientId: "00000000-0000-0000-0000-000000000000", tenantId: "common" },
};
