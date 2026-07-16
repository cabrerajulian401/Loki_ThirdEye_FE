// Mock seed data — transcribed verbatim from the design prototype
// (.claude/assets/design_handoff_scout_addin/Scout Prototype.dc.html).
//
// Prototype "send/cond/repeat/stop" labels are stored here using the domain's
// code values (see domain/rules/timingLine.js + checkupTransitions.js), per
// this mapping:
//   send:   'Day 0' -> 'day0' | '+1 day' -> '+1' | '+2 days' -> '+2'
//           '+3 days' -> '+3' | '+5 days' -> '+5' | '+7 days' -> '+7'
//   cond:   'Always send' -> 'always' | 'No reply yet' -> 'noreply'
//   repeat: "Don't repeat" -> 'none' | '2 days' -> '2d' | '3 days' -> '3d' | 'Weekly' -> 'weekly'
//   stop:   '1 try' -> '1' | '2 tries' -> '2' | '3 tries' -> '3' | '5 tries' -> '5'

// dc.html defaultSteps() (lines 515-521) — used verbatim for every seeded flow.
function defaultSteps() {
  return [
    {
      name: "Initial check",
      message: "Hi Maria — any update on the ship date for PO #4471?",
      send: "day0",
      cond: "always",
      repeat: "none",
      stop: "3",
    },
    {
      name: "Follow-up",
      message: "Just following up on my note about PO #4471 — thanks!",
      send: "+3",
      cond: "noreply",
      repeat: "3d",
      stop: "3",
    },
    {
      name: "Final nudge",
      message: "",
      send: "+3",
      cond: "noreply",
      repeat: "none",
      stop: "1",
    },
  ];
}

// dc.html addStep() new-step template (line 713), code-value form.
export const newStepTemplate = { name: "New step", message: "", send: "+3", cond: "noreply", repeat: "none", stop: "1" };

// dc.html renderVals() poByVendor map (line 583).
export const poByVendor = {
  "Acme Steel": "PO #4471",
  "Delmar Tooling": "PO #4472",
  "Vance Components": "PO #4468",
  "Orbit Packaging": "PO #4459",
};

// dc.html createCheck() cadMap (line 721), code-value keys.
export const repeatToCadence = {
  none: "One-time",
  "2d": "Every 2 days",
  "3d": "Every 3 days",
  weekly: "Weekly",
};

// Orders — dc.html lines 158-161 (SUPPLIERS HOME cards), in prototype order.
export const orders = [
  {
    poNumber: "PO #4472",
    company: "Delmar Tooling",
    status: "delayed",
    timingLine: "Est. Jun 28 → Jul 2",
    lastMessenger: "Ray",
    lastMessage: "Confirming a revised lead time shortly.",
    lastMessageDate: "Jun 24",
    conversationId: "conv-4472",
  },
  {
    poNumber: "PO #4471",
    company: "Acme Steel",
    status: "on-time",
    timingLine: "Est. Jul 2",
    lastMessenger: "Maria",
    lastMessage: "Shipping Jul 2 — one line item back-ordered.",
    lastMessageDate: "Jun 27",
    conversationId: "conv-4471",
  },
  {
    poNumber: "PO #4468",
    company: "Vance Components",
    status: "quote-pending",
    timingLine: "Est. Jul 8 · awaiting quote",
    lastMessenger: "You",
    lastMessage: "Following up on the bracket quote.",
    lastMessageDate: "Jun 25",
    conversationId: "conv-4468",
  },
  {
    poNumber: "PO #4459",
    company: "Orbit Packaging",
    status: "delivered",
    timingLine: "Delivered Jun 24",
    lastMessenger: "Orbit",
    lastMessage: "Delivered — signed POD attached.",
    lastMessageDate: "Jun 24",
    conversationId: "conv-4459",
  },
];

// dc.html line 156.
export const ordersCountLabel = "10 ACTIVE ORDERS";

