// A single file slot: choose, replace or remove one file. On the live site the file goes to private storage
// and only its description and location are kept in the owner's file. In the sample preview nothing is sent.
import { h, announce, append } from "../ui.js?v=1791345108";
const add = (el, ...kids) => append(el, kids);
import { getState, update, currentUser, saveNow } from "../store.js?v=1791345108";
import { CONFIG } from "../config.js?v=1791345108";
import { loadBackend } from "../backend.js?v=1791345108";

const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "application/pdf"];

function sizeText(bytes) {
  return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
}

export function fileSlot({ id, label, help, get, set, disabled, disabledNote }) {
  const error = h("p", { class: "field__error", id: id + "-error", hidden: true });
  const status = h("div", { class: "slot__status" });
  const input = h("input", { type: "file", id, class: "sr-only", accept: ".jpg,.jpeg,.png,.pdf", tabindex: "-1" });
  const el = h("div", { class: "slot" + (disabled ? " is-disabled" : "") });

  function paint() {
    const file = get(getState());
    status.replaceChildren();
    if (file) {
      add(status, 
        h("span", { class: "pill pill--ok" }, "Added"),
        h("span", { class: "slot__file" }, file.name, h("small", { class: "num" }, " " + sizeText(file.size))),
        h("button", { type: "button", class: "btn btn--small", disabled, onclick: () => input.click() }, "Replace"),
        h("button", { type: "button", class: "btn btn--small btn--quiet", disabled, "aria-label": "Remove " + label, onclick: () => { const old = get(getState()); update((s) => set(s, null)); if (CONFIG.live && old && old.path) loadBackend().then((b) => b.removeUpload(old.path)).catch(() => {}); paint(); announce(label + " removed."); } }, "Remove")
      );
    } else {
      add(status, h("button", { type: "button", class: "btn btn--small", disabled, "aria-describedby": id + "-help " + id + "-error", onclick: () => input.click() }, "Choose file"), disabled && disabledNote ? h("span", { class: "field__help" }, disabledNote) : null);
    }
    el.classList.toggle("is-done", Boolean(file));
  }

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    if (!OK_TYPES.includes(file.type)) return fail("Use a JPG, PNG or PDF file.");
    if (file.size > MAX_BYTES) return fail("The file is larger than 5 MB. Use a smaller photo or scan.");
    if (file.size === 0) return fail("The file is empty. Choose it again.");
    error.hidden = true;
    if (!CONFIG.live) {
      update((s) => set(s, { name: file.name, size: file.size, type: file.type, at: Date.now() }));
      paint();
      announce(label + " added.");
      return;
    }
    send(file);
  });
  async function send(file) {
    const user = currentUser();
    if (!user) return fail("You are signed out. Log in again.");
    const old = get(getState());
    status.replaceChildren(h("span", { class: "pill" }, "Uploading..."), h("span", { class: "slot__file" }, file.name));
    try {
      const backend = await loadBackend();
      const path = await backend.upload(user.id, id.replace(/^f-/, ""), file);
      update((s) => set(s, { name: file.name, size: file.size, type: file.type, at: Date.now(), path }));
      await saveNow();
      if (old && old.path) backend.removeUpload(old.path).catch(() => {});
      announce(label + " added.");
    } catch (e) {
      fail(e.message || "The file could not be uploaded. Try again.");
    }
    paint();
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function fail(message) {
    error.textContent = message;
    error.hidden = false;
  }

  el.append(
    h("div", { class: "slot__text" }, h("label", { class: "field__label", for: id }, label), help ? h("p", { class: "field__help", id: id + "-help" }, help) : null),
    status,
    input,
    error
  );
  paint();
  return { el, repaint: paint };
}
