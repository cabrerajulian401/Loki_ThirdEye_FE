/**
 * Orders / Suppliers Home screen (dc.html:146-165). Composes the Otto
 * banner (when a scan is ready and not dismissed), the header row (title +
 * mono active-count + static sort chip), and one OrderCard per seeded
 * order — with inline loading/error states around `data.orders` (spec §8).
 */
import * as React from "react";
import { useApp } from "../../app/AppContext";
import { MonoLabel, Spinner, pressableProps } from "../../components/primitives";
import { OttoBanner } from "./OttoBanner";
import { OrderCard } from "./OrderCard";

export function OrdersScreen() {
  const { nav, data, actions } = useApp();
  const showBanner = data.openScanAvailable && !nav.ottoBannerDismissed;
  const showSpinner = data.ordersLoading && data.orders.length === 0 && !data.ordersError;

  return (
    <div className="orders-screen">
      {showBanner && <OttoBanner />}

      <div className="orders-header">
        <div>
          <div className="orders-header-title">Orders</div>
          <MonoLabel>10 active orders</MonoLabel>
        </div>
        <span className="orders-sort-chip">Sort: Status ▾</span>
      </div>

      {data.ordersError ? (
        <span className="orders-error" {...pressableProps(actions.retryOrders)}>
          COULDN'T LOAD ORDERS — RETRY
        </span>
      ) : showSpinner ? (
        <div className="orders-loading">
          <Spinner />
        </div>
      ) : (
        <div className="orders-list">
          {data.orders.map((order) => (
            <OrderCard key={order.conversationId} order={order} />
          ))}
        </div>
      )}

      <div className="orders-list-spacer" />
    </div>
  );
}
