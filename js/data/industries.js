// Starting list taken from the old Forge prototype. Replace with the full niche list.
// "keywords" are the search words sent to the supplier catalogue. The first one loads by default.
export const INDUSTRIES = [
  {
    id: "footwear",
    name: "Urban footwear",
    blurb: "Sneakers, sandals and everyday shoes.",
    keywords: ["men sneakers", "women sandals", "casual shoes"],
  },
  {
    id: "bags",
    name: "Bags and carry goods",
    blurb: "Handbags, backpacks and travel bags.",
    keywords: ["women handbags", "backpack", "crossbody bag"],
  },
  {
    id: "fragrance",
    name: "Home fragrance",
    blurb: "Candles, diffusers and gift sets.",
    keywords: ["home fragrance diffuser", "scented candle", "incense holder"],
  },
  {
    id: "watches",
    name: "Watches",
    blurb: "Men's and women's everyday watches.",
    keywords: ["men watches", "women watches", "smart watch"],
  },
  {
    id: "beauty",
    name: "Everyday beauty",
    blurb: "Skin care and personal care tools.",
    keywords: ["skin care", "hair care", "makeup brush"],
  },
  {
    id: "fitness",
    name: "Fitness essentials",
    blurb: "Bands, mats and home workout gear.",
    keywords: ["resistance bands", "yoga mat", "fitness accessories"],
  },
];

export function industryById(id) {
  return INDUSTRIES.find((i) => i.id === id) || null;
}

// Plain warnings shown when an owner looks at a product. They are guidance, not legal advice.
const INDUSTRY_RISK = {
  beauty: "Skin care and cosmetics may need approval to sell or import in Bangladesh (for example BSTI or DGDA). Never say a product treats, cures or removes anything. Ask Forge before you order.",
  watches: "Smart watches and anything with a battery can be held at customs and may need approval. Ask Forge before you order.",
  footwear: "Wrong size is the most common reason parcels come back. Give a clear size chart and plan for some returns.",
  fitness: "Heavy or bulky items cost more to ship and return. Check the weight before you order.",
  fragrance: "Candles, oils and liquids can be restricted in air freight. Ask Forge before you order.",
};
const NAME_RISK = [
  [/\b(battery|batteries|charger|power ?bank|earbud|earphone|speaker|bluetooth|led|lamp|trimmer|shaver|smart ?watch)\b/i, "Electronics and batteries can be held at customs and may need approval. Ask Forge before you order."],
  [/\b(cream|serum|lotion|whitening|acne|pimple|patch|mask|oil|perfume|spray)\b/i, "This looks like a skin care or personal care product. It may need approval (BSTI or DGDA), and you must not claim it treats or removes anything. Ask Forge before you order."],
  [/\b(knife|blade|pepper|taser|gun|laser)\b/i, "Some products like this are restricted. Ask Forge before you order."],
];
export function productRisks(industryId, productName) {
  const out = [];
  if (INDUSTRY_RISK[industryId]) out.push(INDUSTRY_RISK[industryId]);
  NAME_RISK.forEach(([re, text], i) => { if (i === 1 && industryId === "beauty") return; if (re.test(String(productName || "")) && !out.includes(text)) out.push(text); });
  return out;
}
