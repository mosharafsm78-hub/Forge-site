import { h, announce, append } from "../ui.js?v=1791374586";
import { getState, update } from "../store.js?v=1791374586";
import { head, dateText } from "./common.js?v=1791374586";

const add = (el, ...k) => append(el, k);

const RULES = [
  ["Before your goods are ordered", "You can stop at any time. Payments are not refunded and orders are not cancelled, so everything you have paid for stays with your business."],
  ["Ordered, not yet shipped", "Orders cannot be cancelled. The goods are shipped and become yours."],
  ["On the way, or arrived", "The goods are yours. Freight and duty are billed at the actual cost. If the freight is not paid, the goods stay in Forge stock."],
  ["Selling", "You can pause at any time. Forge pauses your ads and does not confirm new orders. Parcels already with the courier continue. Your stock stays with you."],
  ["Ending the business", "Sell the stock you have, or keep it. Forge does not promise to buy stock back. Returned items go back to your stock."],
  ["No trade licence after 30 days", "Forge stops the process of doing business. Your goods stay in Forge stock until a licence in your business name is uploaded."],
];

export default {
  id: "pause",
  stage: null,
  title: "Pause or exit",
  render() {
    const body = h("div");
    function paint() {
      const st = getState();
      body.replaceChildren();
      add(body,
        st.pausedAt
          ? h("div", { class: "notice notice--warn" }, h("p", null, h("b", null, "Your business is paused"), " since " + dateText(st.pausedAt) + ". Ads and new order confirmations are stopped."), h("button", { type: "button", class: "btn btn--primary", onclick: () => { update((s) => { s.pausedAt = null; }); announce("Business resumed."); paint(); } }, "Resume my business"))
          : h("div", null, h("button", { type: "button", class: "btn", onclick: () => { update((s) => { s.pausedAt = Date.now(); }); announce("Business paused."); paint(); } }, "Pause my business"), h("p", { class: "field__help", style: "margin-top:8px" }, "You can resume at any time.")),
        h("section", { class: "section", style: "margin-top:28px" }, h("div", { class: "section__head" }, h("h2", null, "What happens at each point")), h("div", { class: "file" }, RULES.map(([k, v]) => h("div", { class: "rule" }, h("b", null, k), h("p", null, v)))))
      );
    }
    const root = h("section", { class: "screen" }, head("Pause or exit", "You can pause your business or stop at any point. This is what happens at each one."),
      h("div", { class: "notice notice--info", style: "margin-bottom:24px" }, h("p", null, h("b", null, "No refunds, no cancellations."), " Once you pay, your payment is not refunded and your order is not cancelled. Your signed agreement has the full terms.")),
      body);
    paint();
    return root;
  },
};
