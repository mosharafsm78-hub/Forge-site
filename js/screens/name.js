import { h } from "../ui.js?v=1791340302";
import { getState, update } from "../store.js?v=1791340302";
import { validateBusinessName } from "../rules.js?v=1791340302";
import { head, textField, foot, previewAction } from "./common.js?v=1791340302";
import { HOUR } from "../time.js?v=1791340302";
import { waitPanel } from "./wait.js?v=1791340302";
import { append } from "../ui.js?v=1791340302";

export default {
  id: "name",
  stage: "name",
  title: "Business name",
  render({ go }) {
    const st = getState();
    const touched = new Set();

    const preview = h("p", { class: "field__help" });
    const setPreview = () => {
      const n = (getState().name.chosen || "").trim();
      preview.textContent = n ? `This is how your business will appear: ${n}` : "";
    };

    const set = (key, value) =>
      update((s) => {
        s.name[key] = value;
      });

    const check = (key) => {
      const value = getState().name[key];
      // The two optional names only need checking when something is typed.
      const message = key !== "chosen" && !String(value || "").trim() ? "" : validateBusinessName(value);
      fields[key].setError(touched.has(key) ? message : "");
      return message;
    };

    const mk = (key, label, help) =>
      textField({
        id: "f-name-" + key,
        label,
        help,
        value: st.name[key] || "",
        maxlength: 60,
        full: true,
        onInput: (v) => {
          set(key, v);
          if (key === "chosen") setPreview();
          if (touched.has(key)) check(key);
        },
        onBlur: () => {
          touched.add(key);
          check(key);
        },
      });

    const fields = {
      chosen: mk("chosen", "Business name", "Your trade licence will be issued in this name, so choose one you plan to keep."),
      alt1: mk("alt1", "Another name you like (optional)", "A second choice in case the first is taken."),
      alt2: mk("alt2", "A third name (optional)"),
    };

    // Forge suggests names from the product. The owner still chooses.
    const ideasBox = h("div", { class: "section" });
    let stopper = null;
    function paintIdeas() {
      if (stopper) stopper();
      const n = getState().name;
      ideasBox.replaceChildren();
      append(ideasBox, [h("div", { class: "section__head" }, h("h2", null, "Not sure what to call it?"))]);
      if (n.suggestions && n.suggestions.length) {
        append(ideasBox, [
          h("p", { class: "field__help" }, "Forge suggests these for your product. Tap one to use it. You can still type your own."),
          h("div", { class: "chips" }, n.suggestions.map((x) => h("button", { type: "button", class: "btn btn--small" + (n.chosen === x ? " btn--primary" : ""), onclick: () => { set("chosen", x); fields.chosen.input.value = x; setPreview(); paintIdeas(); } }, x))),
        ]);
      } else if (n.suggestRequestedAt) {
        const w = waitPanel({ title: "Forge is thinking of names", requestedAt: n.suggestRequestedAt, durationMs: HOUR, lines: ["Forge checks that each name is free to use and fits your product. About 1 hour."], lateText: "Forge is finishing your name ideas. They will appear here soon." });
        stopper = w.stop;
        append(ideasBox, [w.el]);
        const d = previewAction("show sample name ideas", () => { update((s) => { s.name.suggestions = ["Urban Stride", "Step Nest", "Daily Tread", "Pathik Footwear"]; s.name.suggestedAt = Date.now(); }); paintIdeas(); });
        if (d) append(ideasBox, [d]);
      } else {
        append(ideasBox, [
          h("p", { class: "field__help" }, "Ask Forge for ideas based on your product. You do not need to wait: you can type your own name now and change it later."),
          h("button", { type: "button", class: "btn", onclick: () => { update((s) => { s.name.suggestRequestedAt = Date.now(); s.name.wantsSuggestions = true; }); paintIdeas(); } }, "Ask Forge for name ideas"),
        ]);
      }
    }
    paintIdeas();

    const next = h(
      "button",
      {
        type: "button",
        class: "btn btn--primary",
        onclick: () => {
          ["chosen", "alt1", "alt2"].forEach((k) => touched.add(k));
          const results = ["chosen", "alt1", "alt2"].map(check);
          const firstBad = ["chosen", "alt1", "alt2"].find((k, i) => results[i]);
          if (firstBad) {
            fields[firstBad].focus();
            return;
          }
          go("documents");
        },
      },
      "Continue"
    );

    setPreview();
    return h(
      "section",
      { class: "screen" },
      head("Name your business", "Your name is used for your logo, Facebook page, domain and trade licence."),
      h("div", { class: "section" }, fields.chosen.el, preview, fields.alt1.el, fields.alt2.el),
      ideasBox,
      foot({ back: "product", next })
    );
  },
};
