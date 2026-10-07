// Hash routes: #/profile, #/industry, and so on. A stage only opens when the ones before it are complete.
import { h } from "./ui.js";
import { getState, currentUser, subscribe } from "./store.js";
import { CONFIG } from "./config.js";
import auth, { AUTH_IDS, OPEN_AUTH_IDS } from "./screens/auth.js";
import { canOpen, firstOpenStage } from "./rules.js";
import { setCurrent } from "./chrome.js";
import welcome from "./screens/welcome.js";
import profile from "./screens/profile.js";
import industry from "./screens/industry.js";
import product from "./screens/product.js";
import name from "./screens/name.js";
import domain from "./screens/domain.js";
import brand from "./screens/brand.js";
import packaging from "./screens/packaging.js";
import documents from "./screens/documents.js";
import billing from "./screens/billing.js";
import plan from "./screens/plan.js";
import freight from "./screens/freight.js";
import marketing from "./screens/marketing.js";
import orders from "./screens/orders.js";
import returns from "./screens/returns.js";
import reorder from "./screens/reorder.js";
import pause from "./screens/pause.js";
import summary from "./screens/summary.js";

const screens = { welcome, profile, industry, product, name, brand, packaging, domain, documents, summary, billing, plan, freight, marketing, orders, returns, reorder, pause, ...auth };

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
  if (!AUTH_IDS.includes(id) && !canOpen(id, st)) {
    const target = firstOpenStage(st);
    if (target !== id) {
      window.location.replace("#/" + target);
      return;
    }
  }
  const screen = screens[id];
  const main = document.getElementById("main");
  let node;
  try {
    node = screen.render({ go });
  } catch (error) {
    console.error(error);
    node = fallbackScreen();
  }
  if (currentNode && typeof currentNode._dispose === "function") currentNode._dispose();
  currentNode = node;
  main.replaceChildren(node);
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
    if (CONFIG.live && screens[id] && !AUTH_IDS.includes(id) && !canOpen(id, st)) show();
  });
  show();
}
