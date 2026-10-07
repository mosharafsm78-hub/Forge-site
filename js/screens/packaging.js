import { h, announce, append } from "../ui.js?v=1791339729";
const add = (el, ...kids) => append(el, kids);
import { getState, update } from "../store.js?v=1791339729";
import { isComplete, nextToDo } from "../rules.js?v=1791339729";
import { addWorkingDays, formatDay } from "../time.js?v=1791339729";
import { head, textareaField, checkField, foot } from "./common.js?v=1791339729";

const ITEMS = [
  { id: "polybag", label: "Courier polybag", help: "The outer bag your parcel travels in." },
  { id: "box", label: "Product box", help: "The box your product sits in, printed with your brand." },
  { id: "sticker", label: "Branded sticker or tape", help: "Seals the parcel with your name on it." },
  { id: "card", label: "Thank-you card", help: "A small card inside every parcel." },
];

export default {
  id: "packaging",
  stage: "packaging",
  title: "Packaging",
  render({ go }) {
    const body = h("div");
    const footSlot = h("div");

    const qtyOf = (item) => item.qty || getState().qty;
    const dueDate = (from) => formatDay(addWorkingDays(from || Date.now(), 3));

    function paintFoot() {
      const st = getState();
      const target = nextToDo("packaging", st);
      const done = isComplete("packaging", st);
      const next = target || done ? h("button", { type: "button", class: "btn btn--primary", onclick: () => go(target || "summary") }, "Continue") : h("button", { type: "button", class: "btn btn--primary", disabled: true }, "Continue");
      footSlot.replaceChildren(foot({ back: "brand", next, note: done ? "" : "Ask for a quote to continue." }));
    }

    function paint() {
      const st = getState();
      const p = st.packaging;
      body.replaceChildren();

      if (p.requestedAt) {
        const chosen = ITEMS.filter((i) => p.items[i.id].on);
        add(body, 
          h(
            "div",
            { class: "wait" },
            h("h3", null, "Quote requested"),
            h("p", { class: "wait__left" }, "Forge sends your quote by ", h("b", null, dueDate(p.requestedAt)), "."),
            h("p", { class: "field__help" }, "That is 3 working days, not counting Fridays, Saturdays or public holidays. The quote has the estimated cost and the packaging design. You approve it before anything is billed.")
          ),
          h("div", { class: "file", style: "margin-top:16px" }, chosen.map((i) => h("div", { class: "file__row file__row--2" }, h("span", { class: "file__key" }, i.label), h("span", { class: "file__val num" }, qtyOf(p.items[i.id]).toLocaleString("en-US") + " pieces")))),
          p.useLogo ? h("p", { class: "field__help" }, "Your logo will be printed on the packaging.") : null,
          p.notes ? h("p", { class: "field__help" }, "Your note: " + p.notes) : null,
          h(
            "div",
            { style: "margin-top:16px" },
            h("button", { type: "button", class: "btn btn--small", onclick: () => { update((s) => { s.packaging.requestedAt = null; }); paint(); paintFoot(); } }, "Change my request"),
            h("span", { class: "field__help", style: "margin-left:10px" }, "Changing it restarts the 3 working days.")
          )
        );
        return;
      }

      const itemRows = ITEMS.map((i) => {
        const item = p.items[i.id];
        const qty = h("input", { class: "input", type: "number", min: 1, step: 1, inputmode: "numeric", id: "f-pk-" + i.id, "aria-label": i.label + " quantity", value: qtyOf(item), disabled: !item.on, style: "width:110px" });
        const err = h("p", { class: "field__error", hidden: true });
        const row = h("div", { class: "pack" + (item.on ? " is-on" : "") });
        const toggle = checkField({
          id: "f-pk-on-" + i.id,
          label: i.label,
          help: i.help,
          checked: item.on,
          onChange: (v) => {
            update((s) => { s.packaging.items[i.id].on = v; });
            qty.disabled = !v;
            row.classList.toggle("is-on", v);
            errTop.hidden = true;
          },
        });
        qty.addEventListener("input", () => {
          const n = Number(qty.value);
          err.hidden = Number.isInteger(n) && n >= 1;
          err.textContent = "Enter a whole number, 1 or more.";
          if (!err.hidden) return;
          update((s) => { s.packaging.items[i.id].qty = n; });
        });
        row.append(toggle, h("div", { class: "pack__qty" }, h("span", { class: "field__help" }, "Pieces"), qty, err));
        row._qty = qty;
        return row;
      });
      const errTop = h("p", { class: "field__error", hidden: true }, "Choose at least one item.");

      const notes = textareaField({
        id: "f-pk-notes", label: "Anything special? (optional)", full: true, maxlength: 300, value: p.notes,
        help: "For example a colour you prefer, or a size the product needs.",
        onInput: (v) => update((s) => { s.packaging.notes = v; }),
      });
      const logo = checkField({
        id: "f-pk-logo", label: "Print my logo on the packaging", help: "Uses the logo you choose on the previous stage.", checked: p.useLogo,
        onChange: (v) => update((s) => { s.packaging.useLogo = v; }),
      });

      add(body, 
        h("div", { class: "section" }, h("div", { class: "section__head" }, h("h2", null, "What do you need?"), h("p", null, `Quantities start at your ${st.qty} units. Change them if you want spares.`)), h("div", { class: "pack-list" }, itemRows), errTop),
        h("div", { class: "section" }, logo, notes.el),
        h(
          "div",
          { class: "section" },
          h("div", { class: "section__head" }, h("h2", null, "What happens next")),
          h("ol", { class: "steps" },
            h("li", null, "You ask for a quote."),
            h("li", null, `Within 3 working days (by ${dueDate()}), Forge sends the estimated cost and the packaging design.`),
            h("li", null, "You approve the quote. It is added to your bill."),
            h("li", null, "The packaging is made locally in Bangladesh.")
          )
        ),
        h(
          "div",
          null,
          h(
            "button",
            {
              type: "button",
              class: "btn btn--primary",
              onclick: () => {
                const cur = getState().packaging;
                if (!ITEMS.some((i) => cur.items[i.id].on)) { errTop.hidden = false; return; }
                const bad = itemRows.find((r, idx) => cur.items[ITEMS[idx].id].on && !(Number.isInteger(Number(r._qty.value)) && Number(r._qty.value) >= 1));
                if (bad) { bad._qty.focus(); return; }
                update((s) => {
                  ITEMS.forEach((i) => { s.packaging.items[i.id].qty = Number(itemRows[ITEMS.indexOf(i)]._qty.value); });
                  s.packaging.requestedAt = Date.now();
                });
                announce("Quote requested. Forge replies within 3 working days.");
                paint();
                paintFoot();
              },
            },
            "Ask for a quote"
          )
        )
      );
    }

    const root = h("section", { class: "screen" }, head("Packaging", "Your parcels need packaging. Forge quotes it and designs it for you, and it is made locally in Bangladesh."), body, footSlot);
    paint();
    paintFoot();
    return root;
  },
};
