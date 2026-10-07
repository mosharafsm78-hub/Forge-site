// Hash routes: #/profile, #/industry, and so on. A stage only opens when the ones before it are complete.
import { h } from "./ui.js?v=1791340302";
import { getState, currentUser, subscribe } from "./store.js?v=1791340302";
import { CONFIG } from "./config.js?v=1791340302";
import auth, { AUTH_IDS, OPEN_AUTH_IDS } from "./screens/auth.js?v=1791340302";
import { canFill, blockingStage } from "./rules.js?v=1791340302";
import { setCurrent } from "./chrome.js?v=1791340302";
import welcome from "./screens/welcome.js?v=1791340302";
import profile from "./screens/profile.js?v=1791340302";
import industry from "./screens/industry.js?v=1791340302";
import product from "./screens/product.js?v=1791340302";
import name from "./screens/name.js?v=1791340302";
import domain from "./screens/domain.js?v=1791340302";
import brand from "./screens/brand.js?v=1791340302";
import packaging from "./screens/packaging.js?v=1791340302";
import documents from "./screens/documents.js?v=1791340302";
import billing from "./screens/billing.js?v=1791340302";
import plan from "./screens/plan.js?v=1791340302";
import freight from "./screens/freight.js?v=1791340302";
import marketing from "./screens/marketing.js?v=1791340302";
import orders from "./screens/orders.js?v=1791340302";
import returns from "./screens/returns.js?v=1791340302";
import reorder from "./screens/reorder.js?v=1791340302";
import pause from "./screens/pause.js?v=1791340302";
import summary from "./screens/summary.js?v=1791340302";
import accounting from "./screens/accounting.js?v=1791340302";

const screens = { welcome, profile, industry, product, name, brand, packaging, domain, documents, summary, billing, plan, freight, marketing, orders, returns, reorder, pause, accounting, ...auth };

function idFromHash() {
  const match = window.location.hash.match(/^#\/([a-z]+)/);
  return match ? match[1] : "welcome";
}

export function go(id) {
  if (window.location.hash === "#/" + id) show();
  else window.location.hash = "#/" + id;
}

function fallbackScreen() {
  return h(
    "section",
    { class: "screen" },
    h("div", { class: "screen__head" }, h("h1", null, "This page could not be shown")),
    h("div", { class: "notice notice--error" }, h("p", null, "Something went wrong while opening this page. Your answers are saved."), h("button", { type: "button", class: "btn", onclick: () => window.location.reload() }, "Reload the page"))
  );
}

let currentNode = null;
let lastLocked = false;

// On every page: a plain reminder, like the one under an AI chat box.
function riskBox() {
  return h("p", { class: "riskbox", role: "note" }, h("b", null, "Forge is your business assistant. "), "It makes starting a business easier, but it cannot guarantee a profit. Forge can make mistakes, and like any business, yours can lose money at times. Check every amount before you pay. ", h("a", { href: "#/pause" }, "Pause or exit anytime"), ".");
}

let toastTimer = null;
// The friendly nudge when someone taps a page that is not open yet.
function lockToast(blocker) {
  let t = document.getElementById("locktoast");
  if (!t) { t = h("div", { id: "locktoast", class: "locktoast", role: "status" }); document.body.appendChild(t); }
  const label = blocker ? blocker.label : "the step before it";
  t.replaceChildren(h("span", null, h("b", null, "Almost there. "), "Please finish ", blocker ? h("a", { href: "#/" + blocker.id }, label) : label, " first. This page opens right after."));
  t.classList.add("is-on");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove("is-on"), 5000);
}

// A page that is not open for filling yet: the owner can read all of it, but nothing can be changed.
function lockView(node, id, st) {
  const blocker = blockingStage(id, st);
  const note = h(
    "div",
    { class: "notice notice--forge", role: "note" },
    h("p", null, h("b", null, "Preview only. "), blocker ? "You can read this page now. It opens for you once you finish " : "You can read this page now. It opens for you after the steps before it.", blocker ? h("a", { href: "#/" + blocker.id }, blocker.label) : null, blocker ? "." : "")
  );
  node.classList.add("is-preview");
  node.querySelectorAll("input, select, textarea").forEach((el) => { el.readOnly = true; el.setAttribute("aria-disabled", "true"); });
  node.querySelectorAll("button").forEach((el) => el.setAttribute("aria-disabled", "true"));
  const stop = (e) => {
    const t = e.target.closest ? e.target.closest("input, select, textarea, button, label, .logo-card") : null;
    if (!t || (e.type === "keydown" && ["Tab", "Shift", "Escape"].includes(e.key))) return;
    e.preventDefault();
    e.stopPropagation();
    lockToast(blocker);
  };
  ["click", "keydown"].forEach((type) => node.addEventListener(type, stop, true));
  node.prepend(note);
}

function show() {
  let id = idFromHash();
  if (!screens[id]) id = "welcome";
  if (CONFIG.live) {
    const user = currentUser();
    if (!user && !OPEN_AUTH_IDS.includes(id)) { window.location.replace("#/login"); return; }
    if (user && AUTH_IDS.includes(id) && id !== "reset") { window.location.replace("#/welcome"); return; }
  }
  document.body.classList.toggle("auth", AUTH_IDS.includes(id));
  const st = getState();
  const locked = !AUTH_IDS.includes(id) && !canFill(id, st);
  lastLocked = locked;
  const screen = screens[id];
  const main = document.getElementById("main");
  let node;
  try {
    node = screen.render({ go });
  } catch (error) {
    console.error(error);
    node = fallbackScreen();
  }
  if (locked) lockView(node, id, st);
  if (currentNode && typeof currentNode._dispose === "function") currentNode._dispose();
  currentNode = node;
  main.replaceChildren(node, ...(AUTH_IDS.includes(id) ? [] : [riskBox()]));
  document.title = screen.title ? `${screen.title} | Forge` : "Forge";
  setCurrent(screen.stage || null);
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

export function refreshRoute() {
  show();
}

export function startRouter() {
  window.addEventListener("hashchange", show);
  // If the Forge team changes something that closes the page you are on (a document needs checking again), step back.
  subscribe((st) => {
    const id = idFromHash();
    if (CONFIG.live && screens[id] && !AUTH_IDS.includes(id) && !canFill(id, st) !== lastLocked) show();
  });
  show();
}
