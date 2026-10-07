// Calls to the Forge backend functions: supplier products, exchange rate and domain checks.
// Every call has a time limit, one retry for network problems, and returns clean data or a readable error.
import { CONFIG } from "./config.js";
import * as demo from "./demo.js";
import { plainText } from "./ui.js";

export class ApiError extends Error {
  constructor(message, kind) {
    super(message);
    this.kind = kind; // "network" | "timeout" | "server" | "client" | "bad_response"
  }
}

async function call(fn, { method = "GET", query, body } = {}, { retries = 1 } = {}) {
  const url = new URL(`${CONFIG.supabaseUrl}/functions/v1/${fn}`);
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== null && v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
    try {
      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          apikey: CONFIG.publishableKey,
          Authorization: "Bearer " + CONFIG.publishableKey,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new ApiError("The service sent a reply that could not be read.", "bad_response");
      }
      if (!response.ok) {
        throw new ApiError((data && data.error) || `The service returned an error (${response.status}).`, response.status >= 500 ? "server" : "client");
      }
      return data;
    } catch (error) {
      if (error instanceof ApiError) lastError = error;
      else if (error && error.name === "AbortError") lastError = new ApiError("The service took too long to answer.", "timeout");
      else lastError = new ApiError("Could not reach the service. Check your internet connection.", "network");
      if (lastError.kind === "client" || attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
    } finally {
      window.clearTimeout(timer);
    }
  }
  throw lastError;
}

const usable = (src) => typeof src === "string" && (src.startsWith("https://") || src.startsWith("data:image/"));

function normalizeProduct(p) {
  return {
    id: String(p.id || ""),
    sku: String(p.sku || ""),
    name: String(p.name || "Product"),
    image: usable(p.image) ? p.image : "",
    images: Array.isArray(p.images) ? p.images.filter(usable) : [],
    priceUsd: Number(p.priceUsd) || 0,
    category: String(p.category || ""),
    supplier: String(p.supplier || ""),
    inventory: Number(p.verifiedInventory || p.inventory) || 0,
    deliveryDays: p.deliveryDays ? String(p.deliveryDays) : "",
    freeShipping: Boolean(p.freeShipping),
  };
}

export async function searchProducts({ keyword, page = 1 }) {
  if (CONFIG.demo) return demo.searchProducts(keyword, page);
  const data = await call("cj-products", { query: { keyword, page, size: CONFIG.productPageSize } });
  if (!data || data.ok !== true || !Array.isArray(data.products)) {
    throw new ApiError((data && data.error) || "The supplier catalogue returned no usable data.", "bad_response");
  }
  const products = data.products.map(normalizeProduct).filter((p) => p.id && p.image && p.priceUsd > 0);
  return { products, total: Number(data.total) || products.length, pageCount: Number(data.pageCount) || 1, page, fetchedAt: data.fetchedAt || "" };
}

export async function productDetail(id) {
  if (CONFIG.demo) return demo.productDetail(id);
  const data = await call("cj-products", { query: { detailPid: id } });
  if (!data || data.ok !== true || !data.product) {
    throw new ApiError((data && data.error) || "The product details could not be loaded.", "bad_response");
  }
  const p = data.product;
  return {
    description: plainText(p.description),
    weight: p.weight ? String(p.weight) : "",
    material: p.material ? String(p.material) : "",
    images: Array.isArray(p.images) ? p.images.filter(usable).slice(0, 8) : [],
  };
}

export async function getFxRate() {
  if (CONFIG.demo) return demo.getFxRate();
  const data = await call("fx-rate");
  const rate = Number(data && data.rate);
  if (!data || data.ok !== true || !Number.isFinite(rate) || rate < 50 || rate > 300) {
    throw new ApiError("The exchange rate is not available right now.", "bad_response");
  }
  return { rate, fetchedAt: data.fetchedAt || "", source: data.source || "" };
}

// Returns { exact, results: [{ domain, status, priceAmount, priceCurrency, renewalPrice, message }] }
export async function checkDomains(domains) {
  if (CONFIG.demo) return demo.checkDomains(domains);
  const data = await call("domain-availability", { method: "POST", body: { domains } });
  if (!data || !Array.isArray(data.results)) {
    throw new ApiError((data && data.error) || "The domain check returned no usable data.", "bad_response");
  }
  return { exact: Boolean(data.exact), results: data.results };
}
