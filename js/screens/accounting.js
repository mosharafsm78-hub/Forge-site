import { h, formatBdt } from "../ui.js?v=1791344498";
import { getState } from "../store.js?v=1791344498";
import { accounts, COURIER_FEE } from "../accounting.js?v=1791344498";
import { head } from "./common.js?v=1791344498";

const money = (n) => (n < 0 ? "−" + formatBdt(Math.round(-n)) : formatBdt(Math.round(n)));
const pct = (n) => Math.round(n * 100) + "%";

function stat(label, value, note, cls = "") {
  return h("div", { class: "stat " + cls }, h("small", null, label), h("b", { class: "num" }, value), note ? h("span", { class: "stat__note" }, note) : null);
}
const sec = (title, lede, ...kids) => h("section", { class: "section" }, h("div", { class: "section__head" }, h("h2", null, title), lede ? h("p", null, lede) : null), ...kids);
const table = (headRow, rows, foot) =>
  h("div", { class: "table-wrap" }, h("table", { class: "table table--tight" }, h("thead", null, h("tr", null, headRow.map((c) => h("th", null, c)))), h("tbody", null, rows.map((r) => h("tr", null, r.map((c, i) => h("td", i === 1 ? { class: "num" } : null, c))))), foot ? h("tfoot", null, h("tr", null, foot.map((c, i) => h("th", i === 1 ? { class: "num" } : null, c)))) : null));

export default {
  id: "accounting",
  stage: null,
  title: "Accounting",
  render() {
    const a = accounts(getState());
    const st = getState();
    const positive = a.cash >= 0;

    const hero = h(
      "div",
      { class: "acct__hero" + (a.orders === 0 && !a.paid ? "" : positive ? " is-up" : " is-down") },
      h("div", null, h("p", { class: "acct__k" }, "Cash result so far"), h("p", { class: "acct__v num" }, money(a.cash)), h("p", { class: "acct__n" }, a.revenue > 0 || a.spent > 0 ? "Money received from delivered orders, minus everything you have paid out. It is a cash figure, not yet a final profit." : "Nothing has been paid in or out yet. This fills in as you pay your first bill and orders are delivered.")),
      h("div", { class: "acct__side" }, h("p", null, h("small", null, "Stock in hand, at cost"), h("b", { class: "num" }, money(a.stockValue))), h("p", null, h("small", null, "With the courier, to come"), h("b", { class: "num" }, money(a.pending))), h("p", null, h("small", null, "Cash plus stock at cost"), h("b", { class: "num" }, money(a.cash + a.stockValue))))
    );

    const stats = h("div", { class: "stats" },
      stat("Money received", money(a.revenue), a.delivered + " delivered orders"),
      stat("Money spent", money(a.spent), "Paid out so far"),
      stat("Still to come", money(a.pending), a.withCourier + (a.withCourier === 1 ? " parcel" : " parcels") + " with the courier"),
      stat("Bills to pay", money(a.freightDue), a.freightDue ? "Pay in Billing" : "Nothing due"));

    const where = sec("Where your money went", "Every cost in your business, with whether it is paid.",
      table(["Cost", "Amount", "Status"], a.lines.map(([k, v, s]) => [k, v ? money(v) : "—", s]), ["Paid so far", money(a.spent), ""]));

    const refused = a.refusal === null ? "No finished orders yet" : pct(a.refusal) + " of finished parcels";
    const orders = sec("Your orders", "What your sales look like.",
      h("div", { class: "stats" },
        stat("Orders taken", String(a.orders)),
        stat("Delivered", String(a.delivered)),
        stat("Refused and returned", String(a.returned), refused),
        stat("Average order", a.avgPrice ? money(a.avgPrice) : "—")));

    const parcel = sec("What one delivered parcel earns", "Your real numbers, per parcel. Items marked estimate are replaced when real figures arrive.",
      a.avgPrice
        ? table(["Per parcel", "Amount"], [
            ["Average selling price", money(a.avgPrice)],
            ["Goods and freight per unit", "−" + formatBdt(Math.round(a.unitCost))],
            [`Courier fee (estimate, ${formatBdt(COURIER_FEE)})`, "−" + formatBdt(COURIER_FEE)],
            ["Ads per order", a.adPerOrder ? "−" + formatBdt(Math.round(a.adPerOrder)) : "—"],
          ], ["Earned per delivered parcel", money(a.perParcel)])
        : h("p", { class: "field__help" }, "This appears once you have orders."));

    const have = a.delivered;
    const need = a.beDelivered;
    const ratio = need ? Math.min(1, have / need) : 0;
    const planBox = sec("Your plan and your results", "How you are doing against your business plan.",
      table(["", "Plan", "So far"], [
        ["Money put in over the first month", money(a.plan.total), money(a.spent)],
        ["Delivered orders to cover one-off costs", need ? String(need) : "—", String(have)],
      ]),
      need ? h("div", { class: "acct__bar", role: "img", "aria-label": `${have} of ${need} delivered orders` }, h("span", { style: `width:${Math.round(ratio * 100)}%` })) : null,
      need ? h("p", { class: "field__help" }, have >= need ? "Your one-off costs are covered. Orders from here add to your profit." : `${need - have} more delivered orders to cover your domain, website and packaging.`) : null,
      h("p", null, h("a", { class: "btn", href: "#/plan" }, "Read your business plan")));

    const how = h("div", { class: "notice notice--info" }, h("p", null, h("b", null, "How to read this page. ")), h("ul", null,
      h("li", null, "Money arrives only after the courier delivers and pays out. Parcels still with the courier are not counted as received."),
      h("li", null, "A refused parcel earns nothing and still costs a courier fee."),
      h("li", null, "Stock you still hold is shown separately. It is not a loss, and it is not cash until it sells."),
      h("li", null, "Courier fees are estimates until your courier statement is added. Forge can make mistakes, so check every figure.")));

    return h("section", { class: "screen" }, head("Accounting", "Every taka in and out of your business, in one place."), hero, stats, where, orders, parcel, planBox, how);
  },
};
