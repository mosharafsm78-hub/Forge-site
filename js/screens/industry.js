import { h } from "../ui.js?v=1791376723";
import { getState, update } from "../store.js?v=1791376723";
import { INDUSTRIES } from "../data/industries.js?v=1791376723";
import { head, textareaField, foot } from "./common.js?v=1791376723";

export default {
  id: "industry",
  stage: "industry",
  title: "Industry",
  render({ go }) {
    const st = getState();
    const buttons = new Map();

    function select(id) {
      update((s) => {
        s.industryId = id;
        // A product chosen under another industry no longer fits. Clear it so the owner chooses again.
        if (s.product && s.product.industryId !== id) s.product = null;
      });
      buttons.forEach((btn, key) => btn.setAttribute("aria-pressed", key === id ? "true" : "false"));
      next.disabled = false;
      note.hidden = true;
    }

    const grid = h(
      "div",
      { class: "industry-grid", role: "group", "aria-label": "Industries" },
      INDUSTRIES.map((industry) => {
        const btn = h(
          "button",
          { type: "button", class: "industry", "aria-pressed": st.industryId === industry.id ? "true" : "false", onclick: () => select(industry.id) },
          h("span", { class: "industry__name" }, industry.name),
          h("span", { class: "industry__blurb" }, industry.blurb)
        );
        buttons.set(industry.id, btn);
        return btn;
      })
    );

    const idea = textareaField({
      id: "f-industry-note",
      label: "Not on the list?",
      help: "Tell us what you want to sell. Forge will read it, but you still need to choose one industry above to continue.",
      value: st.industryNote,
      full: true,
      onInput: (v) =>
        update((s) => {
          s.industryNote = v;
        }),
    });

    const note = h("p", { class: "field__error", hidden: true }, "Choose an industry to continue.");
    const next = h(
      "button",
      {
        type: "button",
        class: "btn btn--primary",
        disabled: !st.industryId,
        onclick: () => {
          if (!getState().industryId) {
            note.hidden = false;
            return;
          }
          go("product");
        },
      },
      "Continue"
    );

    return h(
      "section",
      { class: "screen screen--wide" },
      head("Choose an industry", "Pick the kind of products you want to sell. Next you will see real products from the supplier's catalogue."),
      h("div", { class: "section" }, grid, note),
      h("div", { class: "section", style: "max-width:640px" }, idea.el),
      foot({ back: "profile", next })
    );
  },
};
