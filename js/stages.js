// The owner's journey. One list drives the stage panel, the gating and the progress rules,
// so the order of work is defined in exactly one place.
//   who:   who does the work at that stage
//   needs: stages that must be complete before this one opens
//   wait:  how long the Forge team takes once the owner has asked
//   built: the stage exists in this build
//
// Order of work: details, industry, product and name first. Then the signed agreement: without it nothing
// starts. Once it is in, three tracks open together (logo and page, packaging, domain). The slow one
// (packaging quote, 3 working days) should start first so the waits overlap. Billing needs all of them.
export const STAGES = [
  { id: "profile", label: "Your details", who: "you", built: true, needs: [] },
  { id: "industry", label: "Industry", who: "you", built: true, needs: ["profile"] },
  { id: "product", label: "Product", who: "you", built: true, needs: ["industry"] },
  { id: "name", label: "Business name", who: "you", built: true, needs: ["product"] },
  // The signed agreement comes first. Nothing the Forge team does, and nothing you pay for, starts without it.
  { id: "documents", label: "Documents and agreement", who: "you", built: true, needs: ["name"] },
  { id: "brand", label: "Logo and Facebook page", who: "team", built: true, needs: ["documents"], wait: "About 1 hour each" },
  { id: "packaging", label: "Packaging", who: "team", built: true, needs: ["documents"], wait: "Quote in 3 working days" },
  { id: "domain", label: "Domain", who: "you", built: true, needs: ["documents"] },
  { id: "billing", label: "Billing", who: "you", built: true, needs: ["brand", "packaging", "domain", "documents"] },
  { id: "plan", label: "Business plan", who: "team", built: true, needs: ["billing"] },
  { id: "freight", label: "Shipment and freight", who: "team", built: true, needs: ["billing"] },
  { id: "marketing", label: "Marketing", who: "team", built: true, needs: ["freight"] },
  { id: "orders", label: "Orders and customers", who: "team", built: true, ongoing: true, needs: ["marketing"] },
  { id: "returns", label: "Returns and stock", who: "you", built: true, ongoing: true, needs: ["marketing"] },
  { id: "reorder", label: "Reorder", who: "you", built: true, ongoing: true, needs: ["marketing"] },
];

// The stages before billing. The file summary opens when all of them are complete.
export const PREP = ["profile", "industry", "product", "name", "documents", "brand", "packaging", "domain"];

export const BUILT = STAGES.filter((s) => s.built).map((s) => s.id);

export const stageById = (id) => STAGES.find((s) => s.id === id) || null;

export function stageNumber(id) {
  const i = STAGES.findIndex((s) => s.id === id);
  return i < 0 ? 0 : i + 1;
}
