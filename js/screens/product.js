import { h, formatUsd, formatBdt, usdToBdt, announce } from "../ui.js?v=1791376102";
import { getState, update, subscribe } from "../store.js?v=1791376102";
import { industryById, productRisks } from "../data/industries.js?v=1791376102";
import { budgetFor, cashLeft } from "../budget.js?v=1791376102";
import { searchProducts, productDetail } from "../api.js?v=1791376102";
import { head, foot } from "./common.js?v=1791376102";

function priceLines(usd, fx) {
  const bdt = usdToBdt(usd, fx && fx.rate);
  return { usd: formatUsd(usd), bdt: bdt === null ? "" : "about " + formatBdt(bdt) };
}

export default {
  id: "product",
  stage: "product",
  title: "Product",
  render({ go }) {
    const industry = industryById(getState().industryId);
    let keyword = industry ? industry.keywords[0] : "";
    let page = 1;
    let pageCount = 1;
    let items = [];
    let loading = false;
    let error = "";
    let requestId = 0;
    let lastLoadAt = 0;
    let lastRate = getState().fx ? getState().fx.rate : null;

    const chosenSlot = h("div");
    const results = h("div", { "aria-live": "polite" });
    const search = h("input", { class: "input", id: "f-search", type: "search", value: keyword, placeholder: "Search products, for example men sneakers", "aria-label": "Search products" });
    const chipsEl = h("div", { class: "chips", role: "group", "aria-label": "Suggested searches" });
    const nextBtn = h("button", { type: "button", class: "btn btn--primary", onclick: () => go("name") }, "Continue");

    // ---------- chosen product bar ----------
    function renderChosen() {
      const st = getState();
      chosenSlot.replaceChildren();
      if (!st.product) {
        nextBtn.disabled = true;
        return;
      }
      nextBtn.disabled = false;
      const p = st.product;
      const total = priceLines(p.priceUsd * st.qty, st.fx);
      chosenSlot.append(
        h(
          "div",
          { class: "chosen-bar" },
          h("img", { src: p.image, alt: "", width: 56, height: 56 }),
          h("div", null, h("div", { class: "chosen-bar__name" }, p.name), h("div", { class: "chosen-bar__meta num" }, `${st.qty} units, ${total.usd}${total.bdt ? ", " + total.bdt : ""}`)),
          h("button", { type: "button", class: "btn btn--small", onclick: () => openDetail(p) }, "Change quantity")
        )
      );
    }

    // ---------- chips ----------
    function renderChips() {
      chipsEl.replaceChildren(
        ...(industry ? industry.keywords : []).map((k) =>
          h("button", { type: "button", class: "chip", "aria-pressed": k === keyword ? "true" : "false", onclick: () => runSearch(k) }, k)
        )
      );
    }

    // ---------- grid ----------
    function skeletonCards(n) {
      return Array.from({ length: n }, () =>
        h("div", { class: "skeleton-card", "aria-hidden": "true" }, h("div", { class: "skeleton" }), h("div", { class: "skeleton-card__lines" }, h("div", { class: "skeleton skeleton-line" }), h("div", { class: "skeleton skeleton-line skeleton-line--short" })))
      );
    }

    function renderResults() {
      const st = getState();
      results.replaceChildren();
      if (loading && !items.length) {
        results.append(h("div", { class: "product-grid" }, skeletonCards(8)));
        return;
      }
      if (error && !items.length) {
        results.append(
          h("div", { class: "notice notice--error" }, h("b", null, "Products could not be loaded."), h("p", null, error), h("button", { type: "button", class: "btn", onclick: () => load(true) }, "Try again"))
        );
        return;
      }
      if (!items.length) {
        results.append(h("div", { class: "notice notice--info" }, h("b", null, `No products found for "${keyword}".`), h("p", null, "Try a different word, or choose one of the suggested searches.")));
        return;
      }
      const grid = h(
        "div",
        { class: "product-grid" },
        items.map((p) => {
          const price = priceLines(p.priceUsd, st.fx);
          return h(
            "button",
            { type: "button", class: "product", "aria-pressed": st.product && st.product.id === p.id ? "true" : "false", onclick: () => openDetail(p) },
            h("img", { class: "product__img", src: p.image, alt: p.name, loading: "lazy", width: 400, height: 400 }),
            h(
              "span",
              { class: "product__body" },
              h("span", { class: "product__name" }, p.name),
              h("span", { class: "product__price num" }, price.usd, " ", h("span", { class: "product__bdt" }, "each")),
              price.bdt ? h("span", { class: "product__bdt num" }, price.bdt) : null,
              h("span", { class: "product__facts" }, p.inventory > 0 ? `${p.inventory.toLocaleString("en-US")} in stock` : "Stock checked before ordering")
            )
          );
        })
      );
      results.append(grid);
      if (error) results.append(h("div", { class: "notice notice--error", style: "margin-top:16px" }, h("p", null, error)));
      if (page < pageCount) {
        results.append(h("div", { class: "more" }, h("button", { type: "button", class: "btn", disabled: loading, onclick: () => load(false) }, loading ? "Loading" : "Show more products")));
      }
    }

    async function load(reset) {
      const mine = ++requestId;
      if (reset) {
        page = 1;
        items = [];
      } else {
        page += 1;
      }
      loading = true;
      error = "";
      renderResults();
      try {
        const r = await searchProducts({ keyword, page });
        if (mine !== requestId) return;
        const seen = new Set(items.map((p) => p.id));
        items = items.concat(r.products.filter((p) => !seen.has(p.id)));
        pageCount = r.pageCount;
      } catch (e) {
        if (mine !== requestId) return;
        error = e.message || "The supplier catalogue could not be reached.";
        if (!reset) page -= 1;
      }
      loading = false;
      lastLoadAt = Date.now();
      renderResults();
      if (reset && items.length) announce(`${items.length} products shown.`);
    }

    function runSearch(k) {
      const q = String(k || "").trim();
      if (!q) return;
      keyword = q;
      search.value = q;
      renderChips();
      load(true);
    }

    // ---------- detail dialog ----------
    function openDetail(p) {
      const st = getState();
      const same = st.product && st.product.id === p.id;
      const inventoryMax = p.inventory > 0 ? p.inventory : 9999;
      const bud = budgetFor(st, p.priceUsd);
      const hasMoney = bud.capital > 0 && bud.maxQty !== null;
      const tooBig = hasMoney && bud.maxQty < 1; // even one unit is more than this owner's money supports
      const maxQty = hasMoney ? Math.max(1, Math.min(inventoryMax, bud.maxQty)) : inventoryMax;
      const rec = hasMoney ? Math.max(1, Math.round(maxQty * 0.7)) : 10;
      let qty = same ? Math.min(st.qty, maxQty) : Math.min(rec, maxQty);
      const moneyBox = h("div", { class: "notice notice--info", style: "margin:12px 0" });
      const risks = productRisks(st.industryId, p.name);
      const risksBox = risks.length ? h("div", { class: "notice notice--warn", style: "margin:12px 0" }, h("p", null, h("b", null, "Before you choose. ")), risks.map((r) => h("p", null, r))) : null;

      const hero = h("img", { class: "dialog__hero", src: p.image, alt: p.name });
      const thumbs = h("div", { class: "dialog__thumbs" });
      const desc = h("div", { class: "desc" }, h("div", { class: "skeleton skeleton-line", style: "margin-bottom:8px" }), h("div", { class: "skeleton skeleton-line skeleton-line--short" }));
      const costEl = h("p", { class: "num", style: "font-weight:600" });
      const qtyInput = h("input", { type: "number", id: "f-qty", min: 1, max: maxQty, value: qty, inputmode: "numeric", "aria-label": "Quantity" });

      const dialog = h("dialog", { class: "dialog", "aria-labelledby": "dlg-title" });

      const setQty = (n) => {
        const v = Math.max(1, Math.min(maxQty, Math.floor(Number(n)) || 1));
        qty = v;
        qtyInput.value = String(v);
        const t = priceLines(p.priceUsd * v, getState().fx);
        costEl.textContent = `Product cost: ${t.usd}${t.bdt ? ", " + t.bdt : ""}`;
        paintMoney();
      };
      const paintMoney = () => {
        if (!hasMoney) { moneyBox.replaceChildren(h("p", null, "Enter your available money on the details page so Forge can check how much you can safely order.")); return; }
        const tk = (n) => "৳" + Math.round(n).toLocaleString("en-US");
        if (tooBig) { moneyBox.className = "notice notice--error"; moneyBox.replaceChildren(h("p", null, h("b", null, "This product does not fit your money. "), `One unit with freight is about ${tk(bud.landedUnit)}, and after setup, ads and a cash reserve you have about ${tk(Math.max(0, bud.goodsBudget))} left for goods. Choose a cheaper product.`)); return; }
        moneyBox.className = "notice notice--info";
        const left = cashLeft(bud, qty);
        moneyBox.replaceChildren(
          h("p", null, h("b", null, "Your money check")),
          h("p", { class: "num" }, `Your money ${tk(bud.capital)}. Set aside for domain, packaging and website setup about ${tk(bud.setup)}, for 14 days of test ads about ${tk(bud.ads)}, and ${tk(bud.buffer)} kept back for refused parcels and surprises. That leaves about ${tk(Math.max(0, bud.goodsBudget))} for goods and freight.`),
          h("p", { class: "num" }, `Most you can order: ${maxQty.toLocaleString("en-US")} units. Forge suggests starting with about ${rec}.`),
          h("p", { class: "num", style: "font-weight:600" }, `With ${qty} units you keep about ${tk(left)} in cash.`),
          h("p", { class: "field__help" }, "These are planning figures. Your real bill and real freight replace them. Forge does not promise sales or profit.")
        );
      };
      qtyInput.addEventListener("change", () => setQty(qtyInput.value));
      qtyInput.addEventListener("input", () => {
        if (qtyInput.value !== "") setQty(qtyInput.value);
      });
      setQty(qty);

      const unit = priceLines(p.priceUsd, getState().fx);
      const choose = h(
        "button",
        {
          type: "button",
          class: "btn btn--primary",
          onclick: () => {
            setQty(qtyInput.value);
            update((s) => {
              s.product = { id: p.id, name: p.name, image: p.image, priceUsd: p.priceUsd, category: p.category, supplier: p.supplier, inventory: p.inventory, industryId: s.industryId };
              s.qty = qty;
            });
            dialog.close();
            renderChosen();
            renderResults();
            announce(`${p.name} chosen, ${qty} units.`);
          },
        },
        same ? "Save quantity" : "Choose this product"
      );
      if (tooBig) { choose.disabled = true; choose.setAttribute("aria-disabled", "true"); }

      dialog.append(
        h(
          "div",
          { class: "dialog__inner" },
          h("div", { class: "dialog__media" }, hero, thumbs),
          h(
            "div",
            { class: "dialog__body" },
            h("h2", { id: "dlg-title" }, p.name),
            h("p", { class: "product__price num" }, unit.usd, " each", unit.bdt ? h("span", { class: "product__bdt" }, ", " + unit.bdt) : null),
            h(
              "dl",
              { class: "facts" },
              h("dt", null, "In stock"), h("dd", { class: "num" }, p.inventory > 0 ? p.inventory.toLocaleString("en-US") : "Checked before ordering"),
              p.category ? [h("dt", null, "Category"), h("dd", null, p.category)] : null,
              null
            ),
            desc,
            h("div", { class: "field" }, h("label", { class: "field__label", for: "f-qty" }, "How many units?"), h("div", { class: "qty" }, h("button", { type: "button", "aria-label": "Fewer", onclick: () => setQty(qty - 1) }, "−"), qtyInput, h("button", { type: "button", "aria-label": "More", onclick: () => setQty(qty + 1) }, "+")), h("p", { class: "field__help" }, "Start small. You can reorder when this batch sells.")),
            costEl,
            moneyBox,
            risksBox,
            h("p", { class: "field__help" }, "Freight, duty and clearance are billed when your goods reach Bangladesh, at the actual cost."),
            h("div", { style: "display:flex;gap:10px;flex-wrap:wrap" }, choose, h("button", { type: "button", class: "btn", onclick: () => dialog.close() }, "Close"))
          )
        )
      );
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) dialog.close();
      });
      dialog.addEventListener("close", () => dialog.remove());
      root.append(dialog);
      dialog.showModal();

      productDetail(p.id)
        .then((d) => {
          if (!dialog.isConnected) return;
          desc.replaceChildren(d.description || "No description from the supplier.");
          const pics = [p.image, ...d.images].filter((src, i, all) => src && all.indexOf(src) === i).slice(0, 6);
          if (pics.length > 1) {
            thumbs.replaceChildren(
              ...pics.map((src, i) =>
                h("button", { type: "button", class: "dialog__thumb", "aria-label": "Picture " + (i + 1), "aria-current": i === 0 ? "true" : "false", onclick: (e) => {
                  hero.src = src;
                  thumbs.querySelectorAll(".dialog__thumb").forEach((b) => b.setAttribute("aria-current", "false"));
                  e.currentTarget.setAttribute("aria-current", "true");
                } }, h("img", { src, alt: "" }))
              )
            );
          }
        })
        .catch(() => {
          if (dialog.isConnected) desc.replaceChildren("The description could not be loaded. You can still choose this product.");
        });
    }

    // ---------- page ----------
    const form = h("form", { class: "searchbar", role: "search", onsubmit: (e) => {
      e.preventDefault();
      runSearch(search.value);
    } }, search, h("button", { type: "submit", class: "btn" }, "Search"), h("button", { type: "button", class: "btn", title: "Load the latest products and prices", onclick: () => { load(true); announce("Refreshing products."); } }, "Refresh"));

    const root = h(
      "section",
      { class: "screen screen--wide" },
      head("Choose your product", "Prices come from the supplier's live catalogue in US dollars, with an estimate in taka. You choose one product and how many to start with."),
      industry ? null : h("div", { class: "notice notice--error" }, h("p", null, "Choose an industry first."), h("a", { class: "btn", href: "#/industry" }, "Go to industry")),
      chosenSlot,
      form,
      chipsEl,
      results,
      foot({ back: "industry", next: nextBtn, note: "Freight and duty are billed when the goods arrive." })
    );

    // Refresh prices when the exchange rate arrives.
    const stop = subscribe((s) => {
      const rate = s.fx ? s.fx.rate : null;
      if (rate !== lastRate) {
        lastRate = rate;
        renderChosen();
        renderResults();
      }
    });
    // Coming back to this tab after a while loads the latest products and prices again.
    const onVisible = () => {
      if (document.visibilityState === "visible" && industry && !loading && Date.now() - lastLoadAt > 5 * 60 * 1000) load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    root._dispose = () => { stop(); document.removeEventListener("visibilitychange", onVisible); };

    renderChips();
    renderChosen();
    if (industry) load(true);
    return root;
  },
};
