import { h, formatUsd, formatBdt, usdToBdt, announce } from "../ui.js?v=1791376988";
import { getState, update, subscribe } from "../store.js?v=1791376988";
import { slugify, normalizeDomain, isValidDomain, nextToDo } from "../rules.js?v=1791376988";
import { checkDomains } from "../api.js?v=1791376988";
import { head, textField, foot } from "./common.js?v=1791376988";

const TLDS = ["com", "shop", "store", "net", "co"];

function priceText(amount, currency, rate) {
  if (!(Number(amount) > 0)) return "";
  if (currency === "USD") {
    const bdt = usdToBdt(Number(amount), rate);
    return bdt === null ? formatUsd(Number(amount)) : formatBdt(bdt);
  }
  return `${amount} ${currency}`;
}

export default {
  id: "domain",
  stage: "domain",
  title: "Domain",
  render({ go }) {
    const st = getState();
    const slug = slugify(st.name.chosen);
    const rate = () => (getState().fx ? getState().fx.rate : null);

    // Candidates come from the business name. Manual ones are added at the top.
    const candidates = slug ? [...TLDS.map((t) => `${slug}.${t}`), `${slug}bd.com`] : [];
    let order = [...candidates];
    const results = new Map(); // domain -> result from the service
    let loading = false;
    let failure = "";
    let lastRate = rate();

    const list = h("div", { "aria-live": "polite" });
    const nextBtn = h("button", { type: "button", class: "btn btn--primary", onclick: () => go(nextToDo("domain", getState()) || "summary") }, "Continue");

    function pill(result) {
      if (!result) return h("span", { class: "pill pill--warn" }, loading ? "Checking" : "Not checked");
      if (result.status === "available") return h("span", { class: "pill pill--ok" }, "Available");
      if (result.status === "taken") return h("span", { class: "pill pill--no" }, "Taken");
      if (result.status === "unsupported") return h("span", { class: "pill pill--warn" }, "Not sold here yet");
      return h("span", { class: "pill pill--warn" }, "Not checked");
    }

    function choose(domain, result) {
      update((s) => {
        s.domain =
          result && result.status === "available"
            ? { name: domain, status: "available", priceAmount: Number(result.priceAmount) || 0, priceCurrency: result.priceCurrency || "USD", renewalPrice: result.renewalPrice ?? null }
            : { name: domain, status: "requested" };
      });
      nextBtn.disabled = false;
      renderList();
      announce(`${domain} chosen.`);
    }

    function row(domain) {
      const result = results.get(domain);
      const chosen = getState().domain && getState().domain.name === domain;
      let price = null;
      if (result && result.status === "available") {
        const now = priceText(result.priceAmount, result.priceCurrency, rate());
        const renew = priceText(result.renewalPrice, result.priceCurrency, rate());
        price = h("div", { class: "domain__price num" }, now ? now + " a year" : "", renew ? h("small", null, "Renews at " + renew) : null);
      } else {
        price = h("div", { class: "domain__price" });
      }
      let action;
      if (chosen) action = h("span", { class: "pill pill--ok" }, "Chosen");
      else if (result && result.status === "available") action = h("button", { type: "button", class: "btn btn--small", onclick: () => choose(domain, result) }, "Choose");
      else if (!loading && (!result || result.status === "unsupported" || result.status === "unknown" || result.status === "setup_required")) action = h("button", { type: "button", class: "btn btn--small", onclick: () => choose(domain, null) }, "Ask Forge to check");
      else action = null;
      return h("div", { class: "domain" + (chosen ? " is-selected" : "") }, h("span", { class: "domain__name" }, domain), pill(result), price, h("div", { class: "domain__action" }, action));
    }

    function renderList() {
      list.replaceChildren();
      if (!order.length) {
        list.append(h("div", { class: "notice notice--info" }, h("b", null, "Your business name has no English letters, so there are no domain ideas yet."), h("p", null, "Type the domain you want in the box above.")));
        return;
      }
      const current = getState().domain;
      if (failure) {
        list.append(
          h("div", { class: "notice notice--error", style: "margin-bottom:12px" }, h("b", null, "Domains could not be checked."), h("p", null, failure), h("p", null, "You can retry, or ask Forge to check a domain for you."), h("button", { type: "button", class: "btn", onclick: () => run(order) }, "Try again"))
        );
      } else if (results.size && [...results.values()].every((r) => r.status === "setup_required")) {
        list.append(h("div", { class: "notice notice--info", style: "margin-bottom:12px" }, h("b", null, "Live domain search is not connected yet."), h("p", null, "Ask Forge to check the domain you want.")));
      }
      const extra = current && !order.includes(current.name) ? [current.name] : [];
      list.append(h("div", { class: "domain-list", role: "list" }, [...extra, ...order].map((d) => h("div", { role: "listitem", style: "display:contents" }, row(d)))));
    }

    async function run(domains) {
      loading = true;
      failure = "";
      renderList();
      try {
        const r = await checkDomains(domains);
        for (const item of r.results) results.set(String(item.domain).toLowerCase(), item);
      } catch (e) {
        failure = e.message || "The domain service could not be reached.";
      }
      loading = false;
      renderList();
    }

    // ---------- manual check ----------
    const manual = textField({
      id: "f-domain-manual",
      label: "Try another domain",
      help: "For example mybusiness.com",
      full: true,
      onInput: () => manual.setError(""),
    });
    const addManual = () => {
      const value = normalizeDomain(manual.input.value);
      if (!isValidDomain(value)) {
        manual.setError("Enter a full domain name, like mybusiness.com.");
        manual.focus();
        return;
      }
      manual.setError("");
      order = [value, ...order.filter((d) => d !== value)];
      manual.input.value = "";
      run([value]);
    };
    manual.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addManual();
      }
    });

    const root = h(
      "section",
      { class: "screen screen--wide" },
      head("Choose a domain", "This is your business's web address. Forge registers the one you choose and connects it to your website."),
      h("div", { class: "section", style: "max-width:560px" }, h("div", { style: "display:flex;gap:8px;align-items:end;flex-wrap:wrap" }, h("div", { style: "flex:1 1 260px" }, manual.el), h("button", { type: "button", class: "btn", onclick: addManual }, "Check"))),
      list,
      foot({ back: "packaging", next: nextBtn, note: "Domain prices are for the first year. Renewal is billed yearly." })
    );

    root._dispose = subscribe(() => {
      const r = rate();
      if (r !== lastRate) {
        lastRate = r;
        renderList();
      }
    });

    nextBtn.disabled = !(st.domain && st.domain.name);
    renderList();
    if (order.length) run(order);
    return root;
  },
};
