import { h, announce, append, formatBdt } from "../ui.js?v=1791376988";
import { getState, update, subscribe } from "../store.js?v=1791376988";
import { computeSheet } from "../sheet.js?v=1791376988";
import { addWorkingDays, formatDay } from "../time.js?v=1791376988";
import { head, previewAction, reviewNote, journeyFoot, dateText, freightNote } from "./common.js?v=1791376988";
import { makeShipment, freightDue } from "../shipments.js?v=1791376988";
import { payPanel } from "./payqr.js?v=1791376988";
import { paidTotal } from "../rules.js?v=1791376988";
import { pingForge } from "../changeRequest.js?v=1791376988";

const add = (el, ...k) => append(el, k);
const DAY = 86400000;

export default {
  id: "billing",
  stage: "billing",
  title: "Billing",
  render({ go }) {
    const body = h("div");
    const footSlot = h("div");


    // After payment the owner may change things. A change that costs more is paid for as a difference. A cheaper one is not possible: no refunds and no credit.
    function adjustBox(st, sheet) {
      const paid = paidTotal(st);
      const cur = sheet.orderTotalNum || 0;
      const topUps = Array.isArray(st.payment.topUps) ? st.payment.topUps : [];
      const pending = topUps.filter((t) => !(st.payment.topUpPaidAt >= t.at));
      const out = [];
      if (pending.length) out.push(h("div", { class: "notice notice--forge" }, h("p", null, h("b", null, "Waiting for Forge to verify your extra payment of " + formatBdt(pending.reduce((a, t) => a + t.amount, 0)) + "."), " Forge verifies it within 30 minutes.")));
      if (cur < paid - 1) {
        out.push(h("div", { class: "notice notice--error" }, h("p", null, h("b", null, "Your order now costs " + formatBdt(cur) + ", less than the " + formatBdt(paid) + " you paid.")), h("p", null, "A cheaper order is not possible, because payments are not refunded and there is no credit. Go back and choose a product or quantity that costs at least " + formatBdt(paid) + ", or switch back to what you paid for."), h("p", null, h("a", { href: "#/product" }, "Change product"))));
      } else if (cur > paid + 1 && !pending.length) {
        const diff = Math.round(cur - paid);
        const box = h("div", { class: "notice notice--warn" }, h("p", null, h("b", null, "Your changes add " + formatBdt(diff) + " to your order.")), h("p", null, "You paid " + formatBdt(paid) + ". Your order now costs " + formatBdt(cur) + ". Pay the difference to keep the change."));
        const trx = h("input", { class: "field__control", type: "text", maxlength: "40", autocomplete: "off", placeholder: "Transaction ID from your app", "aria-label": "Transaction ID" });
        const send = h("button", { type: "button", class: "btn btn--primary", disabled: true, onclick: () => { update((s) => { if (!Array.isArray(s.payment.topUps)) s.payment.topUps = []; s.payment.topUps.push({ amount: diff, trxId: trx.value.trim(), at: Date.now() }); }); announce("Thank you. Forge will check your payment."); pingForge("payment"); paint(); } }, "Submit");
        trx.addEventListener("input", () => { send.disabled = trx.value.trim().length < 6; });
        out.push(box, payPanel(formatBdt(diff)), h("div", { class: "field", style: "margin-top:16px" }, h("label", { class: "field__label" }, "Transaction ID for the " + formatBdt(diff) + " payment"), trx, h("div", { style: "margin-top:12px" }, send)));
      }
      return out.length ? h("section", { class: "section", style: "margin-top:24px" }, h("div", { class: "section__head" }, h("h2", null, "Changes after payment")), out) : null;
    }

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
          h("div", { class: "section__head" }, h("h2", null, "Your bill"), h("p", null, "You pay the full amount first. Forge orders your goods after payment is confirmed and you have read your business plan. Freight and duty are billed later, at the actual cost, when the goods reach Bangladesh.")),
          h("div", { class: "bill" }, sheet.rows.filter((r) => r.key !== "freight").map((r) => h("div", { class: "bill__row" }, h("span", null, h("b", null, r.label), r.sub ? h("small", null, r.sub) : null), h("span", { class: "num" }, r.value || r.pending || ""))), h("div", { class: "bill__total" }, h("span", null, "Total to pay now"), h("b", { class: "num" }, sheet.orderTotal))),
          h("p", { class: "field__help" }, sheet.hasRate ? (getState().fx && getState().fx.source === "estimate" ? `Product and domain prices are in taka at a planning rate of US$1 = ৳${Number(sheet.rate).toFixed(2)}. Today's rate is still loading; this page updates when it arrives. ` : `Product and domain prices are in taka at US$1 = ৳${Number(sheet.rate).toFixed(2)}. `) + "The amount on this bill is the amount you pay." : "Product and domain prices are in US dollars until the exchange rate loads.")
        )
      );

      if (pay.paidAt) {
        const due = pay.paidAt + 30 * DAY;
        add(body, h("div", { class: "notice notice--ok" }, h("p", null, h("b", null, "Payment confirmed"), " on " + dateText(pay.paidAt) + ". Next, Forge prepares your business plan. Forge orders your goods after you have read it.")),
          h("div", { class: "notice notice--info", style: "margin-top:16px" }, h("p", null, h("b", null, "Upload your trade licence by " + dateText(due) + "."), " That is 30 days from today. If it is not uploaded, Forge stops the process of doing business."), st.documents.licence ? h("p", null, "Your licence is uploaded.") : h("p", null, h("a", { href: "#/documents" }, "Upload it on the documents page"))));
      }
      if (pay.paidAt || pay.reportedAt) { const ab = adjustBox(st, sheet); if (ab) add(body, ab); }
      if (pay.paidAt) {
        // already shown above
      } else if (pay.reportedAt) {
        pingForge("payment"); // the server sends it once; this covers a closed tab or a poor connection
        add(body, h("div", { class: "notice notice--forge" }, h("p", null, h("b", null, "Waiting for Forge to verify your payment.")), h("p", null, "You told us you paid on " + dateText(pay.reportedAt) + (pay.trxId ? " (transaction ID " + pay.trxId + ")" : "") + ". Please make sure the payment went through in your app. Forge verifies your payment within 30 minutes. Please wait here. Nothing is ordered until Forge confirms it.")),
          h("details", { class: "notice", style: "margin-top:12px" }, h("summary", null, "Show the payment QR again"), payPanel(formatBdt(pay.shownTotal || sheet.orderTotalNum || 0))),
          previewAction("confirm the payment", () => { update((s) => { s.payment.paidAt = Date.now(); if (s.product && !s.shipments.length) s.shipments.push(makeShipment(s, "first")); }); announce("Payment confirmed."); paint(); paintFoot(); }));
      } else if (!final) {
        add(body, h("div", { class: "notice notice--warn" }, h("p", null, h("b", null, "Your bill is not final yet.")), h("p", null, "Still waiting for: " + missing.join(", ") + ". Payment opens when everything is on the bill.")),
          previewAction("show a sample final bill", () => { update((s) => { s.payment.packagingCost = 4500; s.payment.websiteFee = 3000; }); paint(); }));
      } else {
        const payBtn = h("button", { type: "button", class: "btn btn--primary", disabled: !pay.quoteApprovedAt || !signed || !(sheet.orderTotalNum > 0) || String(pay.trxId || "").trim().length < 6, onclick: () => { update((s) => { s.payment.shownTotal = computeSheet(s).orderTotalNum; s.payment.reportedAt = Date.now(); }); announce("Thank you. Forge will check your payment."); pingForge("payment"); paint(); } }, "Submit");
        const trxField = () => {
          const input = h("input", { id: "f-trx", class: "field__control", type: "text", maxlength: "40", autocomplete: "off", value: pay.trxId || "", placeholder: "For example 9H7K2L1M" });
          input.addEventListener("input", () => { update((s) => { s.payment.trxId = input.value.trim(); }); payBtn.disabled = !(sheet.orderTotalNum > 0) || input.value.trim().length < 6; });
          return h("div", { class: "field", style: "margin-top:16px" }, h("label", { class: "field__label", for: "f-trx" }, "Transaction ID from your app"), input, h("p", { class: "field__help" }, "Forge uses it to find your payment. Press Submit once you have entered it."));
        };
        const noRefund = () => h("div", { class: "notice notice--warn", style: "margin-top:16px" }, h("p", null, h("b", null, "No refunds, no cancellations. "), "Once you pay, your payment is not refunded and your order is not cancelled. Only pay if you are sure."));
        // After scanning and paying, the owner says so here and submits. Nothing is sent until Submit.
        const payControls = () => {
          const paidBox = h("div", { hidden: pay.trxId ? false : true }, trxField(), noRefund(), h("div", { style: "margin-top:12px" }, payBtn), h("p", { class: "field__help", style: "margin-top:8px" }, "After you submit, Forge verifies your payment within 30 minutes."));
          const sel = h("select", { id: "f-paystatus", class: "field__control", "aria-label": "Payment status" }, h("option", { value: "no" }, "Not paid yet"), h("option", { value: "yes" }, "I have paid"));
          sel.value = pay.trxId ? "yes" : "no";
          const hint = h("p", { class: "field__help" }, "Scan the QR and pay first. Then choose \"I have paid\" and submit your request.");
          sel.addEventListener("change", () => { paidBox.hidden = sel.value !== "yes"; hint.hidden = sel.value === "yes"; });
          hint.hidden = sel.value === "yes";
          return h("div", { class: "payqr__status", style: "margin-top:16px" }, h("label", { class: "field__label", for: "f-paystatus" }, "Payment status"), sel, hint, paidBox);
        };
        add(body, h("section", { class: "section" },
          h("div", { class: "section__head" }, h("h2", null, "Approve and pay")),
          pay.quoteApprovedAt
            ? h("p", null, h("span", { class: "pill pill--ok" }, "Packaging quote approved"))
            : h("div", { class: "notice notice--warn" }, h("p", null, "Your packaging quote and design are ready. Approve them to add the cost to your bill."), h("button", { type: "button", class: "btn", onclick: () => { update((s) => { s.payment.quoteApprovedAt = Date.now(); }); paint(); } }, "Approve packaging quote")),
          pay.quoteApprovedAt && signed ? payPanel(sheet.orderTotal, payControls()) : h("p", { class: "field__help" }, "The payment QR appears here once your packaging quote is approved.")
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
        rows.some((r) => !r.paidAt && !r.reportedAt) ? payPanel(formatBdt(rows.filter((r) => !r.paidAt && !r.reportedAt).reduce((n, r) => n + r.amount, 0))) : null,
        freightNote(),
        unpaid > 0 ? h("p", { class: "num", style: "font-weight:600" }, "Unpaid: " + formatBdt(unpaid)) : null,
        pendingReorder ? previewAction("send the bill for my reorder", () => { update((s) => { const x = s.shipments.find((y) => y.id === pendingReorder.id); x.productAmount = rate ? Math.ceil(x.priceUsd * x.qty * rate) : Math.ceil(x.priceUsd * x.qty * 100); }); paint(); }) : null
      );
    }

    function paintFoot() {
      footSlot.replaceChildren(journeyFoot("billing", { go, canContinue: Boolean(getState().payment.paidAt), note: getState().payment.paidAt ? "" : "Opens when your payment is confirmed." }));
    }

    const root = h("section", { class: "screen" }, head("Billing", "Your bills and what you have paid. Forge orders your goods after your payment is confirmed and you have read your business plan."), reviewNote("billing"), body, footSlot);
    paint();
    // Repaint once when today's exchange rate replaces the planning rate.
    let seen = getState().fx ? getState().fx.source + getState().fx.rate : "";
    const off = subscribe((st) => {
      if (!root.isConnected) { off(); return; }
      const now = st.fx ? st.fx.source + st.fx.rate : "";
      if (now !== seen) { seen = now; paint(); }
    });
    return root;
  },
};
