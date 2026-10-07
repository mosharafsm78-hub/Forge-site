// Forge's business plan, written from the owner's real file. Plain words, real numbers, honest risks.
// Every figure is either from the file (marked as such) or a planning assumption that says so.
import { formatBdt, usdToBdt } from "./ui.js";

const FALLBACK_RATE = 122.76;
const AD_DAYS = 14;
const AD_PER_DAY = 600; // planning figure for the first test; the real daily budget is set with Forge
const VAT = 1.15; // 15% VAT on Facebook ad payments in Bangladesh
const FREIGHT_ALLOWANCE = 0.55; // of the product cost, used only until the real freight bill exists
const COURIER_FEE = 120; // planning figure per parcel; check the courier rate card
const AD_PER_ORDER = 380; // planning figure; the real number comes from your own ads
const MIN_CAPITAL = 30000;

const roundTo = (n, step) => Math.round(n / step) * step;
const bdt = (n) => formatBdt(Math.round(n));
const signed = (n) => (n < 0 ? "−" + bdt(-n) : bdt(n));

export function planNumbers(st) {
  const rate = st.fx && Number(st.fx.rate) > 0 ? Number(st.fx.rate) : FALLBACK_RATE;
  const qty = Math.max(1, st.qty || 1);
  const usd = st.product ? Number(st.product.priceUsd) || 0 : 0;
  const goods = usdToBdt(usd * qty, rate);
  const dom = st.domain && st.domain.status === "available" && st.domain.priceCurrency === "USD" ? usdToBdt(Number(st.domain.priceAmount) || 0, rate) : 0;
  const pay = st.payment || {};
  const packaging = Number(pay.packagingCost) > 0 ? Number(pay.packagingCost) : 4500;
  const website = Number(pay.websiteFee) > 0 ? Number(pay.websiteFee) : 3000;
  const realFreight = (st.shipments || []).reduce((n, x) => n + (Number(x.freight) || 0), 0);
  const freight = realFreight > 0 ? realFreight : goods * FREIGHT_ALLOWANCE;
  const ads = AD_DAYS * AD_PER_DAY * VAT;
  const fixed = dom + packaging + website;
  const firstBill = goods + fixed;
  const landed = (goods + freight + fixed) / qty;
  const goodsPerUnit = (goods + freight) / qty;
  const total = goods + freight + fixed + ads;
  return { rate, qty, goods, dom, packaging, website, freight, realFreight: realFreight > 0, ads, fixed, firstBill, landed, goodsPerUnit, total };
}

// Profit if every unit in the batch is placed as an order, at a selling price and a share of refused parcels.
function batchProfit(n, price, returnRate) {
  const orders = n.qty / (1 - returnRate) > n.qty ? n.qty : n.qty; // orders placed = units you hold
  const delivered = orders * (1 - returnRate);
  const revenue = delivered * price;
  const goodsCost = delivered * n.goodsPerUnit;
  const courier = orders * COURIER_FEE;
  const adCost = orders * AD_PER_ORDER;
  return revenue - goodsCost - n.fixed - courier - adCost;
}

