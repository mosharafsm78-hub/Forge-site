// The public face of Forge: a small multi-page site on hash routes.
import { h } from "../ui.js?v=1791345761";
import { PAGES } from "./pages.js?v=1791345761";

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
  const menu = h("details", { class: "nav__menu" }, h("summary", { class: "btn btn--small" }, "Menu"), h("div", { class: "nav__panel" }, links, LOGIN ? h("a", { class: "nav__link", href: LOGIN }, "Log in") : null, h("a", { class: "btn btn--primary", href: WORKSPACE }, "Join Now")));
  return h("header", { class: "top" }, h("div", { class: "wrap top__in" },
    h("a", { class: "word", href: "#/" }, "Forge"),
    h("nav", { class: "nav", "aria-label": "Main" }, links),
    LOGIN ? h("a", { class: "nav__link top__login", href: LOGIN }, "Log in") : null,
    h("a", { class: "btn btn--primary top__cta", href: WORKSPACE }, "Join Now"),
    h("a", { class: "btn btn--primary btn--small top__join", href: WORKSPACE }, "Join Now"),
    menu));
}

const DEMO = (typeof WORKSPACE === "string" ? WORKSPACE.split("#")[0] : "workspace.html") + "?demo#/welcome";
function footer() {
  return h("footer", { class: "foot" }, h("div", { class: "wrap" },
    h("div", { class: "foot__grid" },
      h("div", { class: "foot__brand" }, h("a", { class: "word", href: "#/" }, "Forge"),
        h("p", null, "You make the decisions. Forge handles the hassle. Forge takes the work out of starting an import business in Bangladesh.")),
      h("nav", { "aria-label": "Explore" }, h("h2", { class: "foot__h" }, "Explore"), h("ul", null, NAV.map(([id, label]) => h("li", null, h("a", { href: "#/" + id }, label))))),
      h("nav", { "aria-label": "Your account" }, h("h2", { class: "foot__h" }, "Your account"), h("ul", null,
        h("li", null, h("a", { href: WORKSPACE }, "Join Now")),
        LOGIN ? h("li", null, h("a", { href: LOGIN }, "Log in")) : null,
        h("li", null, h("a", { href: DEMO }, "Try the demo"))))),
    h("p", { class: "foot__risk" }, "Forge can make mistakes, and a business can lose money. Forge does not promise sales or profit. Costs and bills shown on this site are examples."),
    h("p", { class: "foot__copy" }, "\u00a9 " + new Date().getFullYear() + " Forge. Chattogram, Bangladesh.")));
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
