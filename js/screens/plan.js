import { h, formatUsd, announce, append } from "../ui.js";
import { getState, update } from "../store.js";
import { head, previewAction, reviewNote, journeyFoot } from "./common.js";

const add = (el, ...k) => append(el, k);

export default {
  id: "plan",
  stage: "plan",
  title: "Business plan",
  render({ go }) {
    const body = h("div");
    const footSlot = h("div");

    function sections(st) {
      const name = st.name.chosen.trim() || "Your business";
      const product = st.product ? st.product.name : "your product";
      const price = st.product ? formatUsd(st.product.priceUsd) : "the supplier price";
      return [
        ["The business", [`${name} sells ${product} to customers in Bangladesh. Customers order on your website or through your Facebook page and pay cash on delivery.`]],
        ["Your first order", [`${st.qty} units at ${price} each from the supplier, before freight and duty. Start small: you can reorder when this batch sells.`]],
        ["How you will sell", ["Your website and Facebook page show the product and take orders.", "The Forge team runs your ads and you watch the results on your marketing page.", "The Forge team phones each customer to confirm the order.", "You hand each parcel to the courier. Customers pay the courier when it arrives."]],
        ["Who does what", ["You: receive the goods, hand parcels to the courier, receive returns, reorder.", "The Forge team: orders and imports your goods, runs ads, confirms orders, answers customers, resells returned items."]],
        ["What can go wrong", ["Some orders are refused at the door and come back as returns.", "Ads cost money even when they do not bring orders.", "Stock may sell slowly, or not at all.", "Forge does not promise sales or profit. You can lose money."]],
      ];
    }

    function paint() {
      const st = getState();
      body.replaceChildren();
      if (!st.plan.draftedAt) {
        add(body, h("div", { class: "wait" }, h("h3", null, "Your plan is being written"), h("p", { class: "field__help" }, "Claude drafts it from your file, and the Forge team checks it before you see it. It appears here once your payment is confirmed.")),
          previewAction("show a sample plan", () => { update((s) => { s.plan.draftedAt = Date.now(); }); paint(); }));
      } else {
        add(body,
          CONFIGDemoNote(),
          sections(st).map(([title, lines]) => h("section", { class: "section" }, h("div", { class: "section__head" }, h("h2", null, title)), lines.length === 1 ? h("p", null, lines[0]) : h("ul", { class: "steps" }, lines.map((l) => h("li", null, l))))),
          st.plan.readAt ? h("p", null, h("span", { class: "pill pill--ok" }, "You have read your plan")) : h("button", { type: "button", class: "btn btn--primary", onclick: () => { update((s) => { s.plan.readAt = Date.now(); }); announce("Plan marked as read."); paint(); } }, "I have read my plan")
        );
      }
      footSlot.replaceChildren(journeyFoot("plan", { go, canContinue: Boolean(st.plan.readAt), note: st.plan.readAt ? "" : "Read your plan to continue." }));
    }

    function CONFIGDemoNote() {
      return h("div", { class: "notice", style: "margin-bottom:24px" }, h("p", null, "Preview: this sample is built from your file. The real plan is written for your product and your market."));
    }

    const root = h("section", { class: "screen" }, head("Business plan", "How your business will sell, step by step, and who does what."), reviewNote("plan"), body, footSlot);
    paint();
    return root;
  },
};
