import { h } from "../ui.js?v=1791376428";
import { getState } from "../store.js?v=1791376428";
import { previewAction } from "./common.js?v=1791376428";
import { loadSample } from "../sample.js?v=1791376428";
import { STAGES, PHASES, stageNumber } from "../stages.js?v=1791376428";
import { canOpen, canFill, stageStatus } from "../rules.js?v=1791376428";

const CHECK = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function tick() {
  const s = document.createElement("span");
  s.innerHTML = CHECK; // fixed internal markup
  return s.firstChild;
}

// What each step is, in one line, for the home list.
const BLURB = {
  profile: "Your name, phone and what you can put in.",
  industry: "The kind of products you want to sell.",
  product: "Pick a product and how many to start with.",
  name: "Choose what to call your business.",
  documents: "Show your ID and sign your agreement.",
  brand: "Forge designs your logo and builds your Facebook page.",
  packaging: "Forge quotes and designs your packaging.",
  domain: "Your business web address.",
  billing: "Pay your first bill, with the full amount shown first.",
  plan: "Forge drafts your business plan with you.",
  freight: "Forge ships and clears your goods.",
  marketing: "Forge runs your ads and shows you the results.",
  orders: "Forge confirms each order with the customer.",
  returns: "Handle returned parcels and stock.",
  reorder: "Reorder when it sells.",
};

function turnChip(stage, status) {
  if (status.pending) return h("span", { class: "chip-turn chip-turn--wait" }, status.text);
  if (status.state === "done") return h("span", { class: "chip-turn chip-turn--done" }, "Done");
  if (status.state === "waiting") return h("span", { class: "chip-turn chip-turn--wait" }, status.text);
  if (status.state === "locked" || status.state === "later") return h("span", { class: "chip-turn chip-turn--lock" }, status.text.replace("Starts after: ", "After: "));
  if (stage.ongoing) return h("span", { class: "chip-turn chip-turn--done" }, "Ongoing");
  return stage.who === "forge" ? h("span", { class: "chip-turn chip-turn--forge" }, "Forge's turn") : h("span", { class: "chip-turn" }, "Your turn");
}

function nextStage(st) {
  return STAGES.find((s) => s.built && !s.ongoing && stageStatus(s.id, st).state !== "done" && canFill(s.id, st)) || null;
}

