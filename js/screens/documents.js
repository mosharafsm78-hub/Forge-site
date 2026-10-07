import { h, announce, append } from "../ui.js?v=1791344009";
const add = (el, ...kids) => append(el, kids);
import { CONFIG } from "../config.js?v=1791344009";
import { getState, update, subscribe, testMode } from "../store.js?v=1791344009";
import { payoutNeeds, validateBkash, documentsMissing, documentsChecked, isComplete, nextToDo } from "../rules.js?v=1791344009";
import { head, textField, foot, previewAction } from "./common.js?v=1791344009";
import { fileSlot } from "./files.js?v=1791344009";

const LABELS = { nidFront: "NID, front", nidBack: "NID, back", cheque: "Cheque leaf", bkash: "bKash number", agreementSigned: "Signed agreement" };

export default {
  id: "documents",
  stage: "documents",
  title: "Documents and agreement",
  render({ go }) {
    const st = getState();
    const need = payoutNeeds(st);
    const checklist = h("ul", { class: "checklist" });
    const footSlot = h("div");
    const agreementBox = h("div");
    const checkBox = h("div");

    // Forge checks every document. Until then the next stages stay closed.
    function paintCheck() {
      const s = getState();
      checkBox.replaceChildren();
      if (CONFIG.demo || documentsMissing(s).length) return;
      if (!documentsChecked(s)) add(checkBox, previewAction("Forge confirms my documents", () => { update((x) => { x.documents.verifiedAt = Date.now(); x.documents.agreementReady = true; x.documents.reviewNote = ""; }); refresh(); }));
      const d = s.documents;
      if (documentsChecked(s)) add(checkBox, h("div", { class: "notice notice--ok", style: "margin-bottom:24px" }, h("p", null, h("b", null, "Your documents are checked.")), h("p", null, "The next stages are open.")));
      else if (d.reviewNote && !d.verifiedAt) add(checkBox, h("div", { class: "notice notice--error", style: "margin-bottom:24px" }, h("p", null, h("b", null, "Forge needs a change.")), h("p", null, d.reviewNote)));
      else add(checkBox, h("div", { class: "notice notice--forge", style: "margin-bottom:24px" }, h("p", null, h("b", null, "Forge is checking your documents.")), h("p", null, "This page updates by itself when they are done. You can close it and come back.")));
    }

    function paintList() {
      const missing = documentsMissing(getState());
      const rows = ["nidFront", "nidBack", need.bank ? "cheque" : null, need.bkash ? "bkash" : null, "agreementSigned"].filter(Boolean);
      checklist.replaceChildren(
        ...rows.map((k) => h("li", { class: missing.includes(k) ? "" : "is-done" }, h("span", { class: "checklist__mark", "aria-hidden": "true" }, missing.includes(k) ? "" : "✓"), LABELS[k], h("span", { class: "sr-only" }, missing.includes(k) ? ", still needed" : ", done")))
      );
    }

    function paintFoot() {
      const s = getState();
      const target = nextToDo("documents", s);
      const done = isComplete("documents", s);
      const next = target || done ? h("button", { type: "button", class: "btn btn--primary", onclick: () => go(target || "summary") }, "Continue") : h("button", { type: "button", class: "btn btn--primary", disabled: true }, "Continue");
      const waiting = !done && documentsMissing(s).length === 0;
      footSlot.replaceChildren(foot({ back: "name", next, note: done ? "" : waiting ? "Waiting for Forge to check your documents." : "Add the items marked as still needed." }));
    }

    function refresh() {
      paintList();
      paintFoot();
      paintCheck();
    }

    // Slots repaint the checklist whenever a file changes.
    const slot = (opts) => {
      const s = fileSlot({
        ...opts,
        set: (state, value) => {
          opts.set(state, value);
        },
      });
      s.el.addEventListener("change", () => window.setTimeout(refresh, 0));
      s.el.addEventListener("click", () => window.setTimeout(refresh, 0));
      return s;
    };

    const nidFront = slot({ id: "f-nid-front", label: "NID, front", help: "A clear photo or scan. JPG, PNG or PDF, up to 5 MB.", get: (s) => s.documents.nidFront, set: (s, v) => { s.documents.nidFront = v; } });
    const nidBack = slot({ id: "f-nid-back", label: "NID, back", get: (s) => s.documents.nidBack, set: (s, v) => { s.documents.nidBack = v; } });
    const cheque = slot({ id: "f-cheque", label: "Cheque leaf", help: "A leaf from your own cheque book, with your name and account number. Your courier account is linked to this bank account.", get: (s) => s.documents.cheque, set: (s, v) => { s.documents.cheque = v; } });
    const licence = slot({ id: "f-licence", label: "Trade licence (optional now)", help: "If you already have one in your business name, add it now. Otherwise you have 30 days after you start.", get: (s) => s.documents.licence, set: (s, v) => { s.documents.licence = v; } });

    const bankName = textField({ id: "f-bank-name", label: "Bank name", full: true, maxlength: 60, value: st.documents.bankName, onInput: (v) => update((s) => { s.documents.bankName = v; }) });
    const bkash = textField({
      id: "f-bkash", label: "bKash number", type: "tel", inputmode: "tel", full: true, value: st.documents.bkash,
      help: need.bank ? "Used to receive payments too." : "You have no bank account for sales money, so Pathao sends your payments to this bKash number.",
      onInput: (v) => { update((s) => { s.documents.bkash = v; }); if (touched) check(); refresh(); },
      onBlur: () => { touched = true; check(); },
    });
    let touched = false;
    const check = () => bkash.setError(touched ? validateBkash(getState().documents.bkash) : "");

    function paintAgreement() {
      const d = getState().documents;
      agreementBox.replaceChildren();
      if (!d.agreementReady) {
        add(agreementBox, 
          h("div", { class: "notice notice--info" }, h("p", null, h("b", null, "Your agreement is not ready yet.")), h("p", null, "Forge places it here. Then you download it, print it, sign it, scan it and upload it back.")),
          previewAction("show the agreement as ready", () => { update((s) => { s.documents.agreementReady = true; }); paintAgreement(); refresh(); })
        );
      } else {
        add(agreementBox, 
          h("ol", { class: "steps" }, h("li", null, "Download the agreement."), h("li", null, "Print it and sign every page."), h("li", null, "Scan or photograph the signed pages.")),
          CONFIG.demo ? h("p", { class: "field__help" }, "Preview: the real agreement is not written yet, so there is nothing to download here.") : null,
          signed.el
        );
      }
    }
    const signed = slot({ id: "f-agreement", label: "Signed agreement", help: "One PDF or clear photos of the signed pages.", get: (s) => s.documents.agreementSigned, set: (s, v) => { s.documents.agreementSigned = v; } });

    const section = (title, note, ...kids) => h("section", { class: "section" }, h("div", { class: "section__head" }, h("h2", null, title), note ? h("p", null, note) : null), ...kids);

    const root = h(
      "section",
      { class: "screen" },
      head("Documents and agreement", "Forge needs these to import your goods and set up your courier account."),
      h("div", { class: "notice notice--error", style: "margin-bottom:24px" }, h("p", null, h("b", null, "Nothing starts without your signed agreement."), " Forge does not make your logo, page or packaging, register your domain, order your goods or take payment until your signed agreement is uploaded here. The next stages stay closed until then.")),
      CONFIG.demo ? h("div", { class: "notice notice--info", style: "margin-bottom:24px" }, h("p", null, "Preview: files you choose here are not sent anywhere. Secure storage is connected before real documents are collected.")) : h("div", { class: "notice", style: "margin-bottom:24px" }, h("p", null, h("b", null, "Your files are private."), " They are stored securely and only you and the Forge staff who handle your file can open them.")),
      !CONFIG.demo ? previewAction("skip this step: add sample documents and confirm them", () => {
        const f = (n) => ({ name: n, size: 120000, type: "image/jpeg", at: Date.now() });
        update((s) => {
          s.documents.agreementReady = true;
          s.documents.nidFront = f("sample-nid-front.jpg");
          s.documents.nidBack = f("sample-nid-back.jpg");
          if (need.bank) { s.documents.cheque = f("sample-cheque.jpg"); if (!s.documents.bankName) s.documents.bankName = "Sample Bank"; }
          if (need.bkash && !s.documents.bkash) s.documents.bkash = "01712345678";
          s.documents.agreementSigned = { name: "sample-signed-agreement.pdf", size: 240000, type: "application/pdf", at: Date.now() };
          s.documents.verifiedAt = Date.now() + 1;
          s.documents.reviewNote = "";
        });
        paintAgreement(); refresh();
      }) : null,
      checkBox,
      section("What you need", null, checklist),
      section("Your NID", "Needed to register you as the owner and to open your courier account.", nidFront.el, nidBack.el),
      section("Where your sales money goes", `You chose: ${st.profile.payout}.`, need.bank ? [bankName.el, cheque.el] : null, need.bkash ? bkash.el : null),
      section("Agreement with Forge", "You sign one agreement with Forge before you pay.", agreementBox),
      section("Trade licence", null,
        h("div", { class: "notice notice--warn" }, h("p", null, h("b", null, "Upload your trade licence within 30 days of starting the business. Otherwise Forge stops the process of doing business.")), h("p", null, "The licence must be in your business name. The 30 days start when your payment is confirmed.")),
        licence.el
      ),
      footSlot
    );
    paintAgreement();
    refresh();
    const stop = subscribe(() => { paintAgreement(); refresh(); });
    root._dispose = stop;
    return root;
  },
};
