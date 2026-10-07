import { h, announce, append, formatBdt } from "../ui.js?v=1791339729";
import { getState, update } from "../store.js?v=1791339729";
import { computeSheet } from "../sheet.js?v=1791339729";
import { addWorkingDays, formatDay } from "../time.js?v=1791339729";
import { head, previewAction, reviewNote, journeyFoot, dateText, freightNote } from "./common.js?v=1791339729";
import { makeShipment, freightDue } from "../shipments.js?v=1791339729";

const add = (el, ...k) => append(el, k);
const DAY = 86400000;

export default {
  id: "billing",
  stage: "billing",
  title: "Billing",
  render({ go }) {
    const body = h("div");
    const footSlot = h("div");

    function paint() {
      const st = getState();
      const pay = st.payment;
      const sheet = computeSheet(st);
      const haveProduct = Boolean(st.product && st.product.id);
      const final = haveProduct && Boolean(st.domain && st.domain.name) && pay.packagingCost > 0 && pay.websiteFee > 0;
      const missing = [];
      if (!haveProduct) missing.push("a product");
      if (!(st.domain && st.domain.name)) missing.push("a domain");
      if (!(pay.packagingCost > 0)) missing.push(st.packaging.requestedAt ? "the packaging quote (due " + formatDay(addWorkingDays(st.packaging.requestedAt, 3)) + ")" : "the packaging quote");
      if (!(pay.websiteFee > 0)) missing.push("the website setup fee");

      body.replaceChildren();
      const signed = st.documents.agreementSigned;
      add(body,
        h("div", { class: "notice " + (signed ? "notice--ok" : "notice--error") }, h("p", null, signed ? h("span", null, h("b", null, "Signed agreement received"), " on " + dateText(signed.at) + ". Work can start once your payment is confirmed.") : h("span", null, h("b", null, "No signed agreement yet."), " Nothing can start, and nothing can be paid, until your signed agreement is uploaded."), " ", h("a", { href: "#/documents" }, "Open documents"))),
        h("section", { class: "section", style: "margin-top:24px" },
          h("div", { class: "section__head" }, h("h2", null, "Your bill"), h("p", null, "You pay the full amount before Forge orders your goods. Freight and duty are billed later, at the actual cost, when the goods reach Bangladesh.")),
          h("div", { class: "bill" }, sheet.rows.filter((r) => r.key !== "freight").map((r) => h("div", { class: "bill__row" }, h("span", null, h("b", null, r.label), r.sub ? h("small", null, r.sub) : null), h("span", { class: "num" }, r.value || r.pending || ""))), h("div", { class: "bill__total" }, h("span", null, "Total to pay now"), h("b", { class: "num" }, sheet.orderTotal))),
          h("p", { class: "field__help" }, sheet.hasRate ? `Product and domain prices are in taka at US$1 = ৳${sheet.rate}. The final amount is the one on this bill when it is confirmed.` : "Product and domain prices are in US dollars until the exchange rate loads.")
        )
      );

      if (pay.paidAt) {
        const due = pay.paidAt + 30 * DAY;
        add(body, h("div", { class: "notice notice--ok" }, h("p", null, h("b", null, "Payment confirmed"), " on " + dateText(pay.paidAt) + ". Forge now orders your goods.")),
          h("div", { class: "notice notice--info", style: "margin-top:16px" }, h("p", null, h("b", null, "Upload your trade licence by " + dateText(due) + "."), " That is 30 days from today. If it is not uploaded, Forge stops the process of doing business."), st.documents.licence ? h("p", null, "Your licence is uploaded.") : h("p", null, h("a", { href: "#/documents" }, "Upload it on the documents page"))));
      } else if (pay.reportedAt) {
        add(body, h("div", { class: "notice notice--forge" }, h("p", null, h("b", null, "Waiting for Forge to confirm your payment.")), h("p", null, "You told us you paid on " + dateText(pay.reportedAt) + ". You will see it here when it is confirmed.")),
          previewAction("confirm the payment", () => { update((s) => { s.payment.paidAt = Date.now(); if (s.product && !s.shipments.length) s.shipments.push(makeShipment(s, "first")); }); announce("Payment confirmed."); paint(); paintFoot(); }));
      } else if (!final) {
        add(body, h("div", { class: "notice notice--warn" }, h("p", null, h("b", null, "Your bill is not final yet.")), h("p", null, "Still waiting for: " + missing.join(", ") + ". Payment opens when everything is on the bill.")),
          previewAction("show a sample final bill", () => { update((s) => { s.payment.packagingCost = 4500; s.payment.websiteFee = 3000; }); paint(); }));
      } else {
        add(body, h("section", { class: "section" },
          h("div", { class: "section__head" }, h("h2", null, "Approve and pay")),
          pay.quoteApprovedAt
            ? h("p", null, h("span", { class: "pill pill--ok" }, "Packaging quote approved"))
            : h("div", { class: "notice notice--warn" }, h("p", null, "Your packaging quote and design are ready. Approve them to add the cost to your bill."), h("button", { type: "button", class: "btn", onclick: () => { update((s) => { s.payment.quoteApprovedAt = Date.now(); }); paint(); } }, "Approve packaging quote")),
          h("p", { class: "field__help" }, "Forge sends payment details here once the quote is approved. After you pay, press the button below."),
          h("button", { type: "button", class: "btn btn--primary", disabled: !pay.quoteApprovedAt || !signed, onclick: () => { update((s) => { s.payment.reportedAt = Date.now(); }); announce("Thank you. Forge will confirm your payment."); paint(); } }, "I have paid in full")
        ));
      }
      add(body, otherBills(st));
      paintFoot();
    }

    // Freight and reorder bills. Freight stays off this list until the goods reach Bangladesh.
    function otherBills(st) {
      const rate = st.fx ? st.fx.rate : null;
      const rows = [];
      for (const sh of st.shipments) {
        if (sh.kind === "reorder" && sh.productAmount > 0) rows.push({ sh, type: "product", title: "Reorder: " + sh.name, sub: `${sh.qty} units`, amount: sh.productAmount, reportedAt: sh.productReportedAt, paidAt: sh.productPaidAt });
        if (sh.freight > 0) rows.push({ sh, type: "freight", title: "Freight, duty and clearance", sub: `${sh.name}, ${sh.qty} units`, amount: sh.freight, reportedAt: sh.freightReportedAt, paidAt: sh.freightPaidAt });
      }
      const pendingReorder = st.shipments.find((x) => x.kind === "reorder" && !(x.productAmount > 0));
      const unpaid = rows.filter((r) => !r.paidAt).reduce((n, r) => n + r.amount, 0);
      const act = (r, fn) => update((s) => { fn(s.shipments.find((x) => x.id === r.sh.id)); });
      const table = rows.length
        ? h("div", { class: "table-wrap" }, h("table", { class: "table" },
            h("thead", null, h("tr", null, ["Bill", "Amount", "Status"].map((t) => h("th", { scope: "col" }, t)))),
            h("tbody", null, rows.map((r) => h("tr", null,
              h("td", null, h("b", null, r.title), h("small", null, r.sub)),
              h("td", { class: "num" }, formatBdt(r.amount)),
              h("td", null,
                r.paidAt ? h("span", { class: "pill pill--ok" }, "Paid")
                : r.reportedAt ? h("span", { class: "pill pill--warn" }, "Waiting for confirmation")
                : h("span", { class: "pill pill--warn" }, "Unpaid"),
                !r.paidAt && !r.reportedAt ? h("div", { style: "margin-top:8px" }, h("button", { type: "button", class: "btn btn--small btn--primary", onclick: () => { act(r, (x) => { if (r.type === "freight") x.freightReportedAt = Date.now(); else x.productReportedAt = Date.now(); }); announce("Thank you. Forge will confirm your payment."); paint(); } }, "I have paid")) : null,
                r.reportedAt && !r.paidAt ? h("div", { style: "margin-top:8px" }, previewAction("confirm this payment", () => { act(r, (x) => { if (r.type === "freight") x.freightPaidAt = Date.now(); else x.productPaidAt = Date.now(); }); paint(); }, true)) : null)
            )))))
        : h("p", { class: "field__help" }, "No other bills yet.");
      return h("section", { class: "section", style: "margin-top:32px" },
        h("div", { class: "section__head" }, h("h2", null, "Freight and other bills"), h("p", null, "Freight, duty and clearance are billed at the actual cost once your goods arrive in Bangladesh. Until then this stays empty. You pay the freight bill to receive your goods. If it is not paid, your goods stay in Forge stock.")),
        table,
        freightNote(),
        unpaid > 0 ? h("p", { class: "num", style: "font-weight:600" }, "Unpaid: " + formatBdt(unpaid)) : null,
        pendingReorder ? previewAction("send the bill for my reorder", () => { update((s) => { const x = s.shipments.find((y) => y.id === pendingReorder.id); x.productAmount = rate ? Math.ceil(x.priceUsd * x.qty * rate) : Math.ceil(x.priceUsd * x.qty * 100); }); paint(); }) : null
      );
    }

    function paintFoot() {
      footSlot.replaceChildren(journeyFoot("billing", { go, canContinue: Boolean(getState().payment.paidAt), note: getState().payment.paidAt ? "" : "Opens when your payment is confirmed." }));
    }

    const root = h("section", { class: "screen" }, head("Billing", "Your bills and what you have paid. Forge starts ordering your goods when your first bill is paid."), reviewNote("billing"), body, footSlot);
    paint();
    return root;
  },
};
