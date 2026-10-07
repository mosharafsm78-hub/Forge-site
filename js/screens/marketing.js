import { h, formatBdt, announce, append } from "../ui.js?v=1791345108";
import { CONFIG } from "../config.js?v=1791345108";
import { getState, update } from "../store.js?v=1791345108";
import { head, previewAction, reviewNote, journeyFoot, timeText } from "./common.js?v=1791345108";

const add = (el, ...k) => append(el, k);

function adStats(st) {
  const m = st.marketing;
  const orders = st.orders.list.length;
  return [["Spent so far", formatBdt(m.spent || 0)], ["Orders", String(orders)], ["Cost per order", orders && m.spent ? formatBdt(Math.round(m.spent / orders)) : "No orders yet"], ["People reached", (m.reached || 0).toLocaleString("en-US")]];
}

export default {
  id: "marketing",
  stage: "marketing",
  title: "Marketing",
  render({ go }) {
    const body = h("div");
    const footSlot = h("div");

    function paint() {
      const st = getState();
      const m = st.marketing;
      body.replaceChildren();

      add(body, h("section", { class: "section" },
        h("div", { class: "section__head" }, h("h2", null, "Your ads"), h("p", null, "Forge runs your ads on Facebook, and tests and improves them as results come in. You see the results here. You and Forge both have admin access to your page.")),
        m.launchedAt
          ? h("div", null, h("p", null, h("span", { class: "pill pill--ok" }, "Ads are live"), " ", h("span", { class: "field__help" }, "Daily budget set by Forge: " + formatBdt(m.budget))),
              h("div", { class: "stats" }, adStats(st).map(([k, v]) => h("div", { class: "stat" }, h("small", null, k), h("b", { class: "num" }, v)))),
              CONFIG.demo ? h("p", { class: "field__help" }, "Preview: these numbers are samples. Live numbers come from Facebook once your ads run.") : null)
          : h("div", { class: "wait" }, h("h3", null, "Ads start when your goods are with you"), h("p", { class: "field__help" }, "Forge sets your ad budget with you, then starts the ads. Your numbers appear here once they run."),
              h("p", { class: "field__help" }, "Ad spend is paid to Facebook, and 15% VAT applies to Facebook ad payments in Bangladesh."))
      ));
      if (!m.launchedAt) add(body, previewAction("start sample ads", () => { update((s) => { s.marketing.budget = 800; s.marketing.launchedAt = Date.now(); s.marketing.spent = 4200; s.marketing.reached = 9800; }); announce("Ads are live."); paint(); }));

      const posting = m.postRequestedAt && !m.postedAt;
      add(body, h("section", { class: "section" },
        h("div", { class: "section__head" }, h("h2", null, "Your weekly Facebook post"), h("p", null, "A page that posts every week keeps customers coming back. Press the button and Forge posts for you.")),
        m.postedAt ? h("p", null, h("span", { class: "pill pill--ok" }, "Posted"), " " + timeText(m.postedAt) + ". Next reminder in 7 days.")
        : posting ? h("div", { class: "notice notice--forge" }, h("p", null, "Forge is posting for you. It will show here when it is done."))
        : h("div", { class: "notice notice--warn" }, h("p", null, h("b", null, "This week's post is due.")), h("button", { type: "button", class: "btn btn--primary", onclick: () => { update((s) => { s.marketing.postRequestedAt = Date.now(); }); paint(); } }, "Post now")),
        posting ? previewAction("show it as posted", () => { update((s) => { s.marketing.postedAt = Date.now(); }); paint(); }) : null
      ));
      footSlot.replaceChildren(journeyFoot("marketing", { go, canContinue: Boolean(m.launchedAt), note: m.launchedAt ? "" : "Opens when your ads are live." }));
    }

    const root = h("section", { class: "screen" }, head("Marketing", "Your ads and your weekly posts."), reviewNote("marketing"), body, footSlot);
    paint();
    return root;
  },
};
