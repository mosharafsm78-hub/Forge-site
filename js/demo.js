// Sample data for layout previews only. It is never used on the live site.
// Everything here is marked "Sample" so it cannot be mistaken for a real product, price or domain.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const HUES = [160, 28, 205, 340, 45, 95];
const TOTAL = 40;

function placeholder(i, label = "Sample") {
  const hue = HUES[i % HUES.length];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">` +
    `<rect width="400" height="400" fill="hsl(${hue} 35% 88%)"/>` +
    `<rect x="110" y="110" width="180" height="170" rx="14" fill="hsl(${hue} 30% 70%)"/>` +
    `<text x="200" y="335" text-anchor="middle" font-family="sans-serif" font-size="22" fill="hsl(${hue} 30% 28%)">${label}</text>` +
    `</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function sampleProduct(i) {
  return {
    id: "sample-" + i,
    sku: "SAMPLE-" + String(i + 1).padStart(3, "0"),
    name: "Sample product " + (i + 1) + " (layout preview)",
    image: placeholder(i),
    images: [],
    priceUsd: Number((3.4 + ((i * 1.37) % 14)).toFixed(2)),
    category: "Sample category",
    supplier: "Sample supplier",
    inventory: 120 + ((i * 53) % 900),
    deliveryDays: ["7-12", "10-15", "12-18"][i % 3],
    freeShipping: false,
  };
}

export async function searchProducts(keyword, page = 1) {
  await sleep(450);
  const size = 24;
  const start = (page - 1) * size;
  const products = Array.from({ length: Math.max(0, Math.min(size, TOTAL - start)) }, (_, k) => sampleProduct(start + k));
  return { products, total: TOTAL, pageCount: Math.ceil(TOTAL / size), page, fetchedAt: new Date().toISOString() };
}

export async function productDetail(id) {
  await sleep(350);
  const i = Number(String(id).replace("sample-", "")) || 0;
  return {
    description:
      "Sample text for the layout preview only. On the live site this area shows the supplier's description of the product.",
    weight: "0.45",
    material: "Sample material",
    images: [placeholder(i, "Sample 1"), placeholder(i + 1, "Sample 2"), placeholder(i + 2, "Sample 3")],
  };
}

export async function getFxRate() {
  await sleep(150);
  return { rate: 100, fetchedAt: new Date().toISOString(), source: "Sample rate" };
}

export async function checkDomains(domains) {
  await sleep(500);
  const prices = { com: 10.44, net: 11.95, co: 25, store: 4.5, shop: 7 };
  return {
    exact: true,
    results: domains.map((domain) => {
      const tld = domain.split(".").pop();
      if (tld === "com") return { domain, status: "taken" };
      return {
        domain,
        status: "available",
        priceAmount: prices[tld] || 12,
        priceCurrency: "USD",
        renewalPrice: (prices[tld] || 12) + 2,
      };
    }),
  };
}
