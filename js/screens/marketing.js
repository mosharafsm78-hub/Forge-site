import { h, formatBdt, announce, append } from "../ui.js?v=1791376988";
import { CONFIG } from "../config.js?v=1791376988";
import { getState, update, subscribe } from "../store.js?v=1791376988";
import { head, previewAction, reviewNote, journeyFoot, timeText, dateText } from "./common.js?v=1791376988";
import { statusLabel } from "../shipments.js?v=1791376988";

const add = (el, ...k) => append(el, k);
const DAY = 86400000;
const num = (n) => Math.round(Number(n) || 0).toLocaleString("en-US");

// Facebook ad numbers. Forge adds a row for each day; the page shows them as soon as they are saved.
export function adNumbers(st) {
  const m = st.marketing;
  const days = Array.isArray(m.daily) ? m.daily.filter((x) => x && x.d).sort((a, b) => String(a.d).localeCompare(String(b.d))) : [];
  const sum = (k) => days.reduce((n, x) => n + (Number(x[k]) || 0), 0);
  const spent = days.length ? sum("spent") : Number(m.spent) || 0;
  const reached = days.length ? sum("reached") : Number(m.reached) || 0;
  const impressions = sum("impressions");
  const clicks = sum("clicks");
  const orders = days.length ? sum("orders") : st.orders.list.length;
  return { days, spent, reached, impressions, clicks, orders, ctr: impressions ? (clicks / impressions) * 100 : null, cpc: clicks ? spent / clicks : null, cpo: orders && spent ? spent / orders : null };
}

function bars(days, key, label, cls) {
  const last = days.slice(-14);
  const max = Math.max(1, ...last.map((x) => Number(x[key]) || 0));
  return h("figure", { class: "chart" },
    h("figcaption", null, h("b", null, label), h("span", { class: "muted" }, " last " + last.length + " days")),
    h("div", { class: "chart__bars", role: "img", "aria-label": label + ": " + last.map((x) => x.d + " " + num(x[key])).join(", ") },
      last.map((x) => {
        const v = Number(x[key]) || 0;
        return h("div", { class: "chart__col", title: x.d + ": " + (key === "spent" ? formatBdt(v) : num(v)) },
          h("span", { class: "chart__val num" }, key === "spent" ? num(v) : String(v)),
          h("span", { class: "chart__bar " + cls, style: "height:" + Math.max(3, Math.round((v / max) * 100)) + "%" }),
          h("span", { class: "chart__day" }, String(x.d).slice(8, 10)));
      })));
}

