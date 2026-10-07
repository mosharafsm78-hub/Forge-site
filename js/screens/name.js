import { h } from "../ui.js?v=1791345761";
import { getState, update } from "../store.js?v=1791345761";
import { validateBusinessName } from "../rules.js?v=1791345761";
import { head, textField, foot } from "./common.js?v=1791345761";
import { nameIdeas } from "../nameIdeas.js?v=1791345761";
import { industryById } from "../data/industries.js?v=1791345761";
import { append } from "../ui.js?v=1791345761";

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
    let busy = false;
    let ideas = [];
    let round = 0;
    function paintIdeas() {
      const n = getState().name;
      ideasBox.replaceChildren();
      append(ideasBox, [h("div", { class: "section__head" }, h("h2", null, "Not sure what to call it?"))]);
      if (busy) {
        append(ideasBox, [h("p", { class: "field__help" }, "Forge is thinking of names and checking that the web address is free...")]);
        return;
      }
      if (ideas.length) {
        append(ideasBox, [
          h("p", { class: "field__help" }, "Forge suggests these for your product. Tap one to use it. A tick means its .com web address was free when Forge checked."),
          h("div", { class: "chips" }, ideas.map((x) => h("button", { type: "button", class: "btn btn--small" + (n.chosen === x.name ? " btn--primary" : ""), onclick: () => { set("chosen", x.name); fields.chosen.input.value = x.name; setPreview(); paintIdeas(); } }, x.com ? "✓ " + x.name : x.name))),
          h("p", null, h("button", { type: "button", class: "btn btn--small btn--quiet", onclick: () => getIdeas() }, "Show other ideas")),
        ]);
        return;
      }
      append(ideasBox, [
        h("p", { class: "field__help" }, "Forge can suggest names for your product in a few seconds. You can also type your own above."),
        h("button", { type: "button", class: "btn", onclick: () => getIdeas() }, "Suggest names for me"),
      ]);
    }
    async function getIdeas() {
      busy = true;
      round += 1;
      paintIdeas();
      const st2 = getState();
      try {
        ideas = await nameIdeas({ avoid: ideas.map((x) => x.name), industryName: (industryById(st2.industryId) || {}).name, industryId: st2.industryId, productName: st2.product ? st2.product.name : "", ownerFirst: String((st2.profile && st2.profile.fullName) || "").split(/\s+/)[0], seed: round * 3 });
      } catch {
        ideas = [];
      }
      busy = false;
      paintIdeas();
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
