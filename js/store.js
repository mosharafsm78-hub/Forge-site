// The owner's file. With an account it is saved to the server; the sample-data preview keeps it in the browser.
// The screens keep calling getState() and update(). Two people write to one file:
//   owner_data: what the owner enters (the server lets only the owner change it)
//   staff_data: what the Forge team sets (amounts, deliveries, confirmations; the owner cannot change it)
// The screens see one merged file.
import { CONFIG } from "./config.js?v=1791345317";

// Sample-data previews keep their own saved file so they never mix with a real one.
const KEY = CONFIG.demo ? "forge.file.v2.demo" : "forge.file.v2";

function blank() {
  return {
    v: 2,
    profile: {},
    industryId: "",
    industryNote: "",
    product: null,
    qty: 10,
    name: { chosen: "", alt1: "", alt2: "", wantsSuggestions: false, suggestRequestedAt: null, suggestions: [], suggestedAt: null },
    domain: null,
    // Logo and Facebook page. Each is requested, then delivered by the Forge team.
    brand: {
      logo: { types: [], color: "", notes: "", requestedAt: null, forName: "", deliveredAt: null, options: [], chosenId: "" },
      page: { pageName: "", profile: "", requestedAt: null, deliveredAt: null, url: "" },
    },
    // Packaging quote request. The quote itself comes back from the Forge team.
    packaging: {
      items: {
        polybag: { on: true, qty: 0 },
        box: { on: true, qty: 0 },
        sticker: { on: false, qty: 0 },
        card: { on: false, qty: 0 },
      },
      useLogo: true,
      notes: "",
      requestedAt: null,
    },
    // Files are described here, not stored. Real storage arrives with the database.
    documents: { nidFront: null, nidBack: null, cheque: null, licence: null, bankName: "", bkash: "", agreementReady: false, agreementSigned: null },
    // After payment. The Forge team sets the amounts and confirms each step; the owner sees and acts on theirs.
    payment: { packagingCost: 0, websiteFee: 0, quoteApprovedAt: null, reportedAt: null, shownTotal: null, paidAt: null, trxId: "" },
    plan: { draftedAt: null, readAt: null, doc: null },
    // One line per batch of goods. The Forge team moves it from "not shipped" to "at Bangladesh" and sets the freight.
    shipments: [],
    marketing: { budget: 0, launchedAt: null, postRequestedAt: null, postedAt: null, spent: 0, reached: 0 },
    orders: { list: [] },
    reorder: { qty: 0, requestedAt: null },
    pausedAt: null,
    fx: null,
  };
}

function merge(base, extra) {
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) return base;
  const out = { ...base };
  for (const key of Object.keys(extra)) {
    const b = base[key];
    out[key] = b && typeof b === "object" && !Array.isArray(b) && extra[key] && typeof extra[key] === "object" && !Array.isArray(extra[key]) ? merge(b, extra[key]) : extra[key];
  }
  return out;
}

// What only the Forge team may set. These are removed from whatever the owner sends.
const STAFF_PATHS = [
  "documents.agreementReady", "documents.verifiedAt", "documents.reviewNote",
  "brand.logo.options", "brand.logo.deliveredAt", "brand.page.url", "brand.page.deliveredAt",
  "payment.packagingCost", "payment.websiteFee", "payment.paidAt", "payment.quote", "payment.receivedAmount",
  "plan.draftedAt", "plan.doc", "name.suggestions", "name.suggestedAt", "marketing.budget", "marketing.launchedAt", "marketing.postedAt", "marketing.spent", "marketing.reached",
  "shipments", "orders.list",
];
// The few things the owner does to a staff-owned shipment or order.
const SHIP_OWNER = ["freightReportedAt", "productReportedAt", "receivedAt"];
const ORDER_OWNER = ["handed", "restocked"];

const clone = (v) => JSON.parse(JSON.stringify(v));
function deleteAt(obj, path) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) { o = o && o[keys[i]]; if (!o || typeof o !== "object") return; }
  delete o[keys[keys.length - 1]];
}

// Owner file to save: everything except the staff parts, plus a note of what the owner did to staff records.
export function toOwnerData(st) {
  const out = clone({ ...st, fx: null });
  const shipmentReports = {};
  for (const sh of st.shipments || []) {
    const r = {};
    for (const k of SHIP_OWNER) if (sh[k]) r[k] = sh[k];
    if (Object.keys(r).length) shipmentReports[sh.id] = r;
  }
  const orderMoves = {};
  for (const o of (st.orders && st.orders.list) || []) if (o.status === "handed" || o.status === "restocked") orderMoves[o.id] = o.status;
  for (const path of STAFF_PATHS) deleteAt(out, path);
  delete out.fx;
  out.shipmentReports = shipmentReports;
  out.orderMoves = orderMoves;
  return out;
}

// Merge the owner's data and the team's data into the file the screens use.
export function compose(owner, staff) {
  // Never trust the owner's copy for staff-only values: anyone can send anything to their own row.
  const o = clone(owner || {});
  for (const path of STAFF_PATHS) deleteAt(o, path);
  const base = merge(blank(), o);
  const withStaff = merge(base, staff || {});
  const only = (r) => Object.fromEntries(Object.entries(r || {}).filter(([k, v]) => SHIP_OWNER.includes(k) && typeof v === "number"));
  const sh = (staff && Array.isArray(staff.shipments) ? staff.shipments : []).map((x) => ({ ...x, ...only((o.shipmentReports || {})[x.id]) }));
  withStaff.shipments = sh;
  const list = (staff && staff.orders && Array.isArray(staff.orders.list) ? staff.orders.list : []).map((x) => {
    const m = (o.orderMoves || {})[x.id];
    // The owner can only hand over a confirmed order and receive back a returned one.
    if (m === "handed" && x.status === "confirmed") return { ...x, status: "handed" };
    if (m === "restocked" && x.status === "returned") return { ...x, status: "restocked" };
    return x;
  });
  withStaff.orders = { ...withStaff.orders, list };
  delete withStaff.shipmentReports;
  delete withStaff.orderMoves;
  withStaff.fx = null;
  return withStaff;
}

