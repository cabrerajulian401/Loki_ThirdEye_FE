/**
 * @typedef {Object} OrderRepository
 * @property {(args?: {status?: string, cursor?: string}) => Promise<Result>} list        // ok: {orders, nextCursor}
 * @property {() => Promise<Result>} startSync                                            // ok: {syncId}
 * @property {() => Promise<Result>} ensureSubscription                                   // ok: {subscriptionId, expiresAt}
 */

/**
 * @typedef {Object} CheckupRepository
 * @property {() => Promise<Result>} listFlows                                            // ok: {flows}
 * @property {(input: any) => Promise<Result>} createFlow                                 // ok: {flow}
 * @property {(flowId: string, on: boolean) => Promise<Result>} setFlowOn                // ok: {flow}
 * @property {(flowId: string, stepIndex: number, step: any) => Promise<Result>} saveStep // ok: {flow}
 * @property {(flowId: string) => Promise<Result>} addStep                                // ok: {flow, stepIndex}
 */

/**
 * @typedef {Object} DiscrepancyRepository
 * @property {(args?: {status?: string}) => Promise<Result>} list                         // ok: {discrepancies}
 * @property {(id: string, status: string) => Promise<Result>} updateStatus              // ok: {discrepancy}
 */

/**
 * @typedef {Object} OttoRepository
 * @property {(args?: {messageId?: string, conversationId?: string}) => Promise<Result>} scan    // ok: {scanId, extractedFields, destinations}
 * @property {(scanId: string, args: {selectedResource?: any, fields?: any}) => Promise<Result>} record // ok: {webUrl, status}
 * @property {() => Promise<Result>} listScans                                            // ok: {scans}
 */

/**
 * @typedef {Object} AuthService
 * @property {() => Promise<Result>} signIn                                               // ok: {user, token}
 * @property {() => string|null} getToken
 * @property {() => boolean} isSignedIn
 */

/**
 * @typedef {Object} EmailContextService
 * @property {() => Promise<Result>} getOpenEmail                                         // Promise<{messageId, conversationId, sender, senderEmail, subject}|null>
 */

/**
 * @typedef {Object} ComposeService
 * @property {(args: {to?: string, subject?: string, body?: string}) => Result} openDraft // ok: {via}
 */

/**
 * @typedef {Object} RealtimeGateway
 * @property {(token: string) => void} connect
 * @property {(eventType: string, handler: Function) => void} on
 * @property {() => void} disconnect
 */

/**
 * @typedef {Object} StorageService
 * @property {(key: string) => any|null} get
 * @property {(key: string, value: any) => void} set
 * @property {(key: string) => void} remove
 */

export {};
