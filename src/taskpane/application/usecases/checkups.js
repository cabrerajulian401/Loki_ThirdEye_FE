import { err, CODES } from "../result";

/**
 * @param {{checkupRepo: import("../ports").CheckupRepository}} deps
 */
export function createCheckupUsecases({ checkupRepo }) {
  async function listFlows() {
    try {
      return await checkupRepo.listFlows();
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  async function createFlow(input) {
    try {
      return await checkupRepo.createFlow(input);
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  async function toggleFlow(flowId, on) {
    try {
      return await checkupRepo.setFlowOn(flowId, on);
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  async function saveStep(flowId, stepIndex, step) {
    try {
      return await checkupRepo.saveStep(flowId, stepIndex, step);
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  async function addStep(flowId) {
    try {
      return await checkupRepo.addStep(flowId);
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }
  }

  return { listFlows, createFlow, toggleFlow, saveStep, addStep };
}
