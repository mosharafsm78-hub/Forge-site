// A shipment is one batch of goods: the first order, or a reorder.
// status: not_shipped -> shipped -> arrived (at Bangladesh) -> with the owner (receivedAt set).
// Freight stays empty until the goods arrive in Bangladesh. Then the team sets it, it appears on the
// billing page, and the goods are released when it is paid.
export const SHIP_STATUS = { not_shipped: "Not shipped", shipped: "Shipped", arrived: "At Bangladesh" };

export function statusLabel(sh) {
  return sh.receivedAt ? "With you" : SHIP_STATUS[sh.status] || "Not shipped";
}

// kind "first": paid in the first bill. kind "reorder": Forge sends a product bill after the owner asks.
export function makeShipment(st, kind = "first") {
  const p = st.product || {};
  const qty = kind === "first" ? st.qty : st.reorder.qty || st.qty;
  return {
    id: "S-" + (st.shipments.length + 1),
    kind,
    name: p.name || "Product",
    image: p.image || "",
    qty,
    priceUsd: p.priceUsd || 0,
    status: "not_shipped",
    productAmount: 0, // taka, reorders only, set by the team
    productReportedAt: null,
    productPaidAt: kind === "first" ? Date.now() : null,
    freight: 0, // taka, empty until the goods arrive
    freightReportedAt: null,
    freightPaidAt: null,
    receivedAt: null,
    at: Date.now(),
  };
}

export const productPaid = (sh) => Boolean(sh.productPaidAt);
export const freightDue = (sh) => sh.status === "arrived" && sh.freight > 0 && !sh.freightPaidAt;
