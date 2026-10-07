// Small helpers shared by every screen.
// Elements are built with createElement and textContent only. Supplier text never goes through innerHTML.

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "for") el.htmlFor = value;
    else if (key === "style") el.setAttribute("style", value);
    else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === "value" || key === "checked" || key === "disabled" || key === "hidden" || key === "textContent") el[key] = value;
    else el.setAttribute(key, value === true ? "" : String(value));
  }
  append(el, kids);
  return el;
}

export function append(el, kids) {
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export function clear(el) {
  el.replaceChildren();
  return el;
}

// ---------- Money ----------
export function formatBdt(amount) {
  if (!Number.isFinite(amount)) return "";
  let text;
  try {
    text = Math.round(amount).toLocaleString("en-BD");
  } catch {
    text = String(Math.round(amount));
  }
  return "৳" + text;
}

export function formatUsd(amount) {
  if (!Number.isFinite(amount)) return "";
  return "$" + amount.toFixed(2);
}

// Estimate in taka, rounded up. Returns null when no exchange rate is available.
export function usdToBdt(usd, rate) {
  if (!Number.isFinite(usd) || !Number.isFinite(rate) || rate <= 0) return null;
  return Math.ceil(usd * rate);
}

// ---------- Announcements for screen readers ----------
export function announce(message) {
  const region = document.getElementById("live");
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = message;
  }, 30);
}

// Turn supplier HTML into plain text. Never inserted as markup.
export function plainText(html, maxLength = 700) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  doc.querySelectorAll("script,style").forEach((n) => n.remove());
  const text = (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + "…" : text;
}

export function debounce(fn, wait) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}
