import { h, formatUsd, formatBdt, usdToBdt, announce, append } from "../ui.js?v=1791344184";
import { getState, update } from "../store.js?v=1791344184";
import { head, reviewNote, journeyFoot, dateText } from "./common.js?v=1791344184";
import { CONFIG } from "../config.js?v=1791344184";
import { makeShipment } from "../shipments.js?v=1791344184";
import { stockFigures } from "../stock.js?v=1791344184";

const add = (el, ...k) => append(el, k);

export default {
  id: "reorder",
  stage: "reorder",
  title: "Reorder",
  render({ go }) {
    const body = h("div");
    const footSlot = h("div");

    function paint() {
      const st = getState();
      const p = st.product;
      body.replaceChildren();
      if (!p) {
        add(body, h("div", { class: "notice notice--warn" }, h("p", null, "Choose a product first."), h("a", { class: "btn", href: "#/product" }, "Open the product page")));
        footSlot.replaceChildren(journeyFoot("reorder", { go }));
        return;
      }
      const qty = st.reorder.qty || st.qty;
      const rate = st.fx ? st.fx.rate : null;
      const bdt = usdToBdt(p.priceUsd * qty, rate);
      const input = h("input", { class: "input", type: "number", min: 1, step: 1, id: "f-reorder", value: qty, style: "max-width:140px" });
      const cost = h("p", { class: "num", style: "font-weight:600" });
      const showCost = () => {
        const n = Math.max(1, Math.floor(Number(input.value)) || 1);
        const b = usdToBdt(p.priceUsd * n, rate);
        cost.textContent = `Product cost: ${formatUsd(p.priceUsd * n)}${b !== null ? ", about " + formatBdt(b) : ""}`;
      };
      input.addEventListener("input", showCost);
      showCost();
      add(body,
        h("p", { class: "field__help" }, "Stock in hand now: ", h("b", { class: "num" }, stockFigures(st).inHand), stockFigures(st).onTheWay ? ", on the way: " + stockFigures(st).onTheWay : ""),
        h("div", { class: "chosen-bar" }, p.image ? h("img", { src: p.image, alt: "", width: 56, height: 56 }) : null, h("div", null, h("div", { class: "chosen-bar__name" }, p.name), h("div", { class: "chosen-bar__meta num" }, `${formatUsd(p.priceUsd)} each`))),
        st.reorder.requestedAt
          ? h("div", { class: "notice notice--ok", style: "margin-top:20px" }, h("p", null, h("b", null, "Reorder requested"), ` on ${dateText(st.reorder.requestedAt)} for ${st.reorder.qty} units. Forge checks the supplier price and stock, then sends you the bill on your billing page. Your goods appear under shipment and freight.`), h("button", { type: "button", class: "btn btn--small", onclick: () => { update((s) => { s.reorder.requestedAt = null; }); paint(); } }, "Order again"))
          : h("section", { class: "section", style: "margin-top:24px" },
              h("div", { class: "section__head" }, h("h2", null, "Order more of this product"), h("p", null, "Do this when your stock runs low. The price may have changed, so Forge checks it before billing you.")),
              h("div", { class: "field" }, h("label", { class: "field__label", for: "f-reorder" }, "How many units?"), input),
              cost,
              h("p", { class: "field__help" }, "Freight and duty are billed when the goods arrive, at the actual cost, as before."),
              h("div", null, h("button", { type: "button", class: "btn btn--primary", onclick: () => { const n = Math.max(1, Math.floor(Number(input.value)) || 1); update((s) => { s.reorder.qty = n; s.reorder.requestedAt = Date.now(); if (CONFIG.demo) s.shipments.push(makeShipment(s, "reorder")); }); announce("Reorder requested."); paint(); } }, "Request reorder"))
            ),
        h("p", { class: "field__help", style: "margin-top:20px" }, "Want to sell something else? ", h("a", { href: "#/pause" }, "Read how pausing and ending work"), ".")
      );
      footSlot.replaceChildren(journeyFoot("reorder", { go }));
    }

    const root = h("section", { class: "screen" }, head("Reorder", "Order more when your stock sells out."), reviewNote("reorder"), body, footSlot);
    paint();
    return root;
  },
};
