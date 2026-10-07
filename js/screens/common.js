// Building blocks shared by the screens: headings, form fields and the footer.
import { h } from "../ui.js";
import { CONFIG } from "../config.js";
import { getState, testMode, syncStaff } from "../store.js";
import { isComplete } from "../rules.js";
import { stageById, STAGES, PHASES, stageNumber } from "../stages.js";

// Where the owner is: part, step and whose turn it is. Read from the address so every screen shows it.
function crumb() {
  const id = (typeof location !== "undefined" ? location.hash : "").replace(/^#\/?/, "").split(/[/?]/)[0];
  const stage = STAGES.find((s) => s.id === id);
  if (!stage) return null;
  const phase = PHASES.find((p) => p.id === stage.phase);
  const done = isComplete(stage.id, getState());
  const chip = done ? h("span", { class: "chip-turn chip-turn--done" }, "Done") : stage.who === "forge" ? h("span", { class: "chip-turn chip-turn--forge" }, "Forge's turn") : h("span", { class: "chip-turn" }, "Your turn");
  return h("p", { class: "crumb" }, h("a", { href: "#/welcome" }, "Your business file"), h("span", { "aria-hidden": "true" }, "/"), h("span", null, `Part ${PHASES.indexOf(phase) + 1} of ${PHASES.length}: ${phase.label}`), h("span", { "aria-hidden": "true" }, "/"), h("span", null, `Step ${stageNumber(stage.id)} of ${STAGES.length}`), chip);
}

export function head(title, lede) {
  return h("div", { class: "screen__head" }, crumb(), h("h1", null, title), lede ? h("p", { class: "screen__lede" }, lede) : null);
}

function wrap({ id, label, help, full, tag = "div", labelTag = "label", control }) {
  const error = h("p", { class: "field__error", id: id + "-error", hidden: true });
  const helpEl = help ? h("p", { class: "field__help", id: id + "-help" }, help) : null;
  const labelEl = labelTag === "legend" ? h("legend", { class: "field__label" }, label) : h("label", { class: "field__label", for: id }, label);
  const el = h(tag, { class: "field" + (full ? " field--full" : "") }, labelEl, control, helpEl, error);
  return {
    el,
    setError(message) {
      error.hidden = !message;
      error.textContent = message || "";
      el.classList.toggle("has-error", Boolean(message));
      el.querySelectorAll("input, select, textarea").forEach((c) => {
        if (message) c.setAttribute("aria-invalid", "true");
        else c.removeAttribute("aria-invalid");
      });
    },
    focus() {
      const target = el.querySelector("input, select, textarea");
      if (target) target.focus();
    },
  };
}

function describe(control, id, help) {
  control.setAttribute("aria-describedby", [help ? id + "-help" : "", id + "-error"].filter(Boolean).join(" "));
}

export function textField({ id, label, help, type = "text", value = "", inputmode, autocomplete, list, placeholder, full, onInput, onBlur, maxlength }) {
  const input = h("input", { class: "input", id, name: id, type, value, inputmode, autocomplete, list, placeholder, maxlength, oninput: (e) => onInput && onInput(e.target.value), onblur: (e) => onBlur && onBlur(e.target.value) });
  describe(input, id, help);
  return { ...wrap({ id, label, help, full, control: input }), input };
}

export function textareaField({ id, label, help, value = "", full, onInput, maxlength = 400 }) {
  const input = h("textarea", { class: "textarea", id, name: id, value, maxlength, oninput: (e) => onInput && onInput(e.target.value) });
  describe(input, id, help);
  return { ...wrap({ id, label, help, full, control: input }), input };
}

export function selectField({ id, label, help, options, value = "", full, onChange, onBlur }) {
  const select = h(
    "select",
    { class: "select", id, name: id, onchange: (e) => onChange && onChange(e.target.value), onblur: (e) => onBlur && onBlur(e.target.value) },
    h("option", { value: "" }, "Choose one"),
    options.map((o) => h("option", { value: o.value ?? o, selected: (o.value ?? o) === value }, o.label ?? o))
  );
  select.value = value;
  describe(select, id, help);
  return { ...wrap({ id, label, help, full, control: select }), input: select };
}

export function radioField({ id, label, help, options, value = "", full, row, onChange }) {
  const group = h(
    "div",
    { class: "choices" + (row ? " choices--row" : ""), role: "radiogroup" },
    options.map((o, i) =>
      h(
        "label",
        { class: "choice" },
        h("input", { type: "radio", name: id, value: o.value, id: i === 0 ? id : id + "-" + i, checked: o.value === value, onchange: () => onChange && onChange(o.value) }),
        h("span", null, o.label)
      )
    )
  );
  const field = wrap({ id, label, help, full, tag: "fieldset", labelTag: "legend", control: group });
  field.el.setAttribute("aria-describedby", [help ? id + "-help" : "", id + "-error"].filter(Boolean).join(" "));
  return { ...field, input: group };
}

export function checkField({ id, label, help, checked, onChange }) {
  const input = h("input", { type: "checkbox", id, checked: Boolean(checked), onchange: (e) => onChange && onChange(e.target.checked) });
  return h("label", { class: "checkline", for: id }, input, h("span", null, h("span", null, label), help ? h("span", { class: "field__help", style: "display:block" }, help) : null));
}

export function foot({ back, next, note }) {
  return h(
    "div",
    { class: "screen__foot" },
    back ? h("a", { class: "btn", href: "#/" + back }, "Back") : null,
    next || null,
    note ? h("p", { class: "screen__foot-note" }, note) : null
  );
}

// A button that only exists in the sample-data preview, so a reviewer can see a step Forge normally does.
export function playForge(fn) {
  return async (e) => {
    fn(e);
    if (CONFIG.demo) return;
    if (await syncStaff()) window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
}
export function previewAction(label, fn, inline = false) {
  if (!testMode()) return null;
  const button = h("button", { type: "button", class: "btn btn--small btn--quiet", onclick: playForge(fn) }, "Demo: " + label);
  return inline ? button : h("p", null, button);
}

// Shown in the preview when a reviewer opens a stage before the ones it needs are finished.
export function reviewNote(stageId) {
  if (!CONFIG.demo) return null;
  const missing = stageById(stageId).needs.filter((id) => !isComplete(id, getState()));
  if (!missing.length) return null;
  return h("div", { class: "notice", style: "margin-bottom:24px" }, h("p", null, h("b", null, "Review mode."), " On the live site this stage stays closed until these are done: " + missing.map((id) => stageById(id).label.toLowerCase()).join(", ") + "."));
}

export const dateText = (ms) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const timeText = (ms) => new Date(ms).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Back to the previous stage and on to the next one.
export function journeyFoot(stageId, { go, canContinue = true, note } = {}) {
  const ids = ["billing", "plan", "freight", "marketing", "orders", "returns", "reorder"];
  const i = ids.indexOf(stageId);
  const back = i <= 0 ? "domain" : ids[i - 1];
  const nextId = i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;
  const next = nextId ? h("button", { type: "button", class: "btn btn--primary", disabled: !canContinue, onclick: () => go(nextId) }, "Continue") : null;
  return foot({ back, next, note });
}

// Plain-words definition of freight, shown wherever freight appears.
export function freightNote() {
  return h("div", { class: "notice", style: "margin-top:20px" },
    h("p", null, h("b", null, "What is freight? "), "Freight is everything it costs to bring your goods from the supplier's country into your hands in Bangladesh. It has four parts, and each one is shown as its own line:"),
    h("ul", null,
      h("li", null, h("b", null, "International shipping"), ", by air or sea, charged by weight or size."),
      h("li", null, h("b", null, "Customs duty and taxes"), ", charged by Bangladesh customs. The amount depends on the product."),
      h("li", null, h("b", null, "Clearance and port charges"), ", the paperwork and handling to release your goods."),
      h("li", null, h("b", null, "Delivery to Forge stock"), ", from the port or airport.")),
    h("p", null, "It is billed at the actual cost, only after your goods reach Bangladesh, because customs works out its part only then. You pay it to receive your goods. If it is not paid, your goods wait safely in Forge stock. It can come in higher or lower than an early estimate."));
}
