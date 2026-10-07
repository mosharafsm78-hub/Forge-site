// The public face of Forge: a small multi-page site on hash routes.
import { h } from "../ui.js";
import { PAGES } from "./pages.js";

const WORKSPACE = (typeof window !== "undefined" && (window.__WORKSPACE_START__ || window.__WORKSPACE_URL__)) || "workspace.html#/signup";
// Set only on the live site, where people have accounts.
const LOGIN = (typeof window !== "undefined" && window.__WORKSPACE_LOGIN__) || "";
const NAV = [
  ["how", "How it works"],
  ["costs", "What you pay"],
  ["risk", "Before you start"],
  ["faq", "Questions"],
];

function idFromHash() {
  const m = window.location.hash.match(/^#\/([a-z]+)/);
  return m && PAGES[m[1]] ? m[1] : "home";
}

function header(current) {
  const links = NAV.map(([id, label]) => h("a", { href: "#/" + id, class: "nav__link", "aria-current": current === id ? "page" : null }, label));
  const menu = h("details", { class: "nav__menu" }, h("summary", { class: "btn btn--small" }, "Menu"), h("div", { class: "nav__panel" }, links, LOGIN ? h("a", { class: "nav__link", href: LOGIN }, "Log in") : null, h("a", { class: "btn btn--primary", href: WORKSPACE }, "Start your business file")));
  return h("header", { class: "top" }, h("div", { class: "wrap top__in" },
    h("a", { class: "word", href: "#/" }, "Forge"),
    h("nav", { class: "nav", "aria-label": "Main" }, links),
    LOGIN ? h("a", { class: "nav__link top__login", href: LOGIN }, "Log in") : null,
    h("a", { class: "btn btn--primary top__cta", href: WORKSPACE }, "Start your business file"),
    menu));
}

function footer() {
  return h("footer", { class: "foot" }, h("div", { class: "wrap foot__in" },
    h("div", null, h("a", { class: "word", href: "#/" }, "Forge"), h("p", { class: "muted", style: "max-width:44ch;margin-top:8px" }, "Forge blends AI with a real team to take the hassle out of starting an import business in Bangladesh. You decide, we make it happen. Forge can make mistakes and a business can lose money. Forge does not promise sales or profit.")),
    h("nav", { "aria-label": "Footer", class: "foot__links" }, NAV.map(([id, label]) => h("a", { href: "#/" + id }, label)), h("a", { href: WORKSPACE }, "Your business file"))));
}

function show() {
  const id = idFromHash();
  const page = PAGES[id];
  const root = document.getElementById("site");
  const main = h("main", { id: "main", tabindex: "-1" }, page.render({ workspace: WORKSPACE }));
  root.replaceChildren(h("a", { class: "skip", href: "#main", onclick: (e) => { e.preventDefault(); main.focus(); } }, "Skip to content"), header(id), main, footer());
  document.title = id === "home" ? "Forge: start your own business in Bangladesh" : page.title + " | Forge";
  window.scrollTo(0, 0);
  if (id !== "home") main.focus({ preventScroll: true });
}

window.addEventListener("hashchange", show);
show();
