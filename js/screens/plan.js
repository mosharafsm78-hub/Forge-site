import { h, announce, append } from "../ui.js";
import { CONFIG } from "../config.js";
import { getState, update } from "../store.js";
import { HOUR } from "../time.js";
import { buildPlan } from "../planDoc.js";
import { head, previewAction, reviewNote, journeyFoot } from "./common.js";
import { waitPanel } from "./wait.js";

const add = (el, ...k) => append(el, k);
const WAIT = HOUR / 2; // Forge writes the plan within 30 minutes of the payment being confirmed

function renderSection(sec) {
  const kids = [h("div", { class: "section__head" }, h("h2", null, sec.title))];
  if (sec.lines && sec.lines.length) kids.push(sec.lines.length === 1 ? h("p", null, sec.lines[0]) : h("ul", { class: "steps" }, sec.lines.map((l) => h("li", null, l))));
  if (sec.table) {
    const t = sec.table;
    kids.push(h("div", { class: "table-wrap" }, h("table", { class: "table table--tight" },
      h("thead", null, h("tr", null, t.head.map((c) => h("th", null, c)))),
      h("tbody", null, t.rows.map((r) => h("tr", null, r.map((c, i) => h("td", i === 0 ? { class: "plan__first" } : null, c))))),
      t.foot ? h("tfoot", null, h("tr", null, t.foot.map((c) => h("th", null, c)))) : null)));
  }
  if (sec.note) kids.push(h("p", { class: "field__help" }, sec.note));
  return h("section", { class: "section plan__sec" + (sec.callout ? " plan__callout" : "") }, kids);
}

export default {
  id: "plan",
  stage: "plan",
  title: "Business plan",
  render({ go }) {
    const body = h("div");
    const footSlot = h("div");
    let stopper = null;

    function paint() {
      if (stopper) stopper();
      const st = getState();
      body.replaceChildren();
      if (!st.plan.draftedAt) {
        const paid = st.payment && st.payment.paidAt;
        if (paid) {
          const w = waitPanel({
            title: "Forge is writing your business plan",
            requestedAt: paid,
            durationMs: WAIT,
            lines: ["Forge writes it from your file: your costs, your freight, your returns risk and your first 90 days. It checks the numbers before you see it.", "It takes about 30 minutes after your payment is confirmed."],
            lateText: "Forge is checking the numbers. It will appear here in a few minutes.",
          });
          stopper = w.stop;
          add(body, w.el);
        } else {
          add(body, h("div", { class: "wait" }, h("h3", null, "Your plan is written after your payment"), h("p", { class: "field__help" }, "Once Forge confirms your payment, it writes your business plan in about 30 minutes. You will read it here before anything is ordered for you.")));
        }
        const demo = previewAction("show the finished plan", () => { update((s) => { s.plan.draftedAt = Date.now(); }); paint(); });
        if (demo) add(body, demo);
      } else {
        add(body,
          CONFIG.demo ? h("div", { class: "notice", style: "margin-bottom:24px" }, h("p", null, "Preview: this sample is built from the sample file.")) : null,
          (st.plan.doc && Array.isArray(st.plan.doc.sections) && st.plan.doc.sections.length ? st.plan.doc.sections : buildPlan(st)).map(renderSection),
          st.plan.readAt ? h("p", null, h("span", { class: "pill pill--ok" }, "You have read your plan")) : h("button", { type: "button", class: "btn btn--primary", onclick: () => { update((s) => { s.plan.readAt = Date.now(); }); announce("Plan marked as read."); paint(); } }, "I have read my plan")
        );
      }
      footSlot.replaceChildren(journeyFoot("plan", { go, canContinue: Boolean(st.plan.readAt), note: st.plan.readAt ? "" : "Read your plan to continue." }));
    }

    const root = h("section", { class: "screen" }, head("Business plan", "A plan written for your business, with your real numbers, in plain words."), reviewNote("plan"), body, footSlot);
    paint();
    root._dispose = () => { if (stopper) stopper(); };
    return root;
  },
};