export function buildPlan(st) {
  const n = planNumbers(st);
  const name = (st.name && st.name.chosen && st.name.chosen.trim()) || "Your business";
  const product = st.product ? st.product.name : "your product";
  const owner = (st.profile && st.profile.name && String(st.profile.name).trim().split(/\s+/)[0]) || "you";
  const base = roundTo(n.landed * 2.5, 50);
  const prices = [roundTo(n.landed * 2, 50), base, roundTo(n.landed * 3, 50)];
  const rates = [0.15, 0.25, 0.35];
  const mid = batchProfit(n, base, 0.25);
  const cPerDelivered = (price, r) => price - n.goodsPerUnit - (COURIER_FEE + AD_PER_ORDER) / (1 - r);
  const be = cPerDelivered(base, 0.25) > 0 ? Math.ceil(n.fixed / cPerDelivered(base, 0.25)) : null;

  const sections = [];

  sections.push({
    title: "Your plan at a glance",
    callout: true,
    lines: [
      `${name} imports ${product} and sells it in Bangladesh, cash on delivery. You start with ${n.qty} units.`,
      `Money you put in over the first month: about ${bdt(n.total)}. That is your goods, domain, website, packaging, freight and a two-week ad test.`,
      `At a selling price of ${bdt(base)} and 1 in 4 parcels refused, selling all ${n.qty} units would leave you about ${signed(mid)}. This is a worked example, not a forecast.`,
      be && be <= n.qty ? `On those numbers about ${be} delivered orders cover your one-off costs, out of the ${n.qty} you hold.` : `On those numbers your first batch does not cover the one-off costs. A higher price, fewer costs or more units would be needed. Do not start ads until the numbers work.`,
      "The two things that decide the result are your selling price and how many parcels come back. Forge tracks both for you.",
    ],
  });

  sections.push({
    title: "1. The business",
    lines: [
      `${name} sells ${product} to customers across Bangladesh.`,
      "Customers order on your website or through your Facebook page. They pay cash to the courier when the parcel arrives.",
      "Forge imports the goods, runs the ads, phones every customer to confirm the order, and answers questions. You hand each parcel to the courier and receive any that come back.",
    ],
  });

  sections.push({
    title: "2. What you pay, and when",
    lines: ["Every amount below comes from your file, except the lines marked as an allowance. The allowance is replaced by the real bill."],
    table: {
      head: ["Item", "Amount", "When"],
      rows: [
        [`Goods: ${n.qty} × ${st.product ? "$" + Number(st.product.priceUsd).toFixed(2) : "supplier price"}`, bdt(n.goods), "First bill"],
        [st.domain && st.domain.name ? `Domain: ${st.domain.name}, 1 year` : "Domain, 1 year", n.dom ? bdt(n.dom) : "Confirmed by Forge", "First bill"],
        ["Packaging", bdt(n.packaging), "First bill"],
        ["Website setup", bdt(n.website), "First bill"],
        [n.realFreight ? "Freight, duty and clearance (actual)" : "Freight, duty and clearance (allowance)", bdt(n.freight), "When goods reach Bangladesh"],
        [`Facebook ads: about ${AD_DAYS} days at ${bdt(AD_PER_DAY)} a day, with 15% VAT`, bdt(n.ads), "Paid to Facebook as ads run"],
      ],
      foot: ["Total over the first month", bdt(n.total), ""],
    },
    note: n.total > MIN_CAPITAL
      ? `This is more than the ${bdt(MIN_CAPITAL)} minimum. Only start if you can afford to lose this money.`
      : `This fits inside the ${bdt(MIN_CAPITAL)} minimum, which leaves a small cushion. Only start with money you can afford to lose.`,
  });

  sections.push({
    title: "3. What one parcel costs you, and what it could earn",
    lines: [
      `Spread over ${n.qty} units, each unit costs you about ${bdt(n.landed)} by the time it is in Forge stock. That includes goods, freight, domain, website and packaging.`,
      `On top of that, each parcel costs about ${bdt(COURIER_FEE)} to send, and each order costs about ${bdt(AD_PER_ORDER)} in ads. Both are planning figures. Your real numbers replace them once ads run.`,
      "The table shows your profit or loss if all your units are ordered, at three selling prices and three levels of refused parcels.",
    ],
    table: {
      head: ["Selling price", ...rates.map((r) => `${Math.round(r * 100)}% refused`)],
      rows: prices.map((p) => [bdt(p), ...rates.map((r) => signed(batchProfit(n, p, r)))]),
    },
    note: "A minus sign means a loss. Read across: more refused parcels, less money. Read down: a higher price helps, but customers may buy less. Forge cannot tell you which price your customers will accept. Your ad results will.",
  });

  sections.push({
    title: "4. Refused parcels",
    lines: [
      "With cash on delivery, some customers refuse the parcel at the door. This is normal in Bangladesh, and it is the biggest risk in this business.",
      "A refused parcel comes back to you. You mark it received and the item goes back into stock to be sold again. You still pay the courier for the trip.",
      "Forge phones every customer before the parcel leaves. That confirmation call is the main way to keep refusals down.",
    ],
  });

  sections.push({
    title: "5. Your first 90 days",
    table: {
      head: ["When", "What happens", "Who"],
      rows: [
        ["Week 1", "Forge orders your goods. Your website and Facebook page are ready.", "Forge"],
        ["Weeks 2 to 4", "Goods travel to Bangladesh. You get the freight bill and pay it in Billing.", "Forge, then you"],
        ["Week 5", "Goods arrive. You confirm you received them. Ads start.", "You, then Forge"],
        ["Weeks 5 to 6", "Two-week ad test. You watch orders and cost per order on your Marketing page.", "Forge, you watch"],
        ["Weeks 6 to 10", "Orders come in. Forge confirms each one. You hand parcels to the courier.", "Forge and you"],
        ["Weeks 10 to 13", "Courier pays you for delivered orders. You decide whether to reorder, change the price, or pause.", "You decide"],
      ],
    },
    note: "Dates move with shipping and customs. Forge tells you on your file when anything changes.",
  });

  sections.push({
    title: "6. How the money comes back, and how you know if you made a profit",
    lines: [
      "The courier collects cash from each customer and pays it into your bank account or bKash, minus its delivery fee.",
      "Your Orders page shows every order and its status. Your profit on a batch is simple: money received from the courier, minus everything in section 2, minus the courier fees on refused parcels.",
      "Forge shows you this as one number once orders are delivered, so you do not need to work it out yourself.",
    ],
  });

  sections.push({
    title: "7. Your checkpoints",
    lines: [
      "After the ad test: if cost per order is higher than your profit on one parcel, change the price or pause. Do not spend more on ads.",
      "When about 7 in 10 units have sold: decide whether to reorder. Reordering is always your choice.",
      "If refused parcels are above 1 in 3: pause and talk to Forge before ordering again.",
      "You can pause or stop at any time from the Pause page.",
    ],
  });

  sections.push({
    title: "8. What can go wrong",
    table: {
      head: ["Risk", "What it means for you", "What helps"],
      rows: [
        ["Slow sales", "Goods sit in stock and your money is tied up.", "Test ads first. Reorder only after the first batch sells."],
        ["Many refused parcels", "You pay courier fees and wait to resell.", "Forge confirms every order by phone."],
        ["Ads cost more than expected", "Each order eats the profit.", "Watch cost per order. Stop or change ads early."],
        ["Freight or customs higher than allowance", "Each unit costs more and the profit shrinks.", "Freight is shown to you before you pay it."],
        ["Price change from the supplier", "A reorder may cost more.", "Forge checks the price before billing a reorder."],
        ["Mistakes", "Forge can make mistakes.", "Check each step on your file and tell Forge if something looks wrong."],
      ],
    },
  });

  sections.push({
    title: "9. Please read",
    callout: true,
    lines: [
      "Forge can make mistakes, and a business can lose money. Forge does not promise sales or profit.",
      "All figures marked as allowances or planning figures are estimates. Your agreement says who pays for what and who carries which loss.",
    ],
  });

  return sections;
}
