// Stock in hand, worked out from the goods that reached the owner and the orders taken.
export function stockFigures(st) {
  const list = st.orders.list;
  const received = st.shipments.filter((s) => s.receivedAt).reduce((n, s) => n + s.qty, 0);
  const units = (statuses) => list.filter((o) => statuses.includes(o.status)).reduce((n, o) => n + o.qty, 0);
  const committed = units(["confirmed", "handed", "delivered", "returned"]);
  const onTheWay = st.shipments.filter((s) => !s.receivedAt).reduce((n, s) => n + s.qty, 0);
  return {
    received,
    onTheWay,
    inHand: Math.max(0, received - committed),
    toHandOver: units(["confirmed"]),
    withCourier: units(["handed"]),
    delivered: units(["delivered"]),
    comingBack: units(["returned"]),
    newOrders: units(["new"]),
  };
}
