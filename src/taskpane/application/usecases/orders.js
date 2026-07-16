import { err, CODES } from "../result";

/**
 * @param {{orderRepo: import("../ports").OrderRepository}} deps
 */
export function createOrderUsecases({ orderRepo }) {
  async function listOrders(args = {}) {
    try {
      return await orderRepo.list(args);
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  return { listOrders };
}
