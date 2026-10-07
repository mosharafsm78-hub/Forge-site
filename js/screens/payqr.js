// Pay by scanning the Bangla QR with any bank or mobile wallet app. Forge checks the payment by hand afterwards.
import { h } from "../ui.js?v=1791344498";
import { CONFIG } from "../config.js?v=1791344498";

export const PAY_QR_SRC = CONFIG.payQr || "assets/bangla-qr.png";

export function payPanel(amountText) {
  const img = h("img", { class: "payqr__img", src: PAY_QR_SRC, alt: "Bangla QR code to pay Forge" });
  const empty = h("div", { class: "payqr__empty", hidden: true }, h("b", null, "Payment QR is being added."), h("span", null, "Forge will show it here shortly."));
  img.addEventListener("error", () => { img.hidden = true; empty.hidden = false; });
  return h(
    "div",
    { class: "payqr" },
    h("div", { class: "payqr__code" }, img, empty, h("p", { class: "payqr__tag" }, "Bangla QR")),
    h(
      "div",
      { class: "payqr__how" },
      h("h3", null, "Pay in 3 steps"),
      h("ol", null, h("li", null, "Open your bKash, Nagad, Rocket or bank app and choose Scan QR."), h("li", null, h("span", null, "Scan this code and enter exactly "), h("b", { class: "num" }, amountText), h("span", null, ".")), h("li", null, "Finish the payment and keep the transaction ID from your app.")),
      h("p", { class: "field__help" }, "Forge checks every payment by hand. This can take some time, so please wait for the confirmation here.")
    )
  );
}
