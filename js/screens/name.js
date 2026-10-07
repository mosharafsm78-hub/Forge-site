import { h } from "../ui.js";
import { getState, update } from "../store.js";
import { validateBusinessName } from "../rules.js";
import { head, textField, checkField, foot } from "./common.js";

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

    const suggest = checkField({
      id: "f-name-suggest",
      label: "Ask the Forge team to suggest names",
      help: "The team will send ideas based on your product. You still choose the final name.",
      checked: st.name.wantsSuggestions,
      onChange: (v) => set("wantsSuggestions", v),
    });

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
      h("div", { class: "section" }, fields.chosen.el, preview, fields.alt1.el, fields.alt2.el, suggest),
      foot({ back: "product", next })
    );
  },
};
