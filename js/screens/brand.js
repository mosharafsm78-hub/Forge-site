import { h, announce, append } from "../ui.js?v=1791339729";
const add = (el, ...kids) => append(el, kids);
import { CONFIG } from "../config.js?v=1791339729";
import { getState, update, testMode, syncStaff } from "../store.js?v=1791339729";
import { validateBusinessName, isComplete, nextToDo } from "../rules.js?v=1791339729";
import { HOUR } from "../time.js?v=1791339729";
import { LOGO_TYPES, LOGO_COLORS, suggestionFor, sampleOptions, logoView } from "../logo.js?v=1791339729";
import { industryById } from "../data/industries.js?v=1791339729";
import { head, textField, textareaField, foot } from "./common.js?v=1791339729";
import { waitPanel } from "./wait.js?v=1791339729";

export default {
  id: "brand",
  stage: "brand",
  title: "Logo and Facebook page",
  render({ go }) {
    const stoppers = [];
    const st0 = getState();
    const businessName = () => getState().name.chosen.trim();

    // Start from the Forge suggestion for this industry. The owner can change it.
    if (!st0.brand.logo.requestedAt && !st0.brand.logo.types.length) {
      update((s) => {
        s.brand.logo.types = suggestionFor(s.industryId);
      });
    }
    if (!st0.brand.page.requestedAt && !st0.brand.page.pageName) {
      update((s) => {
        s.brand.page.pageName = s.name.chosen.trim();
      });
    }

    const logoBox = h("div", { class: "job" });
    const pageBox = h("div", { class: "job" });
    const footSlot = h("div");

    function stopTimers() {
      while (stoppers.length) stoppers.pop()();
    }

    // ---------- logo ----------
    function paintLogo() {
      const { logo } = getState().brand;
      const industry = industryById(getState().industryId);
      logoBox.replaceChildren();
      add(logoBox, h("div", { class: "section__head" }, h("h2", null, "Logo"), h("p", null, "Forge designs your logo. You choose the kind, and then pick from the designs we make.")));

      if (logo.forName && logo.forName !== businessName()) {
        add(logoBox, h("div", { class: "notice notice--warn" }, h("p", null, `These logos were made for "${logo.forName}". Your business name is now "${businessName()}". Check that the logo still fits.`)));
      }

      if (!logo.requestedAt) {
        const suggested = suggestionFor(getState().industryId);
        const typeButtons = LOGO_TYPES.map((t) =>
          h(
            "button",
            {
              type: "button",
              class: "pick",
              "aria-pressed": logo.types.includes(t.id) ? "true" : "false",
              onclick: (e) => {
                update((s) => {
                  const list = s.brand.logo.types;
                  s.brand.logo.types = list.includes(t.id) ? list.filter((x) => x !== t.id) : [...list, t.id];
                });
                e.currentTarget.setAttribute("aria-pressed", getState().brand.logo.types.includes(t.id) ? "true" : "false");
                typeError.hidden = true;
              },
            },
            h("span", { class: "pick__name" }, t.label, suggested.includes(t.id) ? h("span", { class: "pill pill--ok" }, "Suggested") : null),
            h("span", { class: "pick__help" }, t.help)
          )
        );
        const typeError = h("p", { class: "field__error", hidden: true }, "Choose at least one kind of logo, or ask the team to choose for you.");
        const colorButtons = LOGO_COLORS.map((c) =>
          h(
            "button",
            {
              type: "button",
              class: "chip",
              "aria-pressed": (logo.color || "team") === c.id ? "true" : "false",
              onclick: () => {
                update((s) => {
                  s.brand.logo.color = c.id;
                });
                colorButtons.forEach((b, i) => b.setAttribute("aria-pressed", LOGO_COLORS[i].id === c.id ? "true" : "false"));
              },
            },
            c.a ? h("span", { class: "swatch", style: `background:${c.a}` }) : null,
            c.label
          )
        );
        const notes = textareaField({
          id: "f-logo-notes",
          label: "Anything else we should know? (optional)",
          help: "For example, a word or letter to include, or a style you like.",
          value: logo.notes,
          full: true,
          maxlength: 300,
          onInput: (v) => update((s) => { s.brand.logo.notes = v; }),
        });
        add(logoBox, 
          h("div", { class: "field" }, h("p", { class: "field__label" }, "What kind of logo do you want?"), h("p", { class: "field__help" }, industry ? `For ${industry.name.toLowerCase()}, Forge suggests the ones marked. Choose as many as you like.` : "Choose as many as you like."), h("div", { class: "pick-grid" }, typeButtons), typeError),
          h("div", { class: "field" }, h("p", { class: "field__label" }, "Main colour"), h("div", { class: "chips" }, colorButtons)),
          notes.el,
          h(
            "div",
            null,
            h(
              "button",
              {
                type: "button",
                class: "btn btn--primary",
                onclick: () => {
                  const n = validateBusinessName(businessName());
                  if (n) return;
                  if (!getState().brand.logo.types.length) {
                    typeError.hidden = false;
                    return;
                  }
                  update((s) => {
                    s.brand.logo.requestedAt = Date.now();
                    s.brand.logo.forName = s.name.chosen.trim();
                    s.brand.logo.color = s.brand.logo.color || "team";
                  });
                  announce("Logo request sent. Come back in about one hour.");
                  paintAll();
                },
              },
              "Make my logo"
            )
          )
        );
        return;
      }

      if (!logo.options.length) {
        const w = waitPanel({
          title: "Your logo is being made",
          requestedAt: logo.requestedAt,
          durationMs: HOUR,
          lines: ["Come back in about 1 hour. Your request is saved, so you can close this page.", "You will see 6 designs and choose one."],
          lateText: "This is taking a little longer than usual. Forge will contact you if they need anything.",
        });
        stoppers.push(w.stop);
        add(logoBox, w.el);
        if (testMode()) add(logoBox, demoSkip("Demo: skip the wait and show sample logos", () => {
          update((s) => {
            s.brand.logo.options = sampleOptions(s.brand.logo.types, s.brand.logo.color);
            s.brand.logo.deliveredAt = Date.now();
          });
          paintAll();
        }));
        return;
      }

      const grid = h(
        "div",
        { class: "logo-grid", role: "group", "aria-label": "Logo designs" },
        logo.options.map((o) =>
          h(
            "button",
            {
              type: "button",
              class: "logo-card",
              "aria-pressed": logo.chosenId === o.id ? "true" : "false",
              "aria-label": "Choose design " + (logo.options.indexOf(o) + 1),
              onclick: () => {
                update((s) => {
                  s.brand.logo.chosenId = o.id;
                });
                announce("Design " + (logo.options.indexOf(o) + 1) + " chosen.");
                paintLogo();
                paintFoot();
              },
            },
            logoView(o, logo.forName || businessName())
          )
        )
      );
      add(logoBox, 
        h("p", { class: "field__help" }, logo.chosenId ? "Your logo is chosen. You can pick another design if you change your mind." : "Choose the design you like best."),
        grid,
        testMode() ? h("p", { class: "field__help" }, "These are sample designs drawn for the preview. Real designs come from Forge.") : null
      );
    }

    // ---------- Facebook page ----------
    function paintPage() {
      const { page } = getState().brand;
      pageBox.replaceChildren();
      add(pageBox, h("div", { class: "section__head" }, h("h2", null, "Facebook page"), h("p", null, "Forge creates your page and adds you as an admin. Forge keeps admin access too, so it can post and run ads for you.")));

      if (!page.requestedAt) {
        const touched = new Set();
        const pageName = textField({
          id: "f-page-name", label: "Page name", full: true, maxlength: 40, value: page.pageName,
          help: "Usually the same as your business name.",
          onInput: (v) => { update((s) => { s.brand.page.pageName = v; }); if (touched.has("name")) checkName(); },
          onBlur: () => { touched.add("name"); checkName(); },
        });
        const profile = textField({
          id: "f-page-profile", label: "Your Facebook profile", full: true, maxlength: 120, value: page.profile,
          help: "Paste the link to your profile, or write the name on it. We use it to add you as an admin.",
          onInput: (v) => { update((s) => { s.brand.page.profile = v; }); if (touched.has("profile")) checkProfile(); },
          onBlur: () => { touched.add("profile"); checkProfile(); },
        });
        const checkName = () => { const m = validateBusinessName(getState().brand.page.pageName); pageName.setError(touched.has("name") ? m : ""); return m; };
        const checkProfile = () => { const m = getState().brand.page.profile.trim().length < 3 ? "Enter your profile link or the name on your profile." : ""; profile.setError(touched.has("profile") ? m : ""); return m; };
        add(pageBox, 
          pageName.el,
          profile.el,
          h(
            "div",
            null,
            h(
              "button",
              {
                type: "button",
                class: "btn btn--primary",
                onclick: () => {
                  touched.add("name"); touched.add("profile");
                  const a = checkName(); const b = checkProfile();
                  if (a) return pageName.focus();
                  if (b) return profile.focus();
                  update((s) => { s.brand.page.requestedAt = Date.now(); });
                  announce("Facebook page request sent. Come back in about one hour.");
                  paintAll();
                },
              },
              "Create my Facebook page"
            )
          )
        );
        return;
      }

      if (!page.url) {
        const w = waitPanel({
          title: "Your page is being created",
          requestedAt: page.requestedAt,
          durationMs: HOUR,
          lines: ["Come back in about 1 hour. Your request is saved, so you can close this page.", "The link to your page will appear here."],
          lateText: "This is taking a little longer than usual. Forge will contact you if they need anything.",
        });
        stoppers.push(w.stop);
        add(pageBox, w.el);
        if (testMode()) add(pageBox, demoSkip("Demo: skip the wait and show a sample page", () => {
          update((s) => {
            s.brand.page.url = "facebook.com/sample-page";
            s.brand.page.deliveredAt = Date.now();
          });
          paintAll();
        }));
        return;
      }

      add(pageBox, 
        h(
          "div",
          { class: "notice notice--ok" },
          h("p", null, h("b", null, page.pageName)),
          h("p", null, testMode() ? h("span", null, page.url, " (sample, not a real page)") : h("a", { href: "https://" + page.url.replace(/^https?:\/\//, ""), target: "_blank", rel: "noopener noreferrer" }, page.url)),
          h("p", { class: "field__help" }, "You are an admin of this page, and so is Forge. Forge adds your chosen logo to the page.")
        )
      );
    }

    function demoSkip(label, fn) {
      return h("p", null, h("button", { type: "button", class: "btn btn--small btn--quiet", onclick: async () => { fn(); if (!CONFIG.demo && (await syncStaff())) window.dispatchEvent(new HashChangeEvent("hashchange")); } }, label));
    }

    function paintFoot() {
      const st = getState();
      const target = nextToDo("brand", st);
      const done = isComplete("brand", st);
      let next;
      if (target) next = h("button", { type: "button", class: "btn btn--primary", onclick: () => go(target) }, "Continue");
      else if (done) next = h("button", { type: "button", class: "btn btn--primary", onclick: () => go("summary") }, "Continue");
      else next = h("button", { type: "button", class: "btn btn--primary", disabled: true }, "Continue");
      const note = target ? (done ? "" : "Your logo and page are being made. You can work on the next stages meanwhile.") : done ? "" : "Waiting for your logo and Facebook page.";
      footSlot.replaceChildren(foot({ back: "documents", next, note }));
    }

    function paintAll() {
      stopTimers();
      paintLogo();
      paintPage();
      paintFoot();
    }

    const root = h(
      "section",
      { class: "screen screen--wide" },
      head("Logo and Facebook page", "Both are made by Forge and take about 1 hour each. You can ask for both now."),
      h("div", { class: "section" }, logoBox),
      h("div", { class: "section" }, pageBox),
      footSlot
    );
    root._dispose = stopTimers;
    paintAll();
    return root;
  },
};
