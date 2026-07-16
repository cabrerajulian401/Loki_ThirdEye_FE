import { ok, err, CODES } from "../result";

/**
 * @param {{auth: import("../ports").AuthService, orderRepo: import("../ports").OrderRepository, realtime: import("../ports").RealtimeGateway, storage: import("../ports").StorageService}} deps
 */
export function createSessionUsecases({ auth, orderRepo, realtime, storage }) {
  async function signIn() {
    try {
      const result = await auth.signIn();
      if (result.ok) {
        storage.set("session", { signedIn: true });
      }
      return result;
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  async function completeOnboarding() {
    try {
      await orderRepo.startSync();
      await orderRepo.ensureSubscription();
      return ok({});
    } catch (e) {
      return ok({});
    }
  }

  function restoreSession() {
    try {
      return storage.get("session");
    } catch (e) {
      return null;
    }
  }

  function resetSession() {
    try {
      storage.remove("session");
    } catch (e) {
      // no-op: reset is best-effort
    }
  }

  return { signIn, completeOnboarding, restoreSession, resetSession };
}

/**
 * @param {{realtime: import("../ports").RealtimeGateway, auth: import("../ports").AuthService}} deps
 */
export function createRealtimeUsecases({ realtime, auth }) {
  function start(handlers = {}) {
    try {
      realtime.connect(auth.getToken());
      if (handlers.onSyncCompleted) {
        realtime.on("sync.completed", handlers.onSyncCompleted);
      }
      if (handlers.onOrderUpdated) {
        realtime.on("order.updated", handlers.onOrderUpdated);
      }
      if (handlers.onDiscrepancyFound) {
        realtime.on("discrepancy.found", handlers.onDiscrepancyFound);
      }
      return ok({});
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  return { start };
}
