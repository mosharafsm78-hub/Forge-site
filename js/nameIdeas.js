// Free name ideas: built from the product, the industry and the owner's first name, then checked for a free .com.
import { slugify, validateBusinessName } from "./rules.js?v=1791345812";
import { checkDomains } from "./api.js?v=1791345812";
import { CONFIG } from "./config.js?v=1791345812";
import { loadBackend } from "./backend.js?v=1791345812";

const WORDS = {
  footwear: { core: ["Step", "Stride", "Sole", "Tread", "Pace", "Kick", "Walk"], tail: ["Footwear", "Shoes", "Steps", "Studio", "House"] },
  bags: { core: ["Carry", "Pack", "Tote", "Haul", "Wander", "Satchel"], tail: ["Bags", "Carry", "Co", "Studio", "House"] },
  fragrance: { core: ["Glow", "Scent", "Ember", "Bloom", "Calm", "Aura"], tail: ["Home", "Candles", "Scents", "Studio", "House"] },
  watches: { core: ["Time", "Tick", "Hour", "Dial", "Chrono", "Minute"], tail: ["Watches", "Time", "Co", "Studio", "House"] },
  beauty: { core: ["Glow", "Dew", "Bloom", "Pure", "Silk", "Radiant"], tail: ["Beauty", "Care", "Skin", "Studio", "House"] },
  fitness: { core: ["Flex", "Move", "Fit", "Rise", "Peak", "Strong"], tail: ["Fitness", "Gear", "Co", "Studio", "House"] },
};
const GENERIC = { core: ["Nova", "Prime", "Urban", "Fresh", "Bright", "Bold"], tail: ["Store", "Co", "Studio", "House", "Mart"] };
const PLACES = ["Dhaka", "Chattogram", "Padma", "Meghna", "Surma"];
// Short Bangla words written in English letters, to make names that are easier to own.
const BANGLA = ["Notun", "Shera", "Sohoj", "Ujjal", "Bondhu", "Probaho", "Chalo", "Shobuj", "Aloy", "Moner"];

const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const pick = (arr, n, seed) => arr.map((x, i) => [x, (i * 7 + seed) % arr.length]).sort((a, b) => a[1] - b[1]).slice(0, n).map((x) => x[0]);

export function makeCandidates({ industryId, productName, ownerFirst, seed = 0 }) {
  const w = WORDS[industryId] || GENERIC;
  const out = new Set();
  const first = ownerFirst && /^[A-Za-z]{3,12}$/.test(ownerFirst) ? cap(ownerFirst) : "";
  const prodWord = String(productName || "").split(/\s+/).map((x) => x.replace(/[^A-Za-z]/g, "")).find((x) => x.length >= 5 && x.length <= 10);
  for (const p of pick(PLACES, 2, seed)) out.add(`${p} ${pick(w.tail, 1, seed + 2)[0]}`);
  for (const b of pick(BANGLA, 5, seed)) for (const c of pick(w.core, 2, seed + 2)) out.add(`${b} ${c}`);
  for (const c of pick(w.core, 3, seed + 4)) out.add(`${c}ly`);
  if (first) out.add(`${first} ${pick(w.tail, 1, seed)[0]}`);
  if (prodWord) out.add(`${cap(prodWord)} ${pick(w.tail, 1, seed + 3)[0]}`);
  for (const c of pick(w.core, 4, seed)) for (const t of pick(w.tail, 2, seed + 1)) if (!t.toLowerCase().includes(c.toLowerCase()) && !c.toLowerCase().includes(t.toLowerCase())) out.add(`${c} ${t}`);
  return [...out].filter((n) => !validateBusinessName(n));
}

// Returns up to `want` names whose .com is free (or could not be checked, marked unchecked).
// Real language-model names when Forge's server function is switched on. Returns [] if it is not, so the word-list names still work.
async function modelNames(opts) {
  if (CONFIG.demo) return [];
  try {
    const b = await loadBackend();
    if (!b.forgeAi) return [];
    const { data, error } = await b.forgeAi("names", { facts: { industry: opts.industryName || opts.industryId, product: opts.productName, owner: opts.ownerFirst, avoid: opts.avoid || [], style: opts.style } });
    if (error || !data || !Array.isArray(data.names)) return [];
    return data.names.filter((n) => !validateBusinessName(n));
  } catch {
    return [];
  }
}

export async function nameIdeas(opts, want = 6) {
  const fromModel = await modelNames(opts);
  const cands = [...new Set([...fromModel, ...makeCandidates(opts)])].slice(0, 28);
  const status = new Map();
  for (let i = 0; i < cands.length; i += 14) {
    const part = cands.slice(i, i + 14).map((n) => slugify(n) + ".com");
    try {
      const r = await checkDomains(part);
      for (const item of r.results) status.set(String(item.domain).toLowerCase(), item.status);
    } catch {
      // names are still offered, without a domain check
    }
  }
  const st = (n) => status.get(slugify(n) + ".com");
  const free = cands.filter((n) => st(n) === "available").map((n) => ({ name: n, com: true }));
  const unknown = cands.filter((n) => st(n) !== "available" && st(n) !== "taken").map((n) => ({ name: n, com: false }));
  const taken = cands.filter((n) => st(n) === "taken").map((n) => ({ name: n, com: false }));
  return [...free, ...unknown, ...taken].slice(0, want);
}