// Otto overlay: open-email scan — dc.html "OTTO OVERLAY: REVIEW" (172-176)
// and "OTTO OVERLAY: FOUND FILES" (218-224).
export const ottoOpenScan = {
  scanId: "scan-4471",
  extractedFields: {
    orderNumber: "4471",
    vendor: "Acme Steel",
    item: "3/8″ plate × 120",
    shipDate: "Jul 2",
    shipDateWas: "Jun 28",
    unitPrice: "$42.50",
  },
  destinations: [
    {
      id: "0",
      name: "Acme Steel — 2026 POs.xlsx",
      subtitle: "Sheet “Open Orders” · edited 2 days ago",
      isBestMatch: true,
      matchNote: "Row for PO #4471 already exists",
    },
    {
      id: "1",
      name: "Q3 Procurement Tracker.xlsx",
      subtitle: "Sheet “Steel Orders” · edited Jun 20",
      isBestMatch: false,
      matchNote: "Matched vendor Acme Steel",
    },
  ],
};

// Otto tab: old/dismissed email list — dc.html "OTTO TAB: OLD EMAIL LIST"
// (280-286) plus "OTTO TAB: REINSTRUCT" (293-306) for the dismissed one.
export const ottoOldEmails = [
  {
    id: "old-4471",
    subject: "RE: PO #4471 ship date",
    badge: "DISMISSED",
    summary: "Ship date moved to Jul 2 with a new unit price — order update.",
    sender: "Maria Chen",
    senderEmail: "maria@acmesteel.com",
    initials: "MC",
    company: "Acme Steel",
    reinstructLabel: "DISMISSED JUN 20 · RE-OPENED",
    reinstructFields: { orderNumber: "4471", shipDate: "Jul 2", unitPrice: "$42.50" },
    sourceLabel: "Dismissed · Jun 20",
  },
  {
    id: "old-4468",
    subject: "Quote — bracket assembly",
    badge: "OLDER",
    summary: "New supplier quote with pricing per unit — quote request.",
    sender: "Jess Dunn",
    senderEmail: "jess@vancecomp.com",
    initials: "JD",
    company: "Vance Components",
    reinstructLabel: "OLDER · RE-OPENED",
    reinstructFields: { orderNumber: "4468", vendor: "Vance Components" },
    sourceLabel: "Older",
  },
  {
    id: "old-4459",
    subject: "Delivered: order #4459",
    badge: "OLDER",
    summary: "Confirms delivery date for a completed order — delivery notice.",
    sender: "Tom Silva",
    senderEmail: "tom@orbitpack.com",
    initials: "TS",
    company: "Orbit Packaging",
    reinstructLabel: "OLDER · RE-OPENED",
    reinstructFields: { orderNumber: "4459", vendor: "Orbit Packaging" },
    sourceLabel: "Older",
  },
];

// Check-up flows — dc.html initialState().checks (531-535) + defaultSteps()
// (515-521) + activity timeline for Acme (415-426).
export const checkupFlows = [
  {
    flowId: "flow-4471",
    poNumber: "PO #4471",
    companyName: "Acme Steel",
    contactName: "Maria Chen",
    emailAddress: "maria@acmesteel.com",
    initials: "MC",
    on: true,
    cadence: "Every 3 days",
    next: "Jul 1",
    steps: defaultSteps(),
    activity: [
      { label: "Initial check sent", detail: "Any update on the ship date for PO #4471?", timestamp: "JUN 24 · 9:00 AM" },
      { label: "Follow-up sent", detail: "No reply after 3 days — auto follow-up.", timestamp: "JUN 27 · 9:00 AM" },
      {
        label: "Maria Chen replied",
        detail: "Shipping Jul 2 — one line item was back-ordered.",
        timestamp: "JUN 27 · 2:14 PM · CHECK PAUSED",
      },
    ],
  },
  {
    flowId: "flow-4472",
    poNumber: "PO #4472",
    companyName: "Delmar Tooling",
    contactName: "Ray Park",
    emailAddress: "ray@delmartool.com",
    initials: "RP",
    on: true,
    cadence: "Weekly",
    next: "Jul 3",
    steps: defaultSteps(),
  },
  {
    flowId: "flow-4468",
    poNumber: "PO #4468",
    companyName: "Vance Components",
    contactName: "Jess Dunn",
    emailAddress: "jess@vancecomp.com",
    initials: "JD",
    on: false,
    cadence: "Paused",
    next: "",
    steps: defaultSteps(),
  },
];

