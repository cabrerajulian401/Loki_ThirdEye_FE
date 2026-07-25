// Gap #9 (http render-readiness): row -> view-model mapping for http-mode
// repos. The Overseer backend's DTOs (shapes documented in
// BE_Docs/Endpoints/*.md) carry the durable business fields; a handful of
// presentation-only fields the seed-shaped screens bind either get derived
// from what the row does carry, or — where the backend genuinely has no
// source data for them yet — fall back to a safe, non-crashing value. Every
// such fallback is a judgment call recorded in .superpowers/sdd/gap9-report.md.
//
// Pure and side-effect-free throughout: no fetch, no throwing on missing
// fields, so these are unit-testable in isolation from httpRepos.js.

import { orderTimingLine, monthDayLabel } from "../../domain/rules/orderTimingLine";
import { flowInitials } from "../../domain/rules/checkupFlows";

// ---- Orders (Order_List_Sync_Onboading.md) --------------------------------

// BE gap: no field named (or confirmed equivalent to) `lastMessenger` shows
// up on the documented read DTO — only the merge-upsert semantics mention it
// server-side. Falls back to "" (OrderCard's `<b>{lastMessenger}:</b>` line
// renders fine blank) rather than guessing at a name.
export function mapOrderRow(row = {}) {
  return {
    ...row,
    timingLine: orderTimingLine(row),
    lastMessenger: row.lastMessenger ?? "",
  };
}

// ---- Discrepancies (Thread_Audit.md) ---------------------------------------

// BE gap: the discrepancy DTO is "stamped from the order row" (company, PO#)
// plus the LLM's finding (title/priority/detail/quotes) — nothing in the
// documented shape counts total thread messages, so the seed's " · N MSGS"
// suffix has no honest source. Rendered without it rather than faking a
// count off `quotes.length` (which is the number of quoted excerpts, not the
// thread's message count, and would look like real data while being wrong).
function threadLabel(row) {
  const parts = [row.poNumber, (row.company || "").toUpperCase() || undefined].filter(Boolean);
  return parts.join(" · ");
}

// BE gap: draftReply — FindDiscrepancies (Thread_Audit.md) produces only
// title/priority/detail/quotes; nothing in the documented pipeline drafts a
// reply email. usecases/audit.js's openReplyDraft reads
// `finding.draftReply.subject`/`.body` unguarded, so the fallback must be a
// real object, never undefined/null.
const EMPTY_DRAFT_REPLY = Object.freeze({ subject: "", body: "" });

// BE gap: contactEmail — Thread_Audit.md's "stamped from the order row" list
// (account/user/company/PO) never mentions a contact email address, and the
// Order DTO has no documented contact-email field either. Falls back to "".
export function mapDiscrepancyRow(row = {}) {
  return {
    ...row,
    threadLabel: threadLabel(row),
    initials: flowInitials(row.contactName || ""),
    contactEmail: row.contactEmail ?? "",
    draftReply:
      row.draftReply && typeof row.draftReply === "object" ? row.draftReply : EMPTY_DRAFT_REPLY,
  };
}

// ---- Otto scan destinations (Otto.md) --------------------------------------

// BE gap: RankDestinations resolves the model's `{index, name}` back to real
// drive items at the gateway (Otto.md design #3) — no explanatory "why this
// matched" text is part of the documented shape, so subtitle/matchNote fall
// back to "" when a row doesn't carry them. isBestMatch is a pure position
// rule per the brief: destinations arrive ranked, first-ranked is the best
// match — no LLM-authored flag needed.
export function mapDestinationRow(row = {}, index) {
  row = row || {};
  return {
    ...row,
    subtitle: row.subtitle ?? "",
    isBestMatch: index === 0,
    matchNote: row.matchNote ?? "",
  };
}

export function mapDestinations(rows) {
  return (rows || []).map((row, index) => mapDestinationRow(row, index));
}

// ---- Checkup flows (Checkups.md) -------------------------------------------

// BE gap: poNumber — the POST /checkups payload (companyName, emailAddress,
// subject, body, sendDate, cancelIfReply, repeatFlow, repeatEveryDays,
// conversationId) never carries a PO number, and GET /checkups rows mirror
// that same shape, so there is nothing to derive it from. Falls back to "".
// initials reuses flowInitials per the brief. next is the earliest pending
// row's sendDate (soonest-first is also GET /checkups' own sort order per
// Checkups.md), formatted the same "MMM D" way as orderTimingLine's dates;
// "" when nothing is pending (matches the seed's paused-flow example).
export function checkupFlowExtras(flowRows) {
  const rows = flowRows || [];
  const first = rows[0] || {};
  const pending = rows
    .filter((r) => r.status === "pending")
    .sort((a, b) => new Date(a.sendDate) - new Date(b.sendDate));
  return {
    poNumber: first.poNumber ?? "",
    initials: flowInitials(first.contactName || ""),
    next: pending.length ? monthDayLabel(pending[0].sendDate) : "",
  };
}
