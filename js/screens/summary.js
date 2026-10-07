import { h, formatUsd, formatBdt, usdToBdt } from "../ui.js?v=1791376988";
import { getState, reset } from "../store.js?v=1791376988";
import { industryById } from "../data/industries.js?v=1791376988";
import { head, foot } from "./common.js?v=1791376988";
import { addWorkingDays, formatDay } from "../time.js?v=1791376988";

export default {
  id: "summary",
  stage: null,
  title: "Your file so far",
  render({ go }) {
    const st = getState();
    const industry = industryById(st.industryId);
    const p = st.product;
    const rate = st.fx ? st.fx.rate : null;
    const lineUsd = p ? p.priceUsd * st.qty : 0;
    const bdt = usdToBdt(lineUsd, rate);

    const row = (key, value, stage, extra) =>
      h("div", { class: "file__row" }, h("span", { class: "file__key" }, key), h("span", { class: "file__val" }, value, extra || null), h("a", { class: "btn btn--small btn--quiet", href: "#/" + stage, "aria-label": "Change " + key.toLowerCase() }, "Change"));

    const confirm = h("div", { class: "notice notice--warn", hidden: true }, h("p", null, "This clears everything you entered on this device."), h("div", { style: "display:flex;gap:8px" }, h("button", { type: "button", class: "btn", onclick: () => { reset(); go("welcome"); } }, "Yes, start over"), h("button", { type: "button", class: "btn btn--quiet", onclick: () => (confirm.hidden = true) }, "Keep my file")));

    return h(
      "section",
      { class: "screen" },
      head("Your file so far", "Check your choices. You can change any of them before the next stage."),
      h(
        "div",
        { class: "file" },
        row("Name", st.profile.fullName, "profile", h("span", { class: "field__help" }, [st.profile.district, st.profile.phone].filter(Boolean).join(", "))),
        row("Industry", industry ? industry.name : ""),
        row("Product", p ? p.name : "", "product", p ? h("span", { class: "field__help num" }, `${st.qty} units at ${formatUsd(p.priceUsd)}${bdt !== null ? ", about " + formatBdt(bdt) : ""}`) : null),
        row("Business name", st.name.chosen.trim(), "name"),
        row("Domain", st.domain ? st.domain.name : "", "domain", st.domain && st.domain.status === "requested" ? h("span", { class: "field__help" }, "Forge will check this domain for you.") : null),
        row("Logo", st.brand.logo.chosenId ? "Chosen" : "", "brand"),
        row("Facebook page", st.brand.page.pageName, "brand", h("span", { class: "field__help" }, st.brand.page.url)),
        row("Packaging", "Quote requested", "packaging", h("span", { class: "field__help" }, "Quote due " + formatDay(addWorkingDays(st.packaging.requestedAt, 3)))),
        row("Documents", "NID, agreement and payout details added", "documents")
      ),
      h(
        "div",
        { class: "section", style: "margin-top:28px" },
        h("div", { class: "section__head" }, h("h2", null, "Next: billing"), h("p", null, "You pay for your goods, domain, website and packaging in full. Your bill is final when the packaging quote is ready and the website fee is confirmed.")),
        h("div", null, h("button", { type: "button", class: "btn btn--primary", onclick: () => go("billing") }, "Continue to billing"))
      ),
      foot({ back: "domain", next: h("button", { type: "button", class: "btn btn--quiet", onclick: () => (confirm.hidden = false) }, "Start over") }),
      confirm
    );
  },
};
