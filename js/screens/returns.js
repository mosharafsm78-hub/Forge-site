import { h, announce, append } from "../ui.js?v=1791340302";
import { getState, update } from "../store.js?v=1791340302";
import { head, reviewNote, journeyFoot, dateText } from "./common.js?v=1791340302";
import { STATUS } from "./orders.js?v=1791340302";
import { stockFigures } from "../stock.js?v=1791340302";

const add = (el, ...k) => append(el, k);

export default {
  id: "returns",
  stage: "returns",
  title: "Returns and stock",
  render({ go }) {
    const body = h("div");
    const footSlot = h("div");

    function paint() {
      const st = getState();
      const list = st.orders.list;
      const f = stockFigures(st);
      const stats = [["Stock in hand", f.inHand], ["With the courier", f.withCourier], ["Delivered", f.delivered], ["Coming back", f.comingBack]];
      const back = list.filter((o) => o.status === "returned");
      body.replaceChildren();
      add(body,
        h("div", { class: "stats" }, stats.map(([k, v]) => h("div", { class: "stat" }, h("small", null, k), h("b", { class: "num" }, v)))),
        !f.received ? h("p", { class: "field__help", style: "margin-top:10px" }, "Stock counts start when you confirm that your goods have arrived.") : null,
        h("section", { class: "section", style: "margin-top:28px" },
          h("div", { class: "section__head" }, h("h2", null, "Returns"), h("p", null, "When a customer refuses a parcel, the courier brings it back to you. Mark it as received and the item goes back into your stock. Items that come back are sold again.")),
          back.length ? h("div", { class: "file" }, back.map((o) => h("div", { class: "file__row file__row--2" }, h("span", { class: "file__val" }, h("b", null, o.id), h("small", { class: "field__help" }, o.customer + ", " + o.district + ", " + dateText(o.at))), h("button", { type: "button", class: "btn btn--small", onclick: () => { update((s) => { s.orders.list.find((x) => x.id === o.id).status = "restocked"; }); announce(o.id + " is back in stock."); paint(); } }, "I received it"))))
            : h("p", { class: "field__help" }, "No returns waiting.")
        ),
        h("p", { class: "field__help" }, "Courier return fees for refused parcels are charged by the courier. They are part of the cost of selling cash on delivery.")
      );
      footSlot.replaceChildren(journeyFoot("returns", { go }));
    }

    const root = h("section", { class: "screen" }, head("Returns and stock", "What you have, what is out for delivery and what is coming back."), reviewNote("returns"), body, footSlot);
    paint();
    return root;
  },
};
