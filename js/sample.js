// Sample business for the preview. Fills the whole file so a reviewer can open any page.
// Only the preview offers this. Everything is labelled as sample data elsewhere.
import { update } from "./store.js?v=1791376102";
import { sampleOptions } from "./logo.js?v=1791376102";
import { makeShipment } from "./shipments.js?v=1791376102";

const file = (name) => ({ name, size: 184320, type: "image/png", at: Date.now() });

export function loadSample() {
  update((s) => {
    s.profile = { fullName: "Rahim Uddin", phone: "01712345678", email: "rahim@example.com", dob: "1995-04-12", district: "Chattogram", occupation: "Employed", experience: "Under 1 year", selling: "I have sold a few times", capital: "150000", hours: "1 to 2 hours", goal: "Extra income", license: "I am applying", payout: "Both bank and bKash", stock: "Yes" };
    s.industryId = "footwear";
    s.product = { id: "sample-0", name: "Sample product 1 (layout preview)", image: "", priceUsd: 3.4, category: "Sample category", supplier: "Sample supplier", inventory: 120, industryId: "footwear" };
    s.qty = 10;
    s.name = { chosen: "Rahim Footwear", alt1: "", alt2: "", wantsSuggestions: false };
    s.domain = { name: "rahimfootwear.shop", status: "available", priceAmount: 7, priceCurrency: "USD", renewalPrice: 9 };
    s.documents = { nidFront: file("nid-front.png"), nidBack: file("nid-back.png"), cheque: file("cheque.png"), licence: null, bankName: "Sample Bank", bkash: "01712345678", agreementReady: true, agreementSigned: file("signed-agreement.pdf") };
    s.brand.logo = { types: ["symbol", "badge"], color: "team", notes: "", requestedAt: Date.now() - 7200000, forName: "Rahim Footwear", deliveredAt: Date.now() - 3000000, options: sampleOptions(["symbol", "badge"], "team"), chosenId: "sample-1" };
    s.brand.page = { pageName: "Rahim Footwear", profile: "facebook.com/rahim.uddin", requestedAt: Date.now() - 7200000, deliveredAt: Date.now() - 3000000, url: "facebook.com/sample-page" };
    s.packaging.requestedAt = Date.now() - 86400000;
  });
}

export function sampleOrders() {
  const d = Date.now();
  const mk = (n, who, where, status, days) => ({ id: "F-" + (1040 + n), customer: who, district: where, qty: 1, amount: 1450, status, at: d - days * 86400000 });
  return [
    mk(1, "Sample customer A", "Dhaka", "new", 0),
    mk(2, "Sample customer B", "Sylhet", "confirmed", 1),
    mk(3, "Sample customer C", "Chattogram", "confirmed", 1),
    mk(4, "Sample customer D", "Rajshahi", "handed", 2),
    mk(5, "Sample customer E", "Dhaka", "delivered", 4),
    mk(6, "Sample customer F", "Khulna", "delivered", 5),
    mk(7, "Sample customer G", "Cumilla", "returned", 6),
  ];
}

// Review helper: make sure some goods have reached the owner so stock figures mean something.
export function ensureSampleStock(s) {
  if (s.shipments.some((x) => x.receivedAt)) return;
  const sh = makeShipment(s, "first");
  sh.status = "arrived";
  sh.freight = 8200;
  sh.freightPaidAt = Date.now();
  sh.receivedAt = Date.now();
  s.shipments = [sh];
}
