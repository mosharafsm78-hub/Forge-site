// Forge's business plan, written from the owner's real file. Plain words, real numbers, honest risks.
// Every figure is either from the file (marked as such) or a planning assumption that says so.
import { formatBdt, usdToBdt } from "./ui.js?v=1791376428";

const FALLBACK_RATE = 122.76;
const AD_DAYS = 14;
const AD_PER_DAY = 600; // planning figure for the first test; the real daily budget is set with Forge
const VAT = 1.15; // 15% VAT on Facebook ad payments in Bangladesh
const FREIGHT_ALLOWANCE = 0.55; // of the product cost, used only until the real freight bill exists
const COURIER_FEE = 120; // planning figure per parcel; check the courier rate card
const AD_PER_ORDER = 380; // planning figure; the real number comes from your own ads
const MIN_CAPITAL = 30000;

// Plain, practical know-how for each kind of product. No numbers and no promises: it is guidance, not a forecast.
const KNOW = {
  footwear: {
    buyers: "Young men and women in towns and cities who buy shoes online after seeing them on Facebook. Many buy for work, college or daily walking.",
    show: ["Photos of the shoe from the side, the sole and on a foot, in daylight.", "A short video of someone walking in them.", "A size chart in centimetres, beside the photos."],
    asks: ["What sizes are there, and how do I measure?", "Is it the same as in the photo?", "Can I change the size if it does not fit?"],
    refuse: "Wrong size is the most common reason a pair comes back. A clear size chart and a confirmation call about size cut this the most.",
  },
  bags: {
    buyers: "Students, office workers and travellers. Women buy handbags, men and students buy backpacks, and many buy as gifts.",
    show: ["Photos of the bag open, closed and worn, so the size is clear.", "A hand or a laptop beside the bag for size.", "A video showing the zip, straps and inside pockets."],
    asks: ["How big is it? Will my laptop fit?", "Is the material strong?", "What colours are in stock?"],
    refuse: "A bag smaller or looser than the customer imagined. Show real size and say the material honestly.",
  },
  fragrance: {
    buyers: "Women and families who want a nicer home, and people buying gifts for weddings and festivals.",
    show: ["Photos in a real room, with soft light.", "A short video of the product being lit or used.", "The gift box and what comes inside."],
    asks: ["How long does the scent last?", "Is it strong?", "Is it safe around children?"],
    refuse: "A scent the customer did not expect. Describe the smell in simple words and say how strong it is.",
  },
  watches: {
    buyers: "Young men and women who want a smart look at a fair price, and gift buyers.",
    show: ["Close photos of the face, the strap and the clasp.", "The watch on a wrist, so the size is clear.", "A video showing the hands moving and the light on the face."],
    asks: ["Is it original?", "How long is the warranty?", "What is the strap made of?"],
    refuse: "A watch that looks different from the photo, or a size that feels wrong on the wrist. Show it on a wrist and give the case size.",
  },
  beauty: {
    buyers: "Women, and a growing number of men, who buy skin care and personal care tools online.",
    show: ["Clear photos of the product and its label.", "Before-use and in-use pictures that are honest.", "A short video showing how to use it."],
    asks: ["Is it safe for my skin?", "How do I use it?", "How long does one last?"],
    refuse: "A product the customer expected to work faster. Say honestly what to expect and how long it takes.",
  },
  fitness: {
    buyers: "People starting to exercise at home, and young people at gyms who want bands, mats and small equipment.",
    show: ["The item in use, with a simple exercise.", "A size and weight guide.", "A video of one easy workout."],
    asks: ["Is it strong enough for me?", "How big is the mat or band?", "Does it come with instructions?"],
    refuse: "Equipment that feels weaker or smaller than expected. Show real size and say who it suits.",
  },
};
const KNOW_DEFAULT = {
  buyers: "People in Bangladesh who buy this kind of product online after seeing it on Facebook.",
  show: ["Clear photos in daylight from several sides.", "A short video of the product in use.", "A simple size or detail guide."],
  asks: ["Is it the same as in the photo?", "How long does delivery take?", "Can I return it?"],
  refuse: "A product that looks different from the photo or feels smaller than expected. Show it honestly.",
};

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

  const k = KNOW[st.industryId] || KNOW_DEFAULT;
  sections.push({
    title: "Who buys this, and how to sell it",
    lines: [
      `Your likely buyers: ${k.buyers}`,
      "What to show on your page and in your ads:",
      ...k.show.map((x) => "• " + x),
      "Questions customers will ask. Forge answers them, and your page should answer them too:",
      ...k.asks.map((x) => "• " + x),
    ],
    note: "This is guidance from how online selling usually works. It does not promise that these customers will buy from you.",
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
      `For this product: ${k.refuse}`,
      "Forge phones every customer before the parcel leaves. That confirmation call is the main way to keep refusals down.",
    ],
  });

  sections.push({
    title: "5. Your first 90 days",
    table: {
      head: ["When", "What happens", "Who"],
      rows: [
        ["Week 1", "Forge orders your goods once you have read this plan. Your website and Facebook page are ready.", "Forge"],
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
    title: "Your weekly routine",
    lines: [
      "Monday: look at Marketing. How many orders came in, and what did each one cost?",
      "Tuesday: look at Orders. Are confirmed parcels waiting for you to hand to the courier?",
      "Midweek: post once on your Facebook page. Use the Post now button and Forge does it.",
      "Friday: look at Accounting. Is money coming in faster than it goes out?",
      "Any day a parcel comes back: mark it received in Returns so your stock stays correct.",
    ],
  });

  sections.push({
    title: "6. How the money comes back, and how you know if you made a profit",
    lines: [
      "The courier collects cash from each customer and pays it into your bank account or bKash, minus its delivery fee.",
      "Your Orders page shows every order and its status. Your profit on a batch is simple: money received from the courier, minus everything in \"What you pay, and when\", minus the courier fees on refused parcels.",
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

  // Number the middle sections in order. The first (at a glance) and last (please read) stay unnumbered.
  let n2 = 0;
  return sections.map((sec, i) => (i === 0 || i === sections.length - 1 ? { ...sec, title: sec.title.replace(/^\d+\.\s*/, "") } : { ...sec, title: `${++n2}. ${sec.title.replace(/^\d+\.\s*/, "")}` }));
}
