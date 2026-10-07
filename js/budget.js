// How many units an owner can safely order, from their own money.
// Every figure is a planning figure that says so. Real quotes replace them as soon as Forge has them.
import { usdToBdt } from "./ui.js?v=1791374586";

export const FALLBACK_RATE = 122.76;
export const FREIGHT_ALLOWANCE = 0.55; // of the goods cost, until the real freight bill exists
export const SETUP_ALLOWANCE = { domain: 1500, packaging: 4500, website: 3000 };
export const ADS_ALLOWANCE = Math.round(14 * 600 * 1.15); // 14 days of test ads with 15% VAT
export const BUFFER_SHARE = 0.1; // cash kept back for refused parcels and surprises

export function capitalOf(st) {
  const n = Number(String((st.profile && st.profile.capital) ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// unitUsd: supplier price of one unit. Returns the plan for this owner's money.
export function budgetFor(st, unitUsd) {
  const capital = capitalOf(st);
  const rate = st.fx && Number(st.fx.rate) > 0 ? Number(st.fx.rate) : FALLBACK_RATE;
  const setup = SETUP_ALLOWANCE.domain + SETUP_ALLOWANCE.packaging + SETUP_ALLOWANCE.website;
  const buffer = Math.round(capital * BUFFER_SHARE);
  const goodsBudget = capital - setup - ADS_ALLOWANCE - buffer;
  const unitBdt = usdToBdt(Number(unitUsd) || 0, rate) || 0;
  const landedUnit = unitBdt * (1 + FREIGHT_ALLOWANCE);
  const maxQty = capital > 0 && landedUnit > 0 ? Math.max(0, Math.floor(goodsBudget / landedUnit)) : null;
  const recommended = maxQty === null ? null : maxQty < 1 ? 0 : Math.max(1, Math.round(maxQty * 0.7));
  return { capital, rate, setup, ads: ADS_ALLOWANCE, buffer, goodsBudget, unitBdt, landedUnit, maxQty, recommended, usedRateFallback: !(st.fx && Number(st.fx.rate) > 0) };
}

// Money left if this many units are ordered (goods plus the freight allowance).
export function cashLeft(b, qty) {
  return Math.round(b.capital - b.setup - b.ads - b.landedUnit * qty);
}
