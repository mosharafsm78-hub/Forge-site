import { h } from "../ui.js";
import { getState } from "../store.js";
import { head } from "./common.js";
import { previewAction } from "./common.js";
import { loadSample } from "../sample.js";

export default {
  id: "welcome",
  stage: null,
  title: "Start",
  render() {
    const st = getState();
    const started = Object.values(st.profile || {}).some((v) => String(v || "").trim());
    return h(
      "section",
      { class: "screen" },
      head(
        "Start your business with Forge",
        "Every business is two jobs: deciding and doing. Deciding is yours. Doing is Forge's, using AI for speed and a real team for accountability."
      ),
      h(
        "div",
        { class: "split" },
        h(
          "div",
          { class: "split__col" },
          h("h2", null, "You decide"),
          h(
            "ul",
            null,
            h("li", null, "What to sell and what to call it."),
            h("li", null, "Which logo you like best."),
            h("li", null, "How much to spend on ads."),
            h("li", null, "When to reorder."),
            h("li", null, "When to pause."),
            h("li", { class: "muted" }, "Only you can: sign your agreement, show your ID, and hand parcels to the courier.")
          )
        ),
        h(
          "div",
          { class: "split__col split__col--team" },
          h("h2", null, "Forge makes it happen"),
          h(
            "ul",
            null,
            h("li", null, "Orders from the supplier, ships and clears your goods."),
            h("li", null, "Designs your logo options and builds your Facebook page."),
            h("li", null, "Buys your domain and gets your packaging made."),
            h("li", null, "Drafts and reviews your business plan."),
            h("li", null, "Runs your ads and shows you the results."),
            h("li", null, "Confirms every order with the customer.")
          )
        )
      ),
      h("div", { class: "notice notice--warn" }, h("p", null, h("b", null, "Please read before you start. "), "Forge can make mistakes, and a business can lose money. Forge does not promise sales or profit. Your agreement says who pays for what and who carries which loss.")),
      h("div", { class: "notice" }, h("p", null, "Your answers are saved on this device as you go. You can leave and come back to the same place.")),
      previewAction("fill in a sample business so every page has data", () => { loadSample(); window.location.hash = "#/summary"; }),
      h("div", { class: "screen__foot" }, h("a", { class: "btn btn--primary", href: "#/profile" }, started ? "Continue your business file" : "Start your business file"))
    );
  },
};
