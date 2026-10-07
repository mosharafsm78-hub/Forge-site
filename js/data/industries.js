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
