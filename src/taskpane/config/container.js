import { appConfig } from "./app.config";
import { createLocalStorageService } from "../infrastructure/storage/localStorageService";
import { createMockRepos } from "../infrastructure/mock/mockRepos";
import { createMockServices } from "../infrastructure/mock/mockServices";
import { createOverseerClient } from "../infrastructure/http/overseerClient";
import { createHttpRepos } from "../infrastructure/http/httpRepos";
import { createWsGateway } from "../infrastructure/http/wsGateway";
import {
  createOfficeComposeService,
  createOfficeEmailContextService,
  createOfficeAuthService,
} from "../infrastructure/office/officeServices";
import { createSessionUsecases, createRealtimeUsecases } from "../application/usecases/session";
import { createOrderUsecases } from "../application/usecases/orders";
import { createOttoUsecases } from "../application/usecases/otto";
import { createCheckupUsecases } from "../application/usecases/checkups";
import { createAuditUsecases } from "../application/usecases/audit";

/**
 * Composition root — the only place infrastructure adapters (mock/http/office)
 * are wired together into the ports the application layer depends on.
 *
 * @param {Partial<typeof appConfig>} config
 */
export function buildContainer(config = {}) {
  const cfg = {
    ...appConfig,
    ...config,
    auth: { ...appConfig.auth, ...config.auth },
  };

  const storage = createLocalStorageService();
  const mock = createMockServices(storage);

  let auth;
  let emailContext;
  let repos;
  let realtime;

  if (cfg.dataSource === "http") {
    auth =
      cfg.auth.mode === "sso"
        ? createOfficeAuthService({ clientId: cfg.auth.clientId, tenantId: cfg.auth.tenantId, fallback: mock.auth })
        : mock.auth;
    emailContext = createOfficeEmailContextService();
    const client = createOverseerClient({ baseUrl: cfg.apiBaseUrl, getToken: auth.getToken });
    repos = createHttpRepos(client);
    realtime = createWsGateway({ wsUrl: cfg.wsUrl, getToken: auth.getToken });
  } else {
    auth = mock.auth;
    emailContext = mock.emailContext;
    repos = createMockRepos(storage);
    realtime = mock.realtime;
  }

  // Always the Office adapter — it has its own mailto fallback for browsers,
  // so compose works whether the add-in is hosted in Outlook or a plain tab,
  // independent of whether data comes from mock or http.
  const compose = createOfficeComposeService();

  const usecases = {
    session: createSessionUsecases({ auth, orderRepo: repos.orderRepo, realtime, storage }),
    orders: createOrderUsecases({ orderRepo: repos.orderRepo }),
    otto: createOttoUsecases({ ottoRepo: repos.ottoRepo, emailContext }),
    checkups: createCheckupUsecases({ checkupRepo: repos.checkupRepo }),
    audit: createAuditUsecases({ discrepancyRepo: repos.discrepancyRepo, compose }),
    realtime: createRealtimeUsecases({ realtime, auth }),
  };

  return {
    repos,
    services: { auth, emailContext, compose, realtime, storage },
    usecases,
  };
}
