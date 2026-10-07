// The owner's journey. One list drives the stage panel, the gating and the progress rules,
// so the order of work is defined in exactly one place.
//   who:   who does the work at that stage ("you" or "forge")
//   phase: the group it belongs to in the stage list (see PHASES)
//   needs: stages that must be complete before this one opens
//   wait:  how long Forge takes once the owner has asked
//   built: the stage exists in this build
//
// Order of work: details, industry, product and name first. Then the signed agreement: without it nothing
// starts. Once it is in, three tracks open together (logo and page, packaging, domain). The slow one
// (packaging quote, 3 working days) should start first so the waits overlap. Billing needs all of them.
export const PHASES = [
  { id: "decide", label: "Decide", lede: "What you sell and what you call it." },
  { id: "setup", label: "Set up", lede: "Documents, then logo, packaging and domain side by side." },
  { id: "pay", label: "Pay and ship", lede: "Your first bill, your plan, and the goods on their way." },
  { id: "run", label: "Run", lede: "Orders, returns and reordering, week after week." },
];

export const STAGES = [
  { id: "profile", phase: "decide", label: "Your details", who: "you", built: true, needs: [] },
  { id: "industry", phase: "decide", label: "Industry", who: "you", built: true, needs: ["profile"] },
  { id: "product", phase: "decide", label: "Product", who: "you", built: true, needs: ["industry"] },
  { id: "name", phase: "decide", label: "Business name", who: "you", built: true, needs: ["product"] },
  // The signed agreement comes first. Nothing Forge does, and nothing you pay for, starts without it.
  { id: "documents", phase: "setup", label: "Documents and agreement", who: "you", built: true, needs: ["name"] },
  { id: "brand", phase: "setup", label: "Logo and Facebook page", who: "forge", built: true, needs: ["documents"], wait: "About 1 hour each" },
  { id: "packaging", phase: "setup", label: "Packaging", who: "forge", built: true, needs: ["documents"], wait: "Quote in 3 working days" },
  { id: "domain", phase: "setup", label: "Domain", who: "you", built: true, needs: ["documents"] },
  { id: "billing", phase: "pay", label: "Billing", who: "you", built: true, needs: ["brand", "packaging", "domain", "documents"] },
  { id: "plan", phase: "pay", label: "Business plan", who: "forge", built: true, needs: ["billing"] },
  { id: "freight", phase: "pay", label: "Shipment and freight", who: "forge", built: true, needs: ["billing"] },
  { id: "marketing", phase: "run", label: "Marketing", who: "forge", built: true, needs: ["freight"] },
  { id: "orders", phase: "run", label: "Orders and customers", who: "forge", built: true, ongoing: true, needs: ["marketing"] },
  { id: "returns", phase: "run", label: "Returns and stock", who: "you", built: true, ongoing: true, needs: ["marketing"] },
  { id: "reorder", phase: "run", label: "Reorder", who: "you", built: true, ongoing: true, needs: ["marketing"] },
];

// The stages before billing. The file summary opens when all of them are complete.
export const PREP = ["profile", "industry", "product", "name", "documents", "brand", "packaging", "domain"];

export const BUILT = STAGES.filter((s) => s.built).map((s) => s.id);

export const stageById = (id) => STAGES.find((s) => s.id === id) || null;

export function stageNumber(id) {
  const i = STAGES.findIndex((s) => s.id === id);
  return i < 0 ? 0 : i + 1;
}
