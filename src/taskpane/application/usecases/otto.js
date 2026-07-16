import { err, CODES } from "../result";

/**
 * @param {{ottoRepo: import("../ports").OttoRepository, emailContext: import("../ports").EmailContextService}} deps
 */
export function createOttoUsecases({ ottoRepo, emailContext }) {
  async function scanOpenEmail() {
    try {
      const email = await emailContext.getOpenEmail();
      if (!email) {
        return err(CODES.NOT_FOUND, "no open email");
      }
      return await ottoRepo.scan({ messageId: email.messageId, conversationId: email.conversationId });
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  async function listOldScans() {
    try {
      return await ottoRepo.listScans();
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  async function recordScan(scanId, body) {
    try {
      return await ottoRepo.record(scanId, body);
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  return { scanOpenEmail, listOldScans, recordScan };
}
