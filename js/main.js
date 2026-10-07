import { mountChrome } from "./chrome.js?v=1791376988";
import { startRouter, refreshRoute } from "./router.js?v=1791376988";
import { getFxRate } from "./api.js?v=1791376988";
import { FALLBACK_RATE } from "./budget.js?v=1791376988";
import { setFx, attach, detach, applyServer, currentUser, update, getState } from "./store.js?v=1791376988";
import { CONFIG } from "./config.js?v=1791376988";
import { loadBackend } from "./backend.js?v=1791376988";
import { setAuthNotice } from "./screens/auth.js?v=1791376988";
import { h } from "./ui.js?v=1791376988";

async function loadRate() {
  // Show taka at once with a clearly labelled planning rate, then replace it with today's rate.
  if (!getState().fx) setFx({ rate: FALLBACK_RATE, fetchedAt: "", source: "estimate" });
  for (let i = 0; i < 3; i += 1) {
    try {
      const fx = await getFxRate();
      setFx({ rate: fx.rate, fetchedAt: fx.fetchedAt, source: fx.source });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

mountChrome(document.getElementById("app"));
const main = document.getElementById("main");

function problem(text) {
  main.replaceChildren(h("section", { class: "screen auth" }, h("div", { class: "auth__card" },
    h("h1", null, "Could not open your file"),
    h("div", { class: "notice notice--error" }, h("p", null, text)),
    h("button", { type: "button", class: "btn btn--primary", onclick: () => window.location.reload() }, "Try again"))));
}

if (!CONFIG.live) {
  startRouter();
  loadRate();
} else {
  boot().catch((e) => {
    console.error(e);
    problem("Forge could not be reached. Check your internet connection and try again. Nothing you entered has been lost.");
  });
}

let unwatch = null;
let attaching = null;

async function ensureAttached(backend, user) {
  const cur = currentUser();
  if (cur && cur.id === user.id) return;
  if (attaching && attaching.id === user.id) return attaching.p;
  const p = (async () => {
    await attach(backend, user);
    if (unwatch) unwatch();
    unwatch = backend.watchFile(user.id, applyServer);
    // First visit: the account email is the best starting answer for the details page.
    if (!getState().profile.email) update((s) => { s.profile.email = user.email; });
  })();
  attaching = { id: user.id, p };
  try { await p; } finally { attaching = null; }
}

async function boot() {
  main.replaceChildren(h("p", { class: "muted", style: "padding:32px" }, "Opening Forge..."));
  const backend = await loadBackend();
  const linkError = backend.takeLinkError();
  if (linkError) setAuthNotice(linkError);
  let started = false;
  backend.onAuth(async (event, user) => {
    try {
      if (user) {
        await ensureAttached(backend, user);
        if (event === "PASSWORD_RECOVERY") window.location.hash = "#/reset";
        else if (started) refreshRoute();
      } else if (event === "SIGNED_OUT") {
        const was = currentUser();
        if (unwatch) { unwatch(); unwatch = null; }
        detach();
        if (was) setAuthNotice("You are signed out.");
        if (window.location.hash === "#/login") { if (started) refreshRoute(); } else window.location.hash = "#/login";
      }
    } catch (e) {
      console.error(e);
      problem("Your file could not be loaded. Try again in a moment.");
    }
  });
  const user = await backend.init();
  if (user) await ensureAttached(backend, user);
  started = true;
  startRouter();
  loadRate();
}
