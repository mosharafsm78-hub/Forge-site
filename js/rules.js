// Validation and progress rules. Pure functions, no page access, so they are easy to test.
import { BUILT, PREP, stageById } from "./stages.js?v=1791340075";
import { CONFIG } from "./config.js?v=1791340075";
import { industryById } from "./data/industries.js?v=1791340075";
import { MIN_CAPITAL, MIN_CAPITAL_TEXT } from "./minimum.js?v=1791340075";

export const PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Age in whole years from a YYYY-MM-DD string. Returns null if the date is not real.
export function ageFrom(dob, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob || "")) return null;
  const [y, m, d] = dob.split("-").map(Number);
  const born = new Date(y, m - 1, d);
  if (born.getFullYear() !== y || born.getMonth() !== m - 1 || born.getDate() !== d) return null;
  let age = today.getFullYear() - y;
  const birthdayPassed = today.getMonth() > m - 1 || (today.getMonth() === m - 1 && today.getDate() >= d);
  if (!birthdayPassed) age -= 1;
  return age;
}

const pick = (v) => (v && String(v).trim() ? "" : "Choose one option.");

export const profileRules = {
  fullName: (v) => {
    const t = (v || "").trim();
    if (!t) return "Enter your full name.";
    if (t.length < 3) return "Enter your full name as it appears on your NID.";
    return "";
  },
  phone: (v) => (PHONE_RE.test((v || "").replace(/[\s-]/g, "")) ? "" : "Enter a Bangladesh mobile number, like 01XXXXXXXXX."),
  email: (v) => (EMAIL_RE.test((v || "").trim()) ? "" : "Enter a valid email address."),
  dob: (v) => {
    const age = ageFrom(v);
    if (age === null) return "Enter your date of birth.";
    if (age < 18) return "You must be 18 or older to start a business with Forge.";
    if (age > 100) return "Check the date of birth.";
    return "";
  },
  district: (v) => ((v || "").trim() ? "" : "Enter your city or district."),
  occupation: pick,
  experience: pick,
  selling: pick,
  capital: (v) => {
    const n = Number(String(v ?? "").replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return "Enter an amount in taka greater than zero.";
    if (n < MIN_CAPITAL) return `Forge needs you to have at least ${MIN_CAPITAL_TEXT} ready. Less than that cannot cover a first batch with freight, domain and packaging.`;
    return "";
  },
  hours: pick,
  goal: pick,
  license: pick,
  payout: pick,
  stock: pick,
};

export function validateProfile(profile = {}) {
  const errors = {};
  for (const [key, rule] of Object.entries(profileRules)) {
    const message = rule(profile[key], profile);
    if (message) errors[key] = message;
  }
  return errors;
}

export function validateBusinessName(value) {
  const t = (value || "").trim();
  if (!t) return "Enter a business name.";
  if (t.length < 3) return "Use at least 3 characters.";
  if (t.length > 40) return "Use 40 characters or fewer.";
  if (!/^[\p{L}\p{N}][\p{L}\p{N} &'.-]*$/u.test(t)) return "Use letters, numbers and spaces. You can also use & ' . and -";
  return "";
}

// Lowercase English letters and digits only, for building domain ideas.
export function slugify(name) {
  return String(name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 40);
}

const DOMAIN_RE = /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
export function normalizeDomain(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}
export function isValidDomain(input) {
  return DOMAIN_RE.test(normalizeDomain(input));
}

// What the owner must give for sales money, from the answer on the details page.
export function payoutNeeds(st) {
  const p = (st.profile && st.profile.payout) || "";
  return { bank: p === "Bank account" || p === "Both bank and bKash", bkash: p === "bKash only" || p === "Both bank and bKash" };
}

export function validateBkash(v) {
  return PHONE_RE.test(String(v || "").replace(/[\s-]/g, "")) ? "" : "Enter the bKash number as 01XXXXXXXXX.";
}

// Which parts of the documents page are still missing. Empty list means complete.
export function documentsMissing(st) {
  const d = st.documents || {};
  const need = payoutNeeds(st);
  const missing = [];
  if (!d.nidFront) missing.push("nidFront");
  if (!d.nidBack) missing.push("nidBack");
  if (need.bank && !d.cheque) missing.push("cheque");
  if (need.bkash && validateBkash(d.bkash)) missing.push("bkash");
  if (!d.agreementSigned) missing.push("agreementSigned");
  return missing;
}

// Documents are all in. On the live site Forge must also have checked them, and checked them
// after the newest file was added: a changed file needs checking again.
export function documentsChecked(st) {
  if (CONFIG.demo) return true;
  const d = st.documents || {};
  const latest = Math.max(0, ...["nidFront", "nidBack", "cheque", "licence", "agreementSigned"].map((k) => (d[k] && d[k].at) || 0));
  return Boolean(d.verifiedAt) && d.verifiedAt >= latest;
}

export function isComplete(stageId, st) {
  switch (stageId) {
    case "profile":
      return Object.keys(validateProfile(st.profile)).length === 0;
    case "industry":
      return Boolean(industryById(st.industryId));
    case "product":
      return Boolean(st.product && st.product.id) && Number.isInteger(st.qty) && st.qty >= 1;
    case "name":
      return !validateBusinessName(st.name && st.name.chosen);
    case "brand":
      return Boolean(st.brand.logo.chosenId) && Boolean(st.brand.page.url);
    case "packaging":
      // Complete once the quote is asked for. The owner approves the quote later, at billing.
      return Boolean(st.packaging.requestedAt);
    case "domain":
      return Boolean(st.domain && st.domain.name);
    case "documents":
      return documentsMissing(st).length === 0 && documentsChecked(st);
    case "billing":
      return Boolean(st.payment.paidAt);
    case "plan":
      return Boolean(st.plan.readAt);
    case "freight":
      return st.shipments.some((x) => x.receivedAt); // the first goods are with the owner
    case "marketing":
      return Boolean(st.marketing.launchedAt);
    default:
      return false; // orders, returns and reorder carry on for as long as the business runs
  }
}

// A stage opens when it exists and everything it needs is complete.
// Whether the owner can fill in a stage. In the live workspace this is strict, one stage after another.
export function canFill(stageId, st) {
  if (stageId === "welcome" || stageId === "pause" || stageId === "accounting") return true;
  // The sample-data preview lets a reviewer fill every page. The live site never does.
  if (CONFIG.demo) return true;
  if (stageId === "summary") return PREP.every((id) => isComplete(id, st));
  const stage = stageById(stageId);
  if (!stage || !stage.built) return false;
  return stage.needs.every((id) => isComplete(id, st));
}

// Every built page can be looked at, so the owner sees the whole journey. Filling in follows canFill.
export function canOpen(stageId, st) {
  if (stageId === "welcome" || stageId === "pause" || stageId === "summary" || stageId === "accounting") return true;
  const stage = stageById(stageId);
  return Boolean(stage && stage.built);
}

// The first unfinished stage that stands in the way of this one, for the "finish this first" note.
export function blockingStage(stageId, st, seen = new Set()) {
  if (seen.has(stageId)) return null;
  seen.add(stageId);
  const needs = stageId === "summary" ? PREP : (stageById(stageId) || { needs: [] }).needs;
  for (const id of needs) {
    if (isComplete(id, st)) continue;
    return blockingStage(id, st, seen) || stageById(id);
  }
  return null;
}

export function firstOpenStage(st) {
  for (const id of PREP) if (!isComplete(id, st) && !stageById(id).needs.some((n) => !isComplete(n, st))) return id;
  return "summary";
}

// Plain-words state of a stage for the stage panel.
// state: done | waiting | open | locked | later
export function stageStatus(stageId, st) {
  const stage = stageById(stageId);
  if (!stage.built) return { state: "later", text: "Opens later" };
  if (isComplete(stageId, st)) {
    if (stageId === "packaging") return { state: "done", text: "Quote asked for" };
    return { state: "done", text: "Done" };
  }
  if (stage.needs.some((id) => !isComplete(id, st))) {
    const need = stage.needs.find((id) => !isComplete(id, st));
    return { state: "locked", text: "Starts after: " + stageById(need).label.toLowerCase() };
  }
  if (stageId === "documents" && documentsMissing(st).length === 0) return { state: "waiting", text: "Forge is checking" };
  if (stageId === "brand") {
    const b = st.brand;
    if (b.logo.requestedAt || b.page.requestedAt) return { state: "waiting", text: "Forge is working" };
  }
  if (stage.ongoing) return { state: "open", text: "Ongoing" };
  return { state: "open", text: stage.who === "forge" ? "Forge's turn" : "Your turn" };
}

export function nextAfter(stageId) {
  const index = BUILT.indexOf(stageId);
  return index >= 0 && index < BUILT.length - 1 ? BUILT[index + 1] : "summary";
}

// Where "Continue" should lead from a preparation stage: the next one that is open and not finished, else null.
export function nextToDo(stageId, st) {
  const start = PREP.indexOf(stageId);
  const order = [...PREP.slice(start + 1), ...PREP.slice(0, Math.max(start, 0))];
  return order.find((id) => id !== stageId && !isComplete(id, st) && !stageById(id).needs.some((n) => !isComplete(n, st))) || null;
}

// The stage after this one in the journey, for stages after payment.
export function followingStage(stageId) {
  const i = BUILT.indexOf(stageId);
  return i >= 0 && i < BUILT.length - 1 ? BUILT[i + 1] : null;
}
