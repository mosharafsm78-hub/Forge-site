import { h, formatBdt, formatUsd, usdToBdt, announce, append } from "../ui.js?v=1791339886";
import { getState, update } from "../store.js?v=1791339886";
import { freightNote } from "./common.js?v=1791339886";
import { statusLabel, productPaid, freightDue } from "../shipments.js?v=1791339886";
import { head, previewAction, reviewNote, journeyFoot, dateText } from "./common.js?v=1791339886";

const add = (el, ...k) => append(el, k);

export default {
  id: "freight",
  stage: "freight",
  title: "Shipment and freight",
  render({ go }) {
    const body = h("div");
    const footSlot = h("div");

    function paint() {
      const st = getState();
      const rate = st.fx ? st.fx.rate : null;
      const money = (usd) => (rate ? formatBdt(usdToBdt(usd, rate)) : formatUsd(usd));
      body.replaceChildren();

      // Before billing is paid there is no shipment yet. Show the goods as they will be.
      const rows = st.shipments.length
        ? st.shipments
        : st.product && st.product.id
          ? [{ id: "-", kind: "first", name: st.product.name, qty: st.qty, priceUsd: st.product.priceUsd, status: "not_shipped", freight: 0, productPaidAt: null, projected: true }]
          : [];

      if (!rows.length) {
        add(body, h("div", { class: "notice notice--warn" }, h("p", null, "No goods yet. Choose a product first."), h("a", { class: "btn", href: "#/product" }, "Open the product page")));
      } else {
        add(body, h("div", { class: "table-wrap" }, h("table", { class: "table table--tight" },
          h("thead", null, h("tr", null, ["Goods", "Price", "Status", "Freight"].map((t) => h("th", { scope: "col" }, t)))),
          h("tbody", null, rows.map((sh) => h("tr", null,
            h("td", null, h("b", null, sh.name), h("small", null, `${sh.qty} units${sh.kind === "reorder" ? ", reorder" : ""}`)),
            h("td", { class: "num" }, money(sh.priceUsd * sh.qty), h("div", { style: "margin-top:6px" }, productPaid(sh) ? h("span", { class: "pill pill--ok" }, "Paid") : h("span", { class: "pill pill--warn" }, "Unpaid"))),
            h("td", null, h("span", { class: "pill " + (sh.receivedAt ? "pill--ok" : "") }, statusLabel(sh))),
            h("td", { class: "num" }, sh.freight > 0 ? [formatBdt(sh.freight), h("div", { style: "margin-top:6px" }, sh.freightPaidAt ? h("span", { class: "pill pill--ok" }, "Paid") : h("span", { class: "pill pill--warn" }, "Unpaid"))] : h("span", { class: "field__help" }, "Not billed yet"))
          ))))));
        if (rows[0].projected) add(body, h("p", { class: "field__help" }, "Your goods are ordered after your first bill is paid. Until then this table shows what you chose."));
      }

      add(body, freightNote());

      for (const sh of st.shipments) {
        if (freightDue(sh)) {
          add(body, h("div", { class: "notice notice--info", style: "margin-top:16px" }, h("p", null, h("b", null, sh.name + " is at Bangladesh."), ` Your freight bill of ${formatBdt(sh.freight)} is ready.`), h("a", { class: "btn btn--primary", href: "#/billing" }, "Go to billing to pay")));
        } else if (sh.freightPaidAt && !sh.receivedAt) {
          add(body, h("div", { class: "notice notice--ok", style: "margin-top:16px" }, h("p", null, h("b", null, "Freight paid. Your goods are released."), " Press the button when you have received them."), h("button", { type: "button", class: "btn btn--primary", onclick: () => { update((s) => { s.shipments.find((x) => x.id === sh.id).receivedAt = Date.now(); }); announce("Goods received."); paint(); paintFoot(); } }, "I have received these goods")));
        } else if (sh.receivedAt) {
          add(body, h("p", { class: "field__help", style: "margin-top:12px" }, `${sh.name}: received ${dateText(sh.receivedAt)}.`));
        }
      }

      const open = st.shipments.find((x) => x.status !== "arrived");
      if (open) {
        add(body, previewAction(open.status === "not_shipped" ? "mark the goods as shipped from China" : "mark the goods as arrived in Bangladesh", () => {
          update((s) => {
            const x = s.shipments.find((y) => y.id === open.id);
            if (x.status === "not_shipped") x.status = "shipped";
            else { x.status = "arrived"; if (!x.freight) x.freight = 8200; }
          });
          paint();
        }));
      }
      paintFoot();
    }

    function paintFoot() {
      const got = getState().shipments.some((x) => x.receivedAt);
      footSlot.replaceChildren(journeyFoot("freight", { go, canContinue: got, note: got ? "" : "Opens when your goods reach you." }));
    }

    const root = h("section", { class: "screen screen--wide" }, head("Shipment and freight", "Where your goods are, what you paid, and the freight once they reach Bangladesh."), reviewNote("freight"), body, footSlot);
    paint();
    return root;
  },
};
