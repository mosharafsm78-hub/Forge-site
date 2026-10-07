// The Forge team page: see every owner's file, check documents, and fill in the parts only the team can write.
// Safety is in the database, not here: it refuses every write unless the signed-in person is on the team.
import { h, clear, formatBdt } from "../ui.js";
import { loadBackend } from "../backend.js";

const app = document.getElementById("app");
let be, me = null, files = [], openId = "", msg = null;

const dateText = (t) => (t ? new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not yet");
const DOC_KEYS = [["nidFront", "NID, front"], ["nidBack", "NID, back"], ["cheque", "Cheque leaf"], ["licence", "Trade licence"], ["agreementSigned", "Signed agreement"]];

function merged(f) { // what the owner sees: team fields win over the owner's copy
  const o = JSON.parse(JSON.stringify(f.owner_data || {}));
  const s = f.staff_data || {};
  for (const [k, v] of Object.entries(s)) {
    if (v && typeof v === "object" && !Array.isArray(v)) o[k] = { ...(o[k] || {}), ...v }; else o[k] = v;
  }
  return o;
}

function stageOf(d) {
  const doc = d.documents || {};
  const uploaded = ["nidFront", "nidBack", "agreementSigned"].every((k) => doc[k]);
  const latest = Math.max(0, ...DOC_KEYS.map(([k]) => (doc[k] && doc[k].at) || 0));
  const checked = Boolean(doc.verifiedAt) && doc.verifiedAt >= latest;
  const paid = d.payment && d.payment.paidAt;
  if (paid) return ["Paid", false];
  if (uploaded && !checked) return ["Documents to check", true];
  if (checked) return ["Documents verified", false];
  return ["Getting started", false];
}

function setMsg(text, bad) { msg = text ? { text, bad: Boolean(bad) } : null; }
function msgEl() { return msg ? h("p", { class: "st__msg" + (msg.bad ? " st__msg--err" : ""), role: "status" }, msg.text) : null; }

async function patch(userId, p, done) {
  try {
    const out = await be.staffPatch(userId, p);
    const f = files.find((x) => x.user_id === userId);
    if (f) f.staff_data = out || f.staff_data;
    setMsg(done || "Saved.");
  } catch (e) { setMsg(e.message, true); }
  render();
}

function loginView(error) {
  const email = h("input", { type: "email", id: "e", autocomplete: "username", required: true });
  const pw = h("input", { type: "password", id: "p", autocomplete: "current-password", required: true });
  const err = h("p", { class: "st__msg st__msg--err", role: "alert", hidden: !error }, error || "");
  const btn = h("button", { class: "btn btn--primary", type: "submit" }, "Log in");
  return h("main", { class: "st st__login" }, h("h1", { class: "st__title" }, "Forge team"),
    h("p", null, "For the Forge team only."),
    h("form", { onsubmit: async (e) => {
      e.preventDefault(); btn.disabled = true; err.hidden = true;
      try { await be.signIn(email.value.trim().toLowerCase(), pw.value); } catch (x) { err.textContent = x.message; err.hidden = false; }
      btn.disabled = false;
    } }, h("label", { for: "e" }, "Email"), email, h("label", { for: "p" }, "Password"), pw, h("div", { class: "st__row" }, btn), err));
}

function listView() {
  const rows = files.map((f) => {
    const d = merged(f), pr = d.profile || {};
    const [label, wait] = stageOf(d);
    return h("tr", null,
      h("td", null, h("a", { href: "#" + f.user_id, class: "st__back" }, pr.fullName || "No name yet")),
      h("td", null, pr.phone || ""), h("td", null, pr.email || ""),
      h("td", null, pr.capital ? formatBdt(Number(pr.capital)) : ""),
      h("td", null, h("span", { class: "st__tag" + (wait ? " st__tag--wait" : "") }, label)),
      h("td", null, dateText(f.updated_at && Date.parse(f.updated_at))));
  });
  return h("div", null, msgEl(), files.length
    ? h("div", { class: "st__wrap" }, h("table", null,
      h("thead", null, h("tr", null, ["Name", "Phone", "Email", "Capital", "Where they are", "Last change"].map((t) => h("th", { scope: "col" }, t)))),
      h("tbody", null, rows)))
    : h("p", null, "No owners yet."));
}

function kv(pairs) { return h("dl", { class: "st__kv" }, pairs.map(([k, v]) => [h("dt", null, k), h("dd", null, v === undefined || v === "" || v === null ? "Not given" : String(v))])); }

function detailView(f) {
  const d = merged(f), pr = d.profile || {}, doc = d.documents || {}, pay = d.payment || {};
  const uid = f.user_id;
  const [stage] = stageOf(d);

  // Documents
  const docRows = DOC_KEYS.map(([k, label]) => {
    const x = doc[k];
    const open = x && x.path ? h("button", { type: "button", class: "btn btn--small btn--quiet", onclick: async () => {
      try { window.open(await be.documentUrl(x.path), "_blank", "noopener"); } catch (e) { setMsg(e.message, true); render(); }
    } }, "Open") : null;
    return [h("dt", null, label), h("dd", null, x ? [x.name + " (" + dateText(x.at) + ") ", open] : "Not uploaded")];
  });
  const note = h("textarea", { id: "note", rows: 3 }, "");
  note.value = doc.reviewNote || "";
  const docCard = h("section", { class: "st__card" }, h("h2", null, "Documents"),
    h("dl", { class: "st__kv" }, docRows), kv([["Bank", doc.bankName], ["bKash", doc.bkash], ["Checked", doc.verifiedAt ? dateText(doc.verifiedAt) : "Not yet"]]),
    h("div", { class: "st__row" },
      h("button", { type: "button", class: "btn btn--primary btn--small", onclick: () => patch(uid, { documents: { verifiedAt: Date.now(), reviewNote: "" } }, "Documents marked as checked.") }, "Documents are correct"),
      h("button", { type: "button", class: "btn btn--small", onclick: () => {
        if (!note.value.trim()) { setMsg("Write what the owner needs to change first.", true); render(); return; }
        patch(uid, { documents: { verifiedAt: null, reviewNote: note.value.trim() } }, "The owner will see your note.");
      } }, "Needs a change")),
    h("label", { for: "note" }, "Note to the owner (shown when something must change)"), note,
    h("div", { class: "st__row" }, h("label", null, h("input", { type: "checkbox", checked: Boolean(doc.agreementReady), onchange: (e) => patch(uid, { documents: { agreementReady: e.target.checked } }, e.target.checked ? "Agreement shown as ready." : "Agreement hidden.") }), " Agreement is ready for the owner to sign")));

  // Money
  const pc = h("input", { type: "number", id: "pc", min: "0", value: String(pay.packagingCost || 0) });
  const wf = h("input", { type: "number", id: "wf", min: "0", value: String(pay.websiteFee || 0) });
  const payCard = h("section", { class: "st__card" }, h("h2", null, "Bill"),
    kv([["Owner approved quote", pay.quoteApprovedAt ? dateText(pay.quoteApprovedAt) : "Not yet"], ["Owner says paid", pay.reportedAt ? dateText(pay.reportedAt) : "Not yet"], ["Payment confirmed", pay.paidAt ? dateText(pay.paidAt) : "Not yet"]]),
    h("label", { for: "pc" }, "Packaging cost (BDT)"), pc, h("label", { for: "wf" }, "Website setup fee (BDT)"), wf,
    h("div", { class: "st__row" },
      h("button", { type: "button", class: "btn btn--small", onclick: () => patch(uid, { payment: { packagingCost: Math.max(0, Number(pc.value) || 0), websiteFee: Math.max(0, Number(wf.value) || 0) } }, "Bill amounts saved.") }, "Save amounts"),
      h("button", { type: "button", class: "btn btn--primary btn--small", disabled: Boolean(pay.paidAt), onclick: () => patch(uid, { payment: { paidAt: Date.now() } }, "Payment confirmed. The owner can now see it.") }, "Confirm payment received")));

  // Plan, page
  const pg = (d.brand && d.brand.page) || {};
  const url = h("input", { type: "text", id: "pu", value: pg.url || "", placeholder: "facebook.com/..." });
  const workCard = h("section", { class: "st__card" }, h("h2", null, "Work for this owner"),
    kv([["Business plan drafted", (d.plan && d.plan.draftedAt) ? dateText(d.plan.draftedAt) : "Not yet"], ["Facebook page", pg.deliveredAt ? "Delivered " + dateText(pg.deliveredAt) : "Not delivered"]]),
    h("div", { class: "st__row" }, h("button", { type: "button", class: "btn btn--small", disabled: Boolean(d.plan && d.plan.draftedAt), onclick: () => patch(uid, { plan: { draftedAt: Date.now() } }, "Plan marked as drafted.") }, "Business plan is ready")),
    h("label", { for: "pu" }, "Facebook page address"), url,
    h("div", { class: "st__row" }, h("button", { type: "button", class: "btn btn--small", onclick: () => {
      if (!url.value.trim()) { setMsg("Enter the page address first.", true); render(); return; }
      patch(uid, { brand: { page: { url: url.value.trim(), deliveredAt: Date.now() } } }, "Page delivered to the owner.");
    } }, "Deliver page")));

  // Owner details
  const infoCard = h("section", { class: "st__card" }, h("h2", null, "Owner"),
    kv([["Name", pr.fullName], ["Phone", pr.phone], ["Email", pr.email], ["District", pr.district], ["Occupation", pr.occupation], ["Experience", pr.experience], ["Capital", pr.capital ? formatBdt(Number(pr.capital)) : ""], ["Goal", pr.goal], ["Licence", pr.license], ["Payout", pr.payout], ["Business name", d.name && d.name.chosen], ["Domain", d.domain && d.domain.name], ["Product", d.product && d.product.name], ["Quantity", d.qty]]));

  return h("div", null, h("p", null, h("a", { href: "#", class: "st__back" }, "All owners")), h("p", null, h("span", { class: "st__tag" }, stage)), msgEl(),
    h("div", { class: "st__grid" }, infoCard, docCard, payCard, workCard));
}

function render() {
  clear(app);
  if (!me) { app.append(loginView()); return; }
  if (me === "denied") { app.append(h("main", { class: "st st__login" }, h("h1", null, "No access"), h("p", null, "This account is not on the Forge team."), h("button", { class: "btn", type: "button", onclick: () => be.signOut() }, "Log out"))); return; }
  const bar = h("div", { class: "st__bar" }, h("h1", null, "Forge team"), h("div", { class: "st__who" }, h("span", null, me.email),
    h("button", { type: "button", class: "btn btn--small btn--quiet", onclick: () => load(true) }, "Refresh"),
    h("button", { type: "button", class: "btn btn--small btn--quiet", onclick: () => be.signOut() }, "Log out")));
  const f = openId && files.find((x) => x.user_id === openId);
  app.append(h("main", { class: "st" }, bar, f ? detailView(f) : listView()));
}

async function load(quiet) {
  try { files = await be.listFiles(); if (!quiet) setMsg(""); else setMsg("Updated."); } catch (e) { setMsg(e.message, true); }
  render();
}

async function boot() {
  be = await loadBackend();
  window.addEventListener("hashchange", () => { openId = location.hash.replace(/^#\/?/, ""); setMsg(""); render(); });
  openId = location.hash.replace(/^#\/?/, "");
  be.onAuth(async (_ev, user) => {
    if (!user) { me = null; files = []; render(); return; }
    me = (await be.isStaff()) ? user : "denied";
    if (me !== "denied") await load(); else render();
  });
  const u = await be.init();
  if (u) { me = (await be.isStaff()) ? u : "denied"; if (me !== "denied") await load(); }
  render();
}
boot();
