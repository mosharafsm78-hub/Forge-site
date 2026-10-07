// Every taka in and out of the business, worked out from the file. Pure functions, no screens.
import { usdToBdt } from "./ui.js?v=1791340302";
import { planNumbers } from "./planDoc.js?v=1791340302";

export const COURIER_FEE = 120; // planning figure per parcel sent, until the courier statement replaces it

export function accounts(st) {
  const rate = st.fx && Number(st.fx.rate) > 0 ? Number(st.fx.rate) : 122.76;
  const pay = st.payment || {};
  const ships = st.shipments || [];
  const orders = (st.orders && st.orders.list) || [];
  const paid = Boolean(pay.paidAt);

  const first = ships.find((x) => x.kind === "first");
  const goodsFirst = paid && first ? usdToBdt((first.priceUsd || 0) * first.qty, rate) : 0;
  const goodsReorders = ships.filter((x) => x.kind === "reorder" && x.productPaidAt).reduce((n, x) => n + (Number(x.productAmount) || 0), 0);
  const dom = paid && st.domain && st.domain.status === "available" && st.domain.priceCurrency === "USD" ? usdToBdt(Number(st.domain.priceAmount) || 0, rate) : 0;
  const packaging = paid ? Number(pay.packagingCost) || 0 : 0;
  const website = paid ? Number(pay.websiteFee) || 0 : 0;
  const freightPaid = ships.filter((x) => x.freightPaidAt).reduce((n, x) => n + (Number(x.freight) || 0), 0);
  const freightDue = ships.filter((x) => x.freight > 0 && !x.freightPaidAt).reduce((n, x) => n + x.freight, 0);
  const ads = Number((st.marketing && st.marketing.spent) || 0);

  const count = (...s) => orders.filter((o) => s.includes(o.status)).length;
  const sum = (...s) => orders.filter((o) => s.includes(o.status)).reduce((n, o) => n + o.amount * o.qty, 0);
  const delivered = count("delivered");
  const withCourier = count("handed");
  const returned = count("returned", "restocked");
  const revenue = sum("delivered");
  const pending = sum("handed");
  const sent = count("handed", "delivered", "returned", "restocked");
  const courier = sent * COURIER_FEE;

  const spent = goodsFirst + goodsReorders + dom + packaging + website + freightPaid + ads + courier;
  const cash = revenue - spent;

  const unitsBought = ships.filter((x) => paid).reduce((n, x) => n + (x.qty || 0), 0);
  const goodsAndFreight = goodsFirst + goodsReorders + freightPaid;
  const unitCost = unitsBought ? goodsAndFreight / unitsBought : 0;
  const received = ships.filter((x) => x.receivedAt).reduce((n, x) => n + x.qty, 0);
  const committed = orders.filter((o) => ["confirmed", "handed", "delivered", "returned"].includes(o.status)).reduce((n, o) => n + o.qty, 0);
  const inHand = Math.max(0, received - committed);
  const stockValue = inHand * unitCost;

  const finished = delivered + returned;
  const refusal = finished ? returned / finished : null;
  const avgPrice = delivered ? revenue / delivered : orders.length ? orders.reduce((n, o) => n + o.amount, 0) / orders.length : 0;
  const adPerOrder = orders.length && ads ? ads / orders.length : 0;
  const perParcel = avgPrice ? avgPrice - unitCost - COURIER_FEE - adPerOrder : null;

  const plan = planNumbers(st);
  const fixed = dom + packaging + website;
  const beDelivered = perParcel && perParcel > 0 ? Math.ceil(fixed / perParcel) : null;

  const lines = [
    ["Goods from the supplier", goodsFirst + goodsReorders, goodsFirst + goodsReorders > 0 ? "Paid" : "Not paid yet"],
    ["Domain", dom, dom > 0 ? "Paid" : "Not paid yet"],
    ["Packaging", packaging, packaging > 0 ? "Paid" : "Not paid yet"],
    ["Website setup", website, website > 0 ? "Paid" : "Not paid yet"],
    ["Freight, duty and clearance", freightPaid + freightDue, freightDue > 0 ? "Due in Billing" : freightPaid > 0 ? "Paid" : "Billed on arrival"],
    ["Facebook ads", ads, ads > 0 ? "Paid to Facebook" : "Not started"],
    ["Courier fees (estimate)", courier, sent ? "Estimated, replaced by the courier statement" : "No parcels sent"],
  ];
  return { revenue, pending, spent, cash, delivered, withCourier, returned, refusal, avgPrice, unitCost, adPerOrder, perParcel, inHand, stockValue, freightDue, ads, lines, plan, beDelivered, fixed, orders: orders.length, paid, courier };
}
