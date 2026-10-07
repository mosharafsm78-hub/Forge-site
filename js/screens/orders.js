import { h, formatBdt, announce, append } from "../ui.js?v=1791340771";
import { getState, update } from "../store.js?v=1791340771";
import { sampleOrders, ensureSampleStock } from "../sample.js?v=1791340771";
import { stockFigures } from "../stock.js?v=1791340771";
import { head, previewAction, reviewNote, journeyFoot, dateText } from "./common.js?v=1791340771";

const add = (el, ...k) => append(el, k);
export const STATUS = { new: "New", confirmed: "Confirmed", handed: "With the courier", delivered: "Delivered", returned: "Coming back", restocked: "Back in stock" };
const NEXT = { new: "confirmed", confirmed: "handed", handed: "delivered" };
const FILTERS = [
  { id: "all", label: "All orders", match: () => true },
  { id: "new", label: "New", match: (o) => o.status === "new" },
  { id: "confirmed", label: "Confirmed", match: (o) => o.status === "confirmed" },
  { id: "handed", label: "With courier", match: (o) => o.status === "handed" },
  { id: "delivered", label: "Delivered", match: (o) => o.status === "delivered" },
  { id: "returns", label: "Returns", match: (o) => o.status === "returned" || o.status === "restocked" },
];

export default {
  id: "orders",
  stage: "orders",
  title: "Orders and customers",
  render({ go }) {
    const body = h("div");
    const footSlot = h("div");
    let filter = "all";

    function paint() {
      const st = getState();
      const list = st.orders.list;
      const f = stockFigures(st);
      body.replaceChildren();

      const stat = (label, value, strong) => h("div", { class: "stat" + (strong ? " stat--strong" : "") }, h("small", null, label), h("b", { class: "num" }, value));
      add(body,
        h("div", { class: "stats" },
          stat("Stock in hand", f.inHand, true),
          stat("Confirmed, to hand over", f.toHandOver),
          stat("With the courier", f.withCourier),
          stat("Delivered", f.delivered),
          stat("Coming back", f.comingBack),
          stat("New, not yet confirmed", f.newOrders)),
        f.onTheWay ? h("p", { class: "field__help" }, `${f.onTheWay} more units are on the way. See shipment and freight.`) : null,
        h("div", { class: "notice notice--info", style: "margin:20px 0" }, h("p", null, h("b", null, "Who does what."), " Forge phones each customer to confirm the order and answers customer questions. You hand confirmed parcels to the courier and receive any that come back. Cash from delivered orders reaches your bank or bKash through the courier's payout."))
      );

      if (!list.length) {
        add(body, h("div", { class: "wait" }, h("h3", null, "No orders yet"), h("p", { class: "field__help" }, "Orders appear here once your ads start. You can see every order, every customer and every delivery.")),
          previewAction("load sample orders and stock", () => { update((s) => { ensureSampleStock(s); s.orders.list = sampleOrders(); }); paint(); }));
      } else {
        const shown = list.filter(FILTERS.find((x) => x.id === filter).match);
        add(body,
          h("div", { class: "chips", role: "group", "aria-label": "Show orders" }, FILTERS.map((x) => h("button", { type: "button", class: "chip", "aria-pressed": x.id === filter ? "true" : "false", onclick: () => { filter = x.id; paint(); } }, x.label + " (" + list.filter(x.match).length + ")"))),
          shown.length
            ? h("div", { class: "table-wrap" }, h("table", { class: "table" },
                h("thead", null, h("tr", null, ["Order", "Customer", "To collect", "Status and action"].map((t) => h("th", { scope: "col" }, t)))),
                h("tbody", null, shown.map((o) => h("tr", null,
                  h("td", null, h("b", null, o.id), h("small", null, dateText(o.at))),
                  h("td", null, o.customer, h("small", null, o.district)),
                  h("td", { class: "num" }, formatBdt(o.amount * o.qty)),
                  h("td", null,
                    h("span", { class: "pill " + (o.status === "delivered" ? "pill--ok" : o.status === "returned" ? "pill--warn" : "") }, STATUS[o.status]),
                    o.status === "confirmed" ? h("div", { style: "margin-top:8px" }, h("button", { type: "button", class: "btn btn--small", onclick: () => { update((s) => { s.orders.list.find((x) => x.id === o.id).status = "handed"; }); announce(o.id + " handed to the courier."); paint(); } }, "Handed to courier")) : null,
                    NEXT[o.status] && o.status !== "confirmed" ? h("div", { style: "margin-top:8px" }, previewAction("next status", () => { update((s) => { const x = s.orders.list.find((y) => y.id === o.id); x.status = NEXT[x.status]; }); paint(); }, true)) : null)
                )))))
            : h("p", { class: "field__help" }, "No orders in this view.")
        );
      }
      footSlot.replaceChildren(journeyFoot("orders", { go }));
    }

    const root = h("section", { class: "screen screen--wide" }, head("Orders and customers", "Every order, customer, delivery and the stock you hold, in one place."), reviewNote("orders"), body, footSlot);
    paint();
    return root;
  },
};