export default {
  id: "welcome",
  stage: null,
  title: "Your business file",
  render() {
    const st = getState();
    const started = Object.values(st.profile || {}).some((v) => String(v || "").trim());
    const statuses = Object.fromEntries(STAGES.map((s) => [s.id, stageStatus(s.id, st)]));
    const doneCount = STAGES.filter((s) => statuses[s.id].state === "done").length;
    const next = nextStage(st);
    const waitingOn = STAGES.find((s) => statuses[s.id].state === "waiting");

    const nextCard = next
      ? h(
          "div",
          { class: "next" },
          h("p", { class: "next__label" }, started ? "Your next step" : "Start here"),
          h("h2", null, next.label),
          h("p", null, BLURB[next.id] || ""),
          h(
            "div",
            { class: "next__row" },
            h("a", { class: "btn btn--primary", href: "#/" + next.id }, started ? `Continue: ${next.label}` : "Start your business file"),
            h("span", { class: "next__meta" }, `Step ${stageNumber(next.id)} of ${STAGES.length}` + (next.wait ? ` · Forge: ${next.wait.charAt(0).toLowerCase()}${next.wait.slice(1)}` : ""))
          )
        )
      : waitingOn
      ? h("div", { class: "next" }, h("p", { class: "next__label" }, "Waiting on Forge"), h("h2", null, waitingOn.label), h("p", null, statuses[waitingOn.id].text + ". You will see the result here as soon as it is ready."))
      : h("div", { class: "next" }, h("p", { class: "next__label" }, "Up to date"), h("h2", null, "Nothing waiting on you right now"), h("p", null, "Check your orders, returns and stock from the list below."));

    const hero = h(
      "div",
      { class: "hero" },
      h("div", { class: "ring", style: `--p:${Math.round((doneCount / STAGES.length) * 100)}`, role: "img", "aria-label": `${doneCount} of ${STAGES.length} steps done` }, h("div", { class: "ring__text" }, h("span", { class: "ring__num" }, String(doneCount)), h("span", { class: "ring__label" }, `of ${STAGES.length} done`))),
      h("div", null, h("h1", null, "Your business file"), h("p", { class: "hero__sub" }, "You make the decisions. Forge handles the hassle. Every step shows whose turn it is and what it costs before you commit."))
    );

    const money = h(
      "div",
      { class: "money" },
      h("div", { class: "money__cell" }, h("span", { class: "money__k" }, "Minimum to start"), h("span", { class: "money__v" }, "৳30,000"), h("span", { class: "money__n" }, "Money you can afford to lose. Most of it goes to your first goods.")),
      h("div", { class: "money__cell" }, h("span", { class: "money__k" }, "Before you pay"), h("span", { class: "money__v" }, "Nothing"), h("span", { class: "money__n" }, "Forge starts no work and takes no money until your documents and signed agreement are in.")),
      h("div", { class: "money__cell" }, h("span", { class: "money__k" }, "Freight and duty"), h("span", { class: "money__v" }, "At cost"), h("span", { class: "money__n" }, "Billed only after your goods reach Bangladesh, in its own line."))
    );

    const parts = PHASES.map((phase, i) => {
      const list = STAGES.filter((s) => s.phase === phase.id);
      const n = list.filter((s) => statuses[s.id].state === "done").length;
      return h(
        "section",
        { class: "part" },
        h("div", { class: "part__head" }, h("h2", null, `${i + 1}. ${phase.label}`), h("span", { class: "part__count" }, `${n} of ${list.length} done`)),
        h("p", { class: "part__lede" }, phase.lede),
        h("div", { class: "part__bar", "aria-hidden": "true" }, list.map((s) => h("span", { class: "part__seg" + (statuses[s.id].state === "done" ? " is-done" : "") }))),
        list.map((stage) => {
          const status = statuses[stage.id];
          const open = stage.built && canOpen(stage.id, st);
          const cls = "task is-" + status.state + (next && next.id === stage.id ? " is-current" : "");
          const mark = h("span", { class: "task__mark", "aria-hidden": "true" }, status.state === "done" ? tick() : String(stageNumber(stage.id)));
          const body = h("span", null, h("span", { class: "task__name" }, stage.label), h("span", { class: "task__note" }, BLURB[stage.id] || ""));
          const chip = turnChip(stage, status);
          return open ? h("a", { class: cls, href: "#/" + stage.id }, mark, body, chip) : h("div", { class: cls }, mark, body, chip);
        })
      );
    });

    const how = h(
      "div",
      { class: "how" },
      h(
        "div",
        { class: "how__col" },
        h("h2", null, "You decide"),
        h("ul", null, h("li", null, "What to sell and what to call it."), h("li", null, "Which logo you like best."), h("li", null, "How much to spend on ads."), h("li", null, "When to reorder, and when to pause."), h("li", null, "Only you can sign your agreement, show your ID, and hand parcels to the courier."))
      ),
      h(
        "div",
        { class: "how__col how__col--forge" },
        h("h2", null, "Forge does the work"),
        h("ul", null, h("li", null, "Orders from the supplier, ships and clears your goods."), h("li", null, "Designs your logo options and builds your Facebook page."), h("li", null, "Buys your domain and gets your packaging made."), h("li", null, "Drafts your plan, runs your ads and shows you the results."), h("li", null, "Confirms every order with the customer."))
      )
    );

    return h(
      "section",
      { class: "screen home" },
      hero,
      nextCard,
      money,
      h("div", { class: "notice notice--warn" }, h("p", null, h("b", null, "Please read before you start. "), "Forge can make mistakes, and a business can lose money. Forge does not promise sales or profit. Your agreement says who pays for what and who carries which loss.")),
      h("div", { class: "parts" }, parts),
      how,
      h("p", { class: "field__help" }, "Your answers are saved to your account as you go. You can leave and come back to the same place."),
      previewAction("fill in a sample business so every page has data", () => {
        loadSample();
        window.location.hash = "#/summary";
      })
    );
  },
};
