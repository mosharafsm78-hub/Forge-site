// The frame around every screen: top bar, stage list, order sheet.
import { h } from "./ui.js";
import { CONFIG } from "./config.js";
import { STAGES, stageNumber } from "./stages.js";
import { getState, subscribe, isSaved, saveStatus, currentUser, saveNow } from "./store.js";
import { loadBackend } from "./backend.js";
import { canOpen, stageStatus } from "./rules.js";
import { renderSheet } from "./sheet.js";

let currentId = null;
let railOpen = false;
let sheetOpen = false;
let els = {};

const CHECK =
  '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function checkIcon() {
  const span = document.createElement("span");
  span.innerHTML = CHECK; // fixed internal markup, no outside data
  return span.firstChild;
}

export function mountChrome(root) {
  els.live = h("div", { id: "live", class: "sr-only", "aria-live": "polite" });
  els.save = h("span", { class: "topbar__save", "data-state": "saved" });
  els.account = h("span", { class: "topbar__account" });
  els.stepBtn = h("button", { type: "button", class: "btn btn--small topbar__steps", "aria-expanded": "false", "aria-controls": "rail", onclick: () => toggleRail() });
  els.top = h(
    "header",
    { class: "topbar" },
    h("a", { class: "brand", href: "#/" }, h("span", { class: "brand__word" }, "Forge"), h("span", { class: "brand__sub" }, "Owner workspace")),
    h("span", { class: "topbar__spacer" }),
    h("a", { class: "btn btn--small btn--quiet topbar__site", href: (typeof window !== "undefined" && window.__SITE_URL__) || "index.html" }, h("span", { class: "long" }, "Back to Forge website"), h("span", { class: "short" }, "Website")),
    els.save,
    els.account,
    h("a", { class: "btn btn--small btn--quiet topbar__pause", href: "#/pause" }, h("span", { class: "long" }, "Pause or exit"), h("span", { class: "short" }, "Pause")),
    els.stepBtn
  );
  els.rail = h("nav", { class: "rail", id: "rail", "aria-label": "Stages of your business file" });
  els.main = h("main", { class: "main", id: "main", tabindex: "-1" });
  els.sheet = h("aside", { class: "sheet", id: "sheet", "aria-label": "Order sheet" });

  const shell = h("div", { class: "shell" }, els.top, els.rail, els.main, els.sheet);
  root.replaceChildren(
    CONFIG.demo
      ? h("div", { class: "demo-banner", role: "note" }, "Preview with sample data. Live products, prices and domains appear when the site is connected to the supplier and domain services.")
      : null,
    shell,
    els.live
  );
  subscribe(refreshChrome);
  window.addEventListener("hashchange", () => {
    railOpen = false;
    renderRail();
  });
  refreshChrome();
}

export function setCurrent(id) {
  currentId = id;
  refreshChrome();
}

function toggleRail() {
  railOpen = !railOpen;
  renderRail();
  renderTop();
}

function renderTop() {
  const saved = isSaved();
  const user = currentUser();
  if (CONFIG.live) {
    const s = saveStatus();
    els.save.dataset.state = s === "error" ? "unsaved" : "saved";
    els.save.textContent = !user ? "" : s === "saving" ? "Saving..." : s === "error" ? "Could not save. Trying again..." : "Saved to your account";
    els.account.replaceChildren(...(user ? [h("span", { class: "topbar__email" }, user.email), h("button", { type: "button", class: "btn btn--small btn--quiet", onclick: async () => { await saveNow(); (await loadBackend()).signOut(); } }, "Log out")] : []));
  } else {
    els.save.dataset.state = saved ? "saved" : "unsaved";
    els.save.textContent = saved ? "Saved on this device" : "Not saved: this browser blocks storage";
  }
  const n = stageNumber(currentId);
  const stage = STAGES.find((s) => s.id === currentId);
  els.stepBtn.replaceChildren(...(stage ? [h("span", { class: "long" }, `Step ${n} of ${STAGES.length}: ${stage.label}`), h("span", { class: "short" }, `Step ${n} of ${STAGES.length}`)] : ["All steps"]));
  els.stepBtn.setAttribute("aria-expanded", railOpen ? "true" : "false");
}

function renderRail() {
  const st = getState();
  const items = STAGES.map((stage, index) => {
    const status = stageStatus(stage.id, st);
    const done = status.state === "done";
    const open = stage.built && canOpen(stage.id, st);
    const classes = ["rail__item", done ? "is-done" : "", stage.id === currentId ? "is-current" : "", "is-" + status.state].filter(Boolean).join(" ");
    const marker = h("span", { class: "rail__marker", "aria-hidden": "true" }, done ? checkIcon() : String(index + 1));
    let who = status.text;
    if (status.state === "open" && stage.wait) who = (stage.who === "team" ? "Forge team, " : "") + stage.wait.charAt(0).toLowerCase() + stage.wait.slice(1);
    const text = h(
      "span",
      null,
      h("span", null, stage.label),
      h("span", { class: "rail__who" + (stage.who === "team" && status.state === "open" ? " rail__who--team" : "") + (status.state === "waiting" ? " rail__who--wait" : "") }, who)
    );
    const inner = open
      ? h("a", { class: "rail__link", href: "#/" + stage.id, "aria-current": stage.id === currentId ? "step" : null }, marker, text)
      : h("span", { class: "rail__static" }, marker, text);
    return h("li", { class: classes }, inner);
  });
  els.rail.className = "rail" + (railOpen ? " rail--open" : "");
  els.rail.replaceChildren(
    h("p", { class: "rail__title" }, "Your business file"),
    h("p", { class: "rail__lede" }, "Nothing starts until your documents and signed agreement are in. After that, the logo and page, packaging and domain run side by side. Ask for the packaging quote first: it takes the longest."),
    h("ol", { class: "rail__list" }, items)
  );
}

function renderSheetEl() {
  els.sheet.className = "sheet" + (sheetOpen ? " sheet--open" : "");
  els.sheet.replaceChildren(
    renderSheet(sheetOpen, () => {
      sheetOpen = !sheetOpen;
      renderSheetEl();
    })
  );
}

export function refreshChrome() {
  if (!els.rail) return;
  renderRail();
  renderSheetEl();
  renderTop();
}
