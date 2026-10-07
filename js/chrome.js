// The frame around every screen: top bar, stage list, order sheet.
import { h } from "./ui.js?v=1791340075";
import { CONFIG } from "./config.js?v=1791340075";
import { STAGES, PHASES, stageNumber } from "./stages.js?v=1791340075";
import { getState, subscribe, isSaved, saveStatus, currentUser, saveNow, testMode, resetTestFile } from "./store.js?v=1791340075";
import { loadBackend } from "./backend.js?v=1791340075";
import { canOpen, stageStatus } from "./rules.js?v=1791340075";
import { renderSheet } from "./sheet.js?v=1791340075";

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
    h("a", { class: "btn btn--small btn--quiet topbar__acct", href: "#/accounting" }, "Accounting"),
    h("a", { class: "btn btn--small btn--quiet topbar__pause", href: "#/pause" }, h("span", { class: "long" }, "Pause or exit"), h("span", { class: "short" }, "Pause")),
    els.stepBtn
  );
  els.rail = h("nav", { class: "rail", id: "rail", "aria-label": "Stages of your business file" });
  els.main = h("main", { class: "main", id: "main", tabindex: "-1" });
  els.sheet = h("aside", { class: "sheet", id: "sheet", "aria-label": "Order sheet" });

  els.testbar = h("div", { class: "testbar", role: "note", hidden: true });
  const shell = h("div", { class: "shell" }, els.top, els.rail, els.main, els.sheet);
  root.replaceChildren(
    ...(CONFIG.demo
      ? [h("div", { class: "demo-banner", role: "note" }, "Demo: sample data and pretend payments. Nothing here is real and nothing is saved to an account. Use the \"Demo\" buttons to play Forge's side, such as confirming a payment.")]
      : []),
    els.testbar,
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
  const phase = currentPhase();
  const pn = phase ? PHASES.indexOf(phase) + 1 : 0;
  els.stepBtn.replaceChildren(...(stage ? [h("span", { class: "long" }, `Part ${pn} of ${PHASES.length}: ${phase.label}. Step ${n} of ${STAGES.length}`), h("span", { class: "short" }, `Step ${n} of ${STAGES.length}`)] : ["All steps"]));
  els.stepBtn.setAttribute("aria-expanded", railOpen ? "true" : "false");
}

function railItem(stage, st) {
  const index = STAGES.indexOf(stage);
  const status = stageStatus(stage.id, st);
  const done = status.state === "done";
  const open = stage.built && canOpen(stage.id, st);
  const classes = ["rail__item", done ? "is-done" : "", stage.id === currentId ? "is-current" : "", "is-" + status.state].filter(Boolean).join(" ");
  const marker = h("span", { class: "rail__marker", "aria-hidden": "true" }, done ? checkIcon() : String(index + 1));
  let who = status.text;
  if (status.state === "open" && stage.wait) who = stage.wait;
  const text = h(
    "span",
    null,
    h("span", null, stage.label),
    h("span", { class: "rail__who" + (stage.who === "forge" && status.state === "open" ? " rail__who--forge" : "") + (status.state === "waiting" ? " rail__who--wait" : "") }, who)
  );
  const inner = open
    ? h("a", { class: "rail__link", href: "#/" + stage.id, "aria-current": stage.id === currentId ? "step" : null }, marker, text)
    : h("span", { class: "rail__static" }, marker, text);
  return h("li", { class: classes }, inner);
}

function currentPhase() {
  const stage = STAGES.find((s) => s.id === currentId);
  return stage ? PHASES.find((p) => p.id === stage.phase) : null;
}

function renderRail() {
  const st = getState();
  const groups = PHASES.map((phase, i) => {
    const list = STAGES.filter((s) => s.phase === phase.id);
    const doneCount = list.filter((s) => stageStatus(s.id, st).state === "done").length;
    const active = currentPhase() === phase;
    return h(
      "section",
      { class: "rail__phase" + (active ? " is-active" : "") + (doneCount === list.length ? " is-done" : "") },
      h(
        "h3",
        { class: "rail__phasehead" },
        h("span", null, `${i + 1}. ${phase.label}`),
        h("span", { class: "rail__count" }, `${doneCount} of ${list.length} done`)
      ),
      h("p", { class: "rail__phaselede" }, phase.lede),
      h("ol", { class: "rail__list" }, list.map((stage) => railItem(stage, st)))
    );
  });
  els.rail.className = "rail" + (railOpen ? " rail--open" : "");
  els.rail.replaceChildren(
    h("p", { class: "rail__title" }, "Your business file"),
    h("p", { class: "rail__lede" }, "Four parts, in order. Nothing starts until your documents and signed agreement are in. Ask for the packaging quote first: it takes the longest."),
    ...groups
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

let confirmReset = false;
function renderTestbar() {
  const on = testMode() && !CONFIG.demo && Boolean(currentUser());
  els.testbar.hidden = !on;
  if (!on) return;
  els.testbar.replaceChildren(
    h("span", null, h("b", null, "Test account. "), "Buttons marked Demo play Forge's side on your real file, so each step changes the next pages."),
    h(
      "button",
      {
        type: "button",
        class: "btn btn--small",
        onclick: async () => {
          if (!confirmReset) { confirmReset = true; renderTestbar(); return; }
          confirmReset = false;
          await resetTestFile();
          window.location.hash = "#/welcome";
        },
      },
      confirmReset ? "Tap again to wipe this file" : "Reset my test file"
    )
  );
}

export function refreshChrome() {
  if (!els.rail) return;
  renderTestbar();
  renderRail();
  renderSheetEl();
  renderTop();
}
