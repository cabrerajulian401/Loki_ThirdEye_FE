import { err, CODES } from "../result";

/**
 * @param {{discrepancyRepo: import("../ports").DiscrepancyRepository, compose: import("../ports").ComposeService}} deps
 */
export function createAuditUsecases({ discrepancyRepo, compose }) {
  async function listFindings({ status } = {}) {
    try {
      return await discrepancyRepo.list({ status });
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  async function setFindingStatus(id, status) {
    try {
      return await discrepancyRepo.updateStatus(id, status);
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  async function openReplyDraft(finding) {
    try {
      return await compose.openDraft({
        to: finding.contactEmail,
        subject: finding.draftReply.subject,
        body: finding.draftReply.body,
      });
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  return { listFindings, setFindingStatus, openReplyDraft };
}