// dc.html "CHECK-UPS: ADD" openAdd() prefill (line 719) + poByVendor.
export const newCheckupPrefill = {
  companyName: "Orbit Packaging",
  contactName: "Tom Silva",
  emailAddress: "tom@orbitpack.com",
  message: "Hi Tom — checking in on the status of our latest order. Any update?",
  poNumber: "PO #4459",
  send: "day0",
  cond: "noreply",
  repeat: "none",
  stop: "3",
};

// Audit findings — dc.html findingData() (557-576).
export const findings = {
  price: {
    id: "finding-price",
    type: "price",
    status: "open",
    priority: "HIGH",
    title: "Price changed",
    threadLabel: "PO #4471 · ACME STEEL · 14 MSGS",
    company: "Acme Steel",
    poNumber: "PO #4471",
    contactName: "Maria Chen",
    contactEmail: "maria@acmesteel.com",
    initials: "MC",
    detail: { leftLabel: "QUOTED", left: "$41.00", rightLabel: "BILLED", right: "$42.50", impact: "+$1.50/unit · +$180 on 120 units" },
    quotes: [
      { author: "Maria Chen", date: "May 3", text: "…happy to hold pricing at $41.00 per unit for this PO.", emphasized: false },
      { author: "Maria Chen", date: "Jun 27", text: "Pricing holds at $42.50/unit. Revised PO attached.", emphasized: true },
    ],
    draftReply: {
      subject: "PO #4471 — pricing discrepancy",
      body:
        "Hi Maria,\n\nQuick flag on PO #4471 — the revised PO bills $42.50/unit, but our thread on May 3 confirmed $41.00/unit. On 120 units that's a $180 difference.\n\nCan you confirm the correct price before we proceed?",
    },
  },
  time: {
    id: "finding-time",
    type: "time",
    status: "open",
    priority: "MED",
    title: "Ship date slipped",
    threadLabel: "PO #4471 · ACME STEEL · 14 MSGS",
    company: "Acme Steel",
    poNumber: "PO #4471",
    contactName: "Maria Chen",
    contactEmail: "maria@acmesteel.com",
    initials: "MC",
    detail: { leftLabel: "CONFIRMED", left: "Jun 28", rightLabel: "LATEST", right: "Jul 2", impact: "+4 days · no revised PO issued" },
    quotes: [
      { author: "Maria Chen", date: "Jun 10", text: "On track to ship Jun 28 as agreed.", emphasized: false },
      { author: "Maria Chen", date: "Jun 27", text: "We can ship on Jul 2 instead of Jun 28.", emphasized: true },
    ],
    draftReply: {
      subject: "PO #4471 — ship date moved",
      body:
        "Hi Maria,\n\nFollowing up on PO #4471 — you confirmed Jun 28 on Jun 10, but the latest email moves it to Jul 2 with no revised PO. Can you confirm the committed ship date?",
    },
  },
  qty: {
    id: "finding-qty",
    type: "qty",
    status: "open",
    priority: "HIGH",
    title: "Quantity mismatch",
    threadLabel: "PO #4472 · DELMAR TOOLING · 9 MSGS",
    company: "Delmar Tooling",
    poNumber: "PO #4472",
    contactName: "Ray Park",
    contactEmail: "ray@delmartool.com",
    initials: "RP",
    detail: { leftLabel: "ORDERED", left: "150", rightLabel: "SHIPPING", right: "120", impact: "30 units unaccounted for" },
    quotes: [
      { author: "You", date: "May 3", text: "PO for 150 units of 3/8″ plate.", emphasized: false },
      { author: "Ray Park", date: "Jun 27", text: "We can ship 120 units — one line item is back-ordered.", emphasized: true },
    ],
    draftReply: {
      subject: "#4472 — quantity mismatch",
      body:
        "Hi Ray,\n\nOn #4472 we ordered 150 units, but the latest note ships 120 — 30 units unaccounted for. Can you confirm the status of the remaining 30?",
    },
  },
};

// Open email (reading pane) — dc.html lines 74-83.
export const openEmail = {
  messageId: "msg-4471",
  conversationId: "conv-4471",
  sender: "Maria Chen",
  senderEmail: "maria@acmesteel.com",
  subject: "RE: PO #4471 — revised ship date",
};

export const seed = {
  orders,
  ordersCountLabel,
  ottoOpenScan,
  ottoOldEmails,
  checkupFlows,
  newCheckupPrefill,
  findings,
  openEmail,
};
