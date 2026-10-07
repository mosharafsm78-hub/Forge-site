// Logo types the owner can ask for, the Forge suggestion per industry, and sample designs for the preview.
// Real designs come from the Forge team as image files (option.src). Sample designs are drawn here so the
// preview can show the choosing step. They are always labelled as samples.

export const LOGO_TYPES = [
  { id: "wordmark", label: "Name only", help: "Your business name in a distinctive style." },
  { id: "monogram", label: "Letters in a shape", help: "Your initials inside a circle or square." },
  { id: "symbol", label: "Symbol and name", help: "A small mark with your name beneath." },
  { id: "badge", label: "Badge", help: "Your name inside a framed emblem." },
  { id: "stacked", label: "Stacked", help: "Large initials over your full name." },
  { id: "minimal", label: "Simple and light", help: "A quiet lowercase name with one accent." },
];

// What the Forge team suggests for each industry. The owner can change it.
export const LOGO_SUGGESTION = {
  footwear: ["symbol", "badge", "wordmark"],
  bags: ["monogram", "minimal"],
  fragrance: ["minimal", "monogram"],
  watches: ["badge", "monogram"],
  beauty: ["minimal", "symbol"],
  fitness: ["badge", "wordmark"],
};
export const suggestionFor = (industryId) => LOGO_SUGGESTION[industryId] || ["wordmark", "monogram"];

export const LOGO_COLORS = [
  { id: "team", label: "Let Forge choose", a: null },
  { id: "black", label: "Black", a: "#16181a", b: "#8a8f94" },
  { id: "navy", label: "Navy", a: "#18356b", b: "#c8962e" },
  { id: "green", label: "Green", a: "#1b6b4a", b: "#d3a04b" },
  { id: "red", label: "Red", a: "#a8231f", b: "#2b2b2b" },
  { id: "brown", label: "Brown", a: "#6b4328", b: "#b98a52" },
];

const FALLBACK_PALETTES = LOGO_COLORS.filter((c) => c.a);

// The six sample options: the owner's chosen types first, then the others, so the choice is always varied.
export function sampleOptions(types, colorId) {
  const order = [...types, ...LOGO_TYPES.map((t) => t.id).filter((id) => !types.includes(id))].slice(0, 6);
  const fixed = FALLBACK_PALETTES.find((c) => c.id === colorId);
  return order.map((type, i) => {
    const p = fixed || FALLBACK_PALETTES[(i * 2 + 1) % FALLBACK_PALETTES.length];
    return { id: "sample-" + (i + 1), type, a: p.a, b: p.b, sample: true };
  });
}

const NS = "http://www.w3.org/2000/svg";
function node(tag, attrs, text) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = text;
  return el;
}

export function initials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "F").slice(0, 2);
  return letters.toUpperCase();
}

// A sample logo as an SVG element. Text is set with textContent only.
export function sampleLogo(option, businessName) {
  const name = String(businessName || "Your name").trim();
  const svg = node("svg", { viewBox: "0 0 240 160", role: "img", "aria-label": `Sample logo, ${option.type}, for ${name}` });
  const font = "Bricolage Grotesque, IBM Plex Sans, system-ui, sans-serif";
  const fit = (chars, max, min) => Math.max(min, Math.min(max, Math.floor(210 / (Math.max(chars, 1) * 0.58))));
  const text = (content, attrs) => node("text", { "text-anchor": "middle", "font-family": font, ...attrs }, content);
  svg.append(node("rect", { width: 240, height: 160, rx: 8, fill: "#ffffff" }));

  switch (option.type) {
    case "monogram":
      svg.append(node("circle", { cx: 120, cy: 62, r: 40, fill: option.a }));
      svg.append(text(initials(name), { x: 120, y: 74, "font-size": 34, "font-weight": 700, fill: "#ffffff" }));
      svg.append(text(name, { x: 120, y: 134, "font-size": fit(name.length, 18, 11), "font-weight": 600, fill: option.a }));
      break;
    case "symbol":
      svg.append(node("rect", { x: 98, y: 22, width: 44, height: 44, rx: 6, fill: option.a, transform: "rotate(45 120 44)" }));
      svg.append(node("circle", { cx: 120, cy: 44, r: 9, fill: option.b }));
      svg.append(text(name, { x: 120, y: 122, "font-size": fit(name.length, 24, 12), "font-weight": 700, fill: option.a }));
      break;
    case "badge":
      svg.append(node("rect", { x: 22, y: 30, width: 196, height: 100, rx: 10, fill: "none", stroke: option.a, "stroke-width": 3 }));
      svg.append(node("rect", { x: 30, y: 38, width: 180, height: 84, rx: 6, fill: "none", stroke: option.b, "stroke-width": 1.2 }));
      svg.append(text(name.toUpperCase(), { x: 120, y: 86, "font-size": fit(Math.round(name.length * 1.45), 20, 9), "font-weight": 700, "letter-spacing": 1, fill: option.a }));
      break;
    case "stacked":
      svg.append(text(initials(name), { x: 120, y: 88, "font-size": 58, "font-weight": 800, fill: option.a }));
      svg.append(node("rect", { x: 80, y: 100, width: 80, height: 3, fill: option.b }));
      svg.append(text(name, { x: 120, y: 128, "font-size": fit(name.length, 15, 10), "font-weight": 500, "letter-spacing": 0.8, fill: option.a }));
      break;
    case "minimal": {
      const t = text("", { x: 120, y: 90, "font-size": fit(name.length + 1, 34, 14), "font-weight": 500, fill: option.a });
      t.append(document.createTextNode(name.toLowerCase()));
      t.append(node("tspan", { fill: option.b }, "."));
      svg.append(t);
      break;
    }
    default: // wordmark
      svg.append(text(name, { x: 120, y: 88, "font-size": fit(name.length, 36, 14), "font-weight": 800, fill: option.a }));
      svg.append(node("rect", { x: 96, y: 102, width: 48, height: 5, rx: 2, fill: option.b }));
  }
  return svg;
}

// Shows a delivered logo: the team's image file, or a drawn sample.
export function logoView(option, businessName) {
  if (option.src) {
    const img = document.createElement("img");
    img.src = option.src;
    img.alt = "Logo option";
    return img;
  }
  return sampleLogo(option, businessName);
}
