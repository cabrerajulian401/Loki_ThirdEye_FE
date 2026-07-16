/**
 * OrderCard (dc.html:158-161) — one row on the Orders screen per seeded
 * order: PO number + status pill, company, a clock/timing line, and the
 * quoted last message + date. Status -> label/variant via the domain rule
 * (Task 2). The delivered card gets the dimmed treatment + checkmark glyph
 * dc.html uses in place of the clock the other three statuses show.
 */
import * as React from "react";
import { PillTag } from "../../components/primitives";
import { ClockIcon, CheckIcon } from "../../icons";
import { statusLabel, pillVariant } from "../../../domain/rules/orderStatus";

export function OrderCard({ order }) {
  const isDelivered = order.status === "delivered";
  const TimingIcon = isDelivered ? CheckIcon : ClockIcon;
  const timingStroke = isDelivered ? "#aaa" : "#141414";

  return (
    <div className={`order-card${isDelivered ? " is-dim" : ""}`} data-testid="order-card">
      <div className="order-card-top">
        <span className="order-card-po">{order.poNumber}</span>
        <PillTag variant={pillVariant(order.status)}>{statusLabel(order.status)}</PillTag>
      </div>
      <div className="order-card-company">{order.company}</div>
      <div className="order-card-timing">
        <TimingIcon size={12} stroke={timingStroke} />
        {order.timingLine}
      </div>
      <div className="order-card-message-row">
        <span className="order-card-message">
          <b>{order.lastMessenger}:</b> “{order.lastMessage}”
        </span>
        <span className="order-card-date">{order.lastMessageDate}</span>
      </div>
    </div>
  );
}
