// The order sheet: a running estimate that fills in as the owner decides.
import { h, formatBdt, formatUsd, usdToBdt } from "./ui.js?v=1791376988";
import { getState } from "./store.js?v=1791376988";
import { CONFIG } from "./config.js?v=1791376988";
import { addWorkingDays, formatDay } from "./time.js?v=1791376988";

// Pure calculation. Returns the rows to show and the running total.
export function computeSheet(st) {
  const rate = st.fx && Number(st.fx.rate) > 0 ? Number(st.fx.rate) : null;
  const money = (usd) => (rate ? formatBdt(usdToBdt(usd, rate)) : formatUsd(usd));
  const rows = [];
  let total = 0;
  let extra = 0; // amounts the team sets in taka
  const add = (usd) => {
    total += rate ? usdToBdt(usd, rate) : usd;
  };

  if (st.product && st.product.id) {
    const lineUsd = st.product.priceUsd * (st.qty || 0);
    rows.push({ key: "product", label: st.product.name, sub: `${st.qty} × ${formatUsd(st.product.priceUsd)}`, value: money(lineUsd) });
    add(lineUsd);
  } else {
    rows.push({ key: "product", label: "Product", sub: "Not chosen yet", pending: "" });
  }

  const d = st.domain;
  if (d && d.name) {
    if (d.status === "available" && d.priceCurrency === "USD" && Number(d.priceAmount) > 0) {
      rows.push({ key: "domain", label: d.name, sub: "Domain for 1 year", value: money(Number(d.priceAmount)) });
      add(Number(d.priceAmount));
    } else {
      rows.push({ key: "domain", label: d.name, sub: "Domain", pending: "Price confirmed by Forge" });
    }
  } else {
    rows.push({ key: "domain", label: "Domain", sub: "Not chosen yet", pending: "" });
  }

  const pay = st.payment || {};
  if (Number(pay.packagingCost) > 0) {
    rows.push({ key: "packaging", label: "Packaging", sub: pay.quoteApprovedAt ? "Quote approved" : "Quote ready, waiting for your approval", value: formatBdt(Number(pay.packagingCost)) });
    extra += Number(pay.packagingCost);
  } else if (st.packaging && st.packaging.requestedAt) {
    rows.push({ key: "packaging", label: "Packaging", sub: "Quote requested", pending: "Quote due " + formatDay(addWorkingDays(st.packaging.requestedAt, 3)) });
  } else {
    rows.push({ key: "packaging", label: "Packaging", pending: "Quoted by Forge" });
  }
  if (Number(pay.websiteFee) > 0) {
    rows.push({ key: "setup", label: "Website setup", value: formatBdt(Number(pay.websiteFee)) });
    extra += Number(pay.websiteFee);
  } else {
    rows.push({ key: "setup", label: "Website setup", pending: "Fee confirmed by Forge" });
  }
  const fmtTotal = (t, e) => (rate ? formatBdt(t + e) : e > 0 ? `${formatUsd(t)} + ${formatBdt(e)}` : formatUsd(t));
  const orderTotal = fmtTotal(total, extra); // what the first bill asks for, without freight
  const orderTotalNum = rate ? Math.round(total + extra) : null; // the same amount as a number, taka
  const freightTotal = (st.shipments || []).filter((x) => x.freight > 0).reduce((n, x) => n + x.freight, 0);
  const freightUnpaid = (st.shipments || []).filter((x) => x.freight > 0 && !x.freightPaidAt).reduce((n, x) => n + x.freight, 0);
  if (freightTotal > 0) {
    rows.push({ key: "freight", label: "Freight, duty and clearance", sub: freightUnpaid > 0 ? "Due when your goods arrive" : "Paid", value: formatBdt(freightTotal) });
    extra += freightUnpaid;
  } else {
    rows.push({ key: "freight", label: "Freight, duty and clearance", pending: "Billed when goods reach Bangladesh" });
  }

  return { orderTotal, orderTotalNum, rows, total: rate ? formatBdt(total + extra) : extra > 0 ? `${formatUsd(total)} + ${formatBdt(extra)}` : formatUsd(total), hasRate: Boolean(rate), rate };
}

export function renderSheet(open, onToggle) {
  const st = getState();
  const sheet = computeSheet(st);

  const list = h(
    "ul",
    { class: "sheet__rows" },
    sheet.rows.map((row) =>
      h(
        "li",
        { class: "sheet__row" },
        h("span", { class: "sheet__label" }, h("b", { title: row.label }, row.label), row.sub ? h("small", null, row.sub) : null),
        row.value ? h("span", { class: "sheet__value num" }, row.value) : row.pending ? h("span", { class: "sheet__value sheet__value--pending" }, row.pending) : null
      )
    )
  );

  let rateNote;
  if (sheet.hasRate) {
    const when = st.fx.fetchedAt ? new Date(st.fx.fetchedAt) : null;
    const dateText = when && !Number.isNaN(when.getTime()) ? ` on ${when.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "";
    rateNote = st.fx.source === "estimate" ? `Taka estimate at a planning rate of US$1 = ৳${Number(sheet.rate).toFixed(2)}. Today's rate is loading.` : `Taka estimate at US$1 = ৳${Number(sheet.rate).toFixed(2)}${CONFIG.demo ? " (sample rate)" : ""}${dateText}.`;
  } else {
    rateNote = "Shown in US dollars until the exchange rate loads.";
  }

  const toggle = h(
    "button",
    { type: "button", class: "btn btn--small sheet__toggle", "aria-expanded": open ? "true" : "false", "aria-controls": "sheet-rows", onclick: onToggle },
    open ? "Hide details" : "Show details"
  );
  list.id = "sheet-rows";

  return h(
    "div",
    { class: "sheet__paper" },
    h("div", { class: "sheet__head" }, h("span", { class: "sheet__title" }, "Order sheet"), h("span", { class: "sheet__sub" }, "Estimate")),
    list,
    h("div", { class: "sheet__total" }, h("span", null, "Total so far"), h("b", { class: "num" }, sheet.total)),
    h("p", { class: "sheet__note" }, `${rateNote} The final amount is confirmed on the billing page.`),
    toggle
  );
}