// Before ads start: where the goods are, step by step.
function tracker(st) {
  const sh = (st.shipments || [])[0];
  const steps = [
    ["Goods ordered", Boolean(sh)],
    ["Shipped from China", Boolean(sh && (sh.status === "shipped" || sh.status === "arrived" || sh.receivedAt))],
    ["Arrived in Bangladesh", Boolean(sh && (sh.status === "arrived" || sh.receivedAt))],
    ["Goods with you", Boolean(sh && sh.receivedAt)],
    ["Ads start", Boolean(st.marketing.launchedAt)],
  ];
  const cur = steps.findIndex(([, d]) => !d);
  return h("ol", { class: "track" }, steps.map(([t, d], i) => h("li", { class: d ? "is-done" : i === cur ? "is-now" : "" }, h("span", { class: "track__dot", "aria-hidden": "true" }, d ? "✓" : String(i + 1)), h("span", null, t, i === cur && sh && i > 0 ? h("small", null, "Now: " + statusLabel(sh)) : null))));
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
      const a = adNumbers(st);
      body.replaceChildren();

      if (m.launchedAt) {
        const updated = m.updatedAt || (a.days.length ? Date.parse(a.days[a.days.length - 1].d) : m.launchedAt);
        add(body, h("section", { class: "section" },
          h("div", { class: "section__head" }, h("h2", null, "Your Facebook ads"), h("p", null, "Forge runs your ads and tests and improves them as results come in. These numbers come from Facebook. Forge adds them here every day, and this page updates by itself.")),
          h("div", { class: "livebar" },
            h("span", { class: "pill " + (st.pausedAt ? "pill--warn" : "pill--ok") }, st.pausedAt ? "Ads paused" : "Ads running"),
            h("span", { class: "livebar__live" }, h("i", { "aria-hidden": "true" }), "Live. Updated " + timeText(updated)),
            h("span", { class: "muted" }, "Daily budget set by Forge: " + formatBdt(m.budget))),
          h("div", { class: "stats stats--ads" }, [
            ["Spent so far", formatBdt(a.spent), "paid to Facebook"],
            ["People reached", num(a.reached), "different people who saw your ads"],
            ["Clicks", a.clicks ? num(a.clicks) : "—", a.ctr !== null ? a.ctr.toFixed(1) + "% of views" : "to your page"],
            ["Cost per click", a.cpc !== null ? formatBdt(Math.round(a.cpc)) : "—", "what one click costs"],
            ["Orders from ads", String(a.orders), "customers who ordered"],
            ["Cost per order", a.cpo !== null ? formatBdt(Math.round(a.cpo)) : "No orders yet", "ad spend for each order"],
          ].map(([k, v, s]) => h("div", { class: "stat" }, h("small", null, k), h("b", { class: "num" }, v), h("small", { class: "stat__sub" }, s)))),
          a.days.length ? h("div", { class: "charts" }, bars(a.days, "spent", "Spend per day (৳)", "chart__bar--spend"), bars(a.days, "orders", "Orders per day", "chart__bar--orders"), bars(a.days, "reached", "People reached per day", "chart__bar--reach")) : h("p", { class: "field__help" }, "Daily charts appear after Forge adds your first day of results."),
          m.note ? h("div", { class: "notice notice--info" }, h("p", null, h("b", null, "Forge's update. "), m.note)) : null,
          h("p", { class: "field__help" }, "Ad spend is paid to Facebook, and 15% VAT applies to Facebook ad payments in Bangladesh. Your orders and money are on the Orders and Accounting pages."),
          CONFIG.demo ? h("p", { class: "field__help" }, "Preview: these numbers are samples.") : null
        ));
      } else {
        add(body, h("section", { class: "section" },
          h("div", { class: "section__head" }, h("h2", null, "Your Facebook ads"), h("p", null, "Forge runs your ads on Facebook, and tests and improves them as results come in. You and Forge both have admin access to your page.")),
          h("div", { class: "wait" }, h("h3", null, "Ads start when your goods are with you"), h("p", { class: "field__help" }, "Forge sets your ad budget with you, then starts the ads. Your numbers appear here once they run."), tracker(st),
            h("p", { class: "field__help" }, "Ad spend is paid to Facebook, and 15% VAT applies to Facebook ad payments in Bangladesh."))
        ));
        add(body, previewAction("start sample ads", () => { update((s) => {
          const days = [];
          for (let i = 9; i >= 0; i -= 1) { const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10); const r = 700 + ((i * 137) % 400); days.push({ d, spent: 600 + ((i * 53) % 200), reached: r * 6, impressions: r * 9, clicks: 40 + ((i * 17) % 30), orders: (i * 3) % 4 }); }
          s.marketing.budget = 800; s.marketing.launchedAt = Date.now(); s.marketing.daily = days; s.marketing.updatedAt = Date.now(); s.marketing.note = "Your first ad is getting the most clicks. Forge is testing a second photo.";
        }); announce("Ads are live."); paint(); }));
      }

      // Weekly Facebook post: due, requested, posted. It comes round again every seven days.
      const posting = m.postRequestedAt && m.postRequestedAt > (m.postedAt || 0);
      const nextDue = m.postedAt ? m.postedAt + 7 * DAY : 0;
      const due = !posting && (!m.postedAt || Date.now() >= nextDue);
      add(body, h("section", { class: "section" },
        h("div", { class: "section__head" }, h("h2", null, "Your weekly Facebook post"), h("p", null, "A page that posts every week keeps customers coming back. Press the button and Forge posts for you.")),
        posting ? h("div", { class: "notice notice--forge" }, h("p", null, h("b", null, "Pending. "), "You asked on " + timeText(m.postRequestedAt) + ". Forge is posting for you, and it will show here when it is done."))
        : due ? h("div", { class: "notice notice--warn" }, h("p", null, h("b", null, m.postedAt ? "This week's post is due." : "Your first post is due."), m.postedAt ? " Your last post was on " + dateText(m.postedAt) + "." : ""), h("button", { type: "button", class: "btn btn--primary", onclick: () => { update((s) => { s.marketing.postRequestedAt = Date.now(); }); announce("Post requested."); paint(); } }, "Post now"))
        : h("div", { class: "notice notice--ok" }, h("p", null, h("b", null, "Posted "), timeText(m.postedAt) + ". Next post is due in " + Math.max(1, Math.ceil((nextDue - Date.now()) / DAY)) + " day(s), on " + dateText(nextDue) + ".")),
        posting ? previewAction("show it as posted", () => { update((s) => { s.marketing.postedAt = Date.now(); }); paint(); }) : null
      ));
      footSlot.replaceChildren(journeyFoot("marketing", { go, canContinue: Boolean(m.launchedAt), note: m.launchedAt ? "" : "Opens when your ads are live." }));
    }

    const root = h("section", { class: "screen" }, head("Marketing", "Your Facebook ads, live, and your weekly posts."), reviewNote("marketing"), body, footSlot);
    paint();
    // Forge adds numbers from its side: repaint when they arrive, and refresh "updated" times each minute.
    let seen = JSON.stringify([getState().marketing, getState().pausedAt, (getState().shipments || []).map((x) => x.status + x.receivedAt)]);
    const off = subscribe((s) => {
      const now = JSON.stringify([s.marketing, s.pausedAt, (s.shipments || []).map((x) => x.status + x.receivedAt)]);
      if (now !== seen) { seen = now; paint(); }
    });
    const tick = window.setInterval(paint, 60000);
    root._dispose = () => { off(); window.clearInterval(tick); };
    return root;
  },
};
