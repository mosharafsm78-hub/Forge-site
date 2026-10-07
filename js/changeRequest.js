// A locked choice can still be changed: the owner asks Forge, Forge reviews it, and Forge unlocks or applies it.
import { h } from "./ui.js?v=1791376988";
import { getState, update, saveNow } from "./store.js?v=1791376988";
import { loadBackend } from "./backend.js?v=1791376988";

const LABEL = { industry: "industry", product: "product and quantity", name: "business name", packaging: "packaging", domain: "domain" };

const lastPing = {};
export async function pingForge(kind) {
  if (Date.now() - (lastPing[kind] || 0) < 20000) return; // the server also sends each message only once
  lastPing[kind] = Date.now();
  try {
    await saveNow(); // the server reads the saved file, so it must be up to date
    const b = await loadBackend();
    if (b && b.notifyForge) await b.notifyForge(kind);
  } catch {
    // Forge also finds new requests on its own list; the owner's file is already saved.
  }
}

export function changeRequestBox(stageId) {
  const wrap = h("div", { class: "changereq" });
  let open = false;
  let sending = false;
  let note = "";

  function paint() {
    const mine = (getState().changeRequests || []).filter((r) => r.stage === stageId);
    const items = mine.map((r) => h("li", null, h("b", null, new Date(r.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ": "), r.text, h("span", { class: "muted" }, " Sent to Forge. Forge will contact you.")));
    const area = h("textarea", { class: "field__control", rows: "3", maxlength: "500", placeholder: "Tell Forge what you want to change and why.", "aria-label": "What do you want to change?" });
    area.value = note;
    area.addEventListener("input", () => { note = area.value; send.disabled = sending || note.trim().length < 5; });
    const send = h("button", { type: "button", class: "btn btn--primary btn--small", disabled: true, onclick: async () => {
      const text = note.trim().slice(0, 500);
      if (text.length < 5) return;
      sending = true; send.disabled = true; send.textContent = "Sending...";
      update((s) => { if (!Array.isArray(s.changeRequests)) s.changeRequests = []; s.changeRequests.push({ id: "cr" + Date.now(), stage: stageId, text, at: Date.now() }); });
      try { await saveNow(); } catch { /* the page keeps retrying the save */ }
      pingForge("change");
      sending = false; open = false; note = "";
      paint();
    } }, "Send to Forge");
    wrap.replaceChildren(
      ...(mine.length ? [h("ul", { class: "changereq__list" }, items)] : []),
      open
        ? h("div", { class: "changereq__form" }, h("label", { class: "field__label" }, "Change your " + (LABEL[stageId] || "choice")), area, h("p", { class: "field__help" }, "Forge reads every request. If your payment is not confirmed yet, Forge can unlock this step so you can change it and report your payment again. Payments already made are not refunded."), h("div", { style: "display:flex;gap:8px;margin-top:8px" }, send, h("button", { type: "button", class: "btn btn--small", onclick: () => { open = false; paint(); } }, "Cancel")))
        : h("button", { type: "button", class: "btn btn--small", onclick: () => { open = true; paint(); } }, "Request a change")
    );
  }
  paint();
  return wrap;
}
