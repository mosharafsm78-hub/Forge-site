// Join, log in, forgot and reset password, and the "check your email" page.
// These pages stand alone: no stage list and no order sheet.
import { h, announce } from "../ui.js";
import { CONFIG } from "../config.js";
import { EMAIL_RE } from "../rules.js";
import { loadBackend } from "../backend.js";
import { textField } from "./common.js";

export const AUTH_IDS = ["login", "signup", "forgot", "confirm", "reset"];
export const OPEN_AUTH_IDS = ["login", "signup", "forgot", "confirm"];

const MIN = 8;
let pendingEmail = ""; // carried from "join" to "check your email"
let notice = ""; // a message to show once on the log-in page (link errors, password changed)
export const setAuthNotice = (m) => { notice = m; };

function passwordField({ id, label, help, autocomplete }) {
  const f = textField({ id, label, help, type: "password", autocomplete, full: true });
  const toggle = h("button", { type: "button", class: "btn btn--small btn--quiet pw-toggle", "aria-pressed": "false", onclick: () => {
    const show = f.input.type === "password";
    f.input.type = show ? "text" : "password";
    toggle.textContent = show ? "Hide" : "Show";
    toggle.setAttribute("aria-pressed", String(show));
  } }, "Show");
  f.el.append(toggle);
  return f;
}

function card(title, lede, ...kids) {
  return h("section", { class: "screen auth" }, h("div", { class: "auth__card" },
    h("a", { class: "auth__word", href: (typeof window !== "undefined" && window.__SITE_URL__) || "index.html" }, "Forge"),
    h("h1", null, title), lede ? h("p", { class: "screen__lede" }, lede) : null, ...kids));
}

function form(fields, submitLabel, run) {
  const error = h("p", { class: "field__error", role: "alert", hidden: true });
  const btn = h("button", { type: "submit", class: "btn btn--primary auth__submit" }, submitLabel);
  const el = h("form", { novalidate: true, class: "auth__form", onsubmit: async (e) => {
    e.preventDefault();
    error.hidden = true;
    btn.disabled = true;
    btn.textContent = "One moment...";
    try { await run(); } catch (err) {
      error.textContent = err.message || "Something went wrong. Try again.";
      error.hidden = false;
      announce(error.textContent);
    }
    btn.disabled = false;
    btn.textContent = submitLabel;
  } }, ...fields.map((f) => f.el), error, btn);
  return { el, error };
}

function checks(email, pw) {
  let bad = false;
  if (email) {
    const m = EMAIL_RE.test(email.input.value.trim()) ? "" : "Enter a valid email address.";
    email.setError(m); if (m) bad = true;
  }
  if (pw) {
    const m = pw.input.value.length >= MIN ? "" : `Use at least ${MIN} characters.`;
    pw.setError(m); if (m) bad = true;
  }
  return bad;
}

const login = {
  id: "login", stage: null, title: "Log in",
  render({ go }) {
    const email = textField({ id: "a-email", label: "Email", type: "email", autocomplete: "email", inputmode: "email", full: true });
    const pw = passwordField({ id: "a-pw", label: "Password", autocomplete: "current-password" });
    const msg = notice; notice = "";
    const f = form([email, pw], "Log in", async () => {
      if (!email.input.value.trim() || !pw.input.value) throw new Error("Enter your email and password.");
      const b = await loadBackend();
      await b.signIn(email.input.value.trim().toLowerCase(), pw.input.value);
      // The page changes when the sign-in event arrives.
    });
    return card("Log in", "Pick up your business file where you left it.",
      msg ? h("div", { class: "notice", role: "status" }, h("p", null, msg)) : null, f.el,
      h("p", { class: "auth__alt" }, h("a", { href: "#/forgot" }, "Forgot your password?")),
      h("p", { class: "auth__alt" }, "New to Forge? ", h("a", { href: "#/signup" }, "Join now")));
  },
};

const signup = {
  id: "signup", stage: null, title: "Join Forge",
  render({ go }) {
    const email = textField({ id: "a-email", label: "Email", type: "email", autocomplete: "email", inputmode: "email", full: true, help: "We send a link to this address to confirm it is yours." });
    const pw = passwordField({ id: "a-pw", label: "Choose a password", autocomplete: "new-password", help: `At least ${MIN} characters.` });
    const f = form([email, pw], "Join Now", async () => {
      if (checks(email, pw)) throw new Error("Fix the highlighted fields.");
      const b = await loadBackend();
      const addr = email.input.value.trim().toLowerCase();
      const r = await b.signUp(addr, pw.input.value);
      if (r.needsConfirm) { pendingEmail = addr; go("confirm"); }
    });
    return card("Start your business file", "One account holds everything: your answers, your documents, your bills.", f.el,
      h("p", { class: "auth__fine" }, "Forge keeps what you enter here and the documents you upload, and shows them only to you and the Forge staff who work on your file. Forge can make mistakes and a business can lose money. Forge does not promise sales or profit."),
      h("p", { class: "auth__alt" }, "Already have an account? ", h("a", { href: "#/login" }, "Log in")));
  },
};

const confirm = {
  id: "confirm", stage: null, title: "Check your email",
  render({ go }) {
    return card("Check your email", null,
      h("div", { class: "notice notice--ok", role: "status" }, h("p", null, "We sent a link to ", h("b", null, pendingEmail || "your email address"), ". Open it to confirm your account, then log in.")),
      h("p", { class: "field__help" }, "No email after a few minutes? Look in your spam folder. The link works once."),
      h("p", { class: "auth__alt" }, h("a", { href: "#/login" }, "Back to log in")));
  },
};

const forgot = {
  id: "forgot", stage: null, title: "Reset your password",
  render() {
    const email = textField({ id: "a-email", label: "Email", type: "email", autocomplete: "email", inputmode: "email", full: true });
    const done = h("div", { class: "notice notice--ok", role: "status", hidden: true }, h("p", null, "If an account exists for this address, a reset link is on its way. It can take a few minutes."));
    const f = form([email], "Send reset link", async () => {
      if (checks(email, null)) throw new Error("Enter a valid email address.");
      const b = await loadBackend();
      await b.sendReset(email.input.value.trim().toLowerCase());
      done.hidden = false;
    });
    return card("Reset your password", "Enter your email and we will send you a link to choose a new one.", f.el, done,
      h("p", { class: "auth__alt" }, h("a", { href: "#/login" }, "Back to log in")));
  },
};

const reset = {
  id: "reset", stage: null, title: "Choose a new password",
  render({ go }) {
    const pw = passwordField({ id: "a-pw", label: "New password", autocomplete: "new-password", help: `At least ${MIN} characters.` });
    const f = form([pw], "Save password", async () => {
      if (checks(null, pw)) throw new Error(`Use at least ${MIN} characters.`);
      const b = await loadBackend();
      await b.updatePassword(pw.input.value);
      announce("Password changed.");
      go("welcome");
    });
    return card("Choose a new password", null, f.el);
  },
};

export default { login, signup, confirm, forgot, reset };