let storageOk = true;
let account = null; // { id, email } when signed in
let server = null; // the backend, when live
let saveState = "saved"; // saved | saving | error
let staffData = {};
let ownerBase = {};
let testAccount = false;
let retryTimer = null;
let dirty = false;

export const saveStatus = () => saveState;
export const currentUser = () => account;
export const isLive = () => Boolean(CONFIG.live);
// Test tools show in the sample-data preview, and on a real account only if it is a listed test account.
export const testMode = () => Boolean(CONFIG.demo || testAccount);


function load() {
  if (CONFIG.live) return blank();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 2) return blank();
    const base = blank();
    // The exchange rate is never read back from storage. It is fetched fresh each visit.
    return { ...merge(base, parsed), fx: null };
  } catch {
    storageOk = false;
    return blank();
  }
}

let state = load();
const listeners = new Set();
let saveTimer = null;

async function flush() {
  if (!server || !account || !dirty) return;
  dirty = false;
  saveState = "saving";
  listeners.forEach((fn) => fn(state));
  try {
    const data = toOwnerData(state);
    await server.saveOwner(account.id, data);
    ownerBase = data;
    saveState = dirty ? "saving" : "saved";
    if (dirty) { window.clearTimeout(saveTimer); saveTimer = window.setTimeout(flush, 600); }
  } catch {
    dirty = true;
    saveState = "error";
    window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(flush, 5000);
  }
  listeners.forEach((fn) => fn(state));
}

function persist() {
  if (CONFIG.live) {
    if (!server || !account) return;
    dirty = true;
    saveState = "saving";
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flush, 800);
    return;
  }
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...state, fx: null }));
      storageOk = true;
    } catch {
      storageOk = false;
    }
    listeners.forEach((fn) => fn(state));
  }, 250);
}

export const getState = () => state;

// The exchange rate is looked up fresh each visit and is never saved.
export function setFx(fx) {
  state.fx = fx;
  listeners.forEach((fn) => fn(state));
}
export const isSaved = () => (CONFIG.live ? saveState !== "error" : storageOk);

export function update(mutator) {
  mutator(state);
  persist();
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Sign in: load this person's file. Sign out: forget it, so the next person never sees it.
export async function attach(backend, user) {
  server = backend;
  account = user;
  dirty = false;
  saveState = "saved";
  testAccount = false;
  if (CONFIG.testTools && typeof backend.isTestAccount === "function") testAccount = await backend.isTestAccount().catch(() => false);
  const file = await backend.loadFile(user.id);
  ownerBase = file.owner_data || {};
  staffData = file.staff_data || {};
  const fx = state.fx;
  state = compose(ownerBase, staffData);
  state.fx = fx;
  listeners.forEach((fn) => fn(state));
}

export function applyServer(row) {
  if (!row) return;
  staffData = row.staff_data || {};
  if (!dirty) ownerBase = row.owner_data || ownerBase;
  const fx = state.fx;
  state = compose(dirty ? toOwnerData(state) : ownerBase, staffData);
  state.fx = fx;
  listeners.forEach((fn) => fn(state));
}

export function detach() {
  window.clearTimeout(saveTimer);
  window.clearTimeout(retryTimer);
  server = null;
  account = null;
  testAccount = false;
  dirty = false;
  staffData = {};
  ownerBase = {};
  state = blank();
  listeners.forEach((fn) => fn(state));
}

export async function saveNow() {
  window.clearTimeout(saveTimer);
  await flush();
}

export function reset() {
  if (CONFIG.live) return; // a live file is never wiped from a button
  state = blank();
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable, nothing to clear */
  }
  listeners.forEach((fn) => fn(state));
}

// ---- Test tools: play Forge's side on a real file ----
const getPath = (o, p) => p.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o);
function setPath(o, p, v) {
  const keys = p.split(".");
  let t = o;
  for (let i = 0; i < keys.length - 1; i++) t = t[keys[i]] = t[keys[i]] || {};
  t[keys[keys.length - 1]] = v;
}

// Send the staff-owned parts of the file to the database, so the next pages see them like a real Forge step.
export async function syncStaff() {
  if (!server || !account || !testAccount || !server.testPatch) return false;
  const patch = {};
  for (const path of STAFF_PATHS) {
    const v = getPath(state, path);
    if (v !== undefined && v !== null) setPath(patch, path, clone(v));
  }
  try {
    const row = await server.testPatch(patch);
    staffData = row || staffData;
    const fx = state.fx;
    state = compose(dirty ? toOwnerData(state) : ownerBase, staffData);
    state.fx = fx;
    listeners.forEach((fn) => fn(state));
    return true;
  } catch {
    return false;
  }
}

// Wipe a test file back to a blank start.
export async function resetTestFile() {
  if (!server || !account || !testAccount) return;
  const backend = server;
  const user = account;
  await backend.testReset();
  await attach(backend, user);
  if (!getState().profile.email) update((s) => { s.profile.email = user.email; });
}
