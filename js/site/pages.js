// Pages of the public Forge site. Every figure shown here is labelled as an example.
import { h } from "../ui.js";

const cta = (ws, label = "Join Now", cls = "btn btn--primary") => h("a", { class: cls, href: ws }, label);
const link = (id, label, cls = "btn") => h("a", { class: cls, href: "#/" + id }, label);

function intro(title, lede) {
  return h("section", { class: "intro" }, h("div", { class: "wrap" }, h("h1", null, title), lede ? h("p", { class: "lede" }, lede) : null));
}

function band(title, ...kids) {
  return h("section", { class: "band" }, h("div", { class: "wrap" }, title ? h("h2", null, title) : null, ...kids));
}

function warning(extra) {
  return h("div", { class: "warn", role: "note" },
    h("strong", null, "Please read before you start"),
    h("p", null, "Forge can make mistakes, and a business can lose money. Forge does not promise sales or profit."),
    extra ? h("p", null, extra) : null);
}

// ---- Specimens: the one bold element, an order sheet and a goods table ----
function orderSheet() {
  const rows = [
    ["Product, 60 pieces", "৳ 11,000"],
    ["Domain, one year", "৳ 1,500"],
    ["Packaging, bags and box", "৳ 3,500"],
    ["Website setup", "৳ 8,000"],
  ];
  return h("figure", { class: "sheet", "aria-label": "Example order sheet" },
    h("figcaption", null, h("strong", null, "Your first bill"), h("span", null, "Example of a starter order, amounts illustrative")),
    h("dl", { class: "sheet__rows" }, rows.map(([k, v]) => h("div", null, h("dt", null, k), h("dd", null, v)))),
    h("div", { class: "sheet__total" }, h("span", null, "Total to pay"), h("strong", null, "৳ 24,000")),
    h("p", { class: "sheet__note" }, "Freight, duty and clearance are not in this bill. They are billed at actual cost once your goods reach Bangladesh. This is why the starting minimum of ৳30,000 is more than this bill. You choose how many pieces to order."));
}

function goodsTable() {
  const rows = [
    ["Desk lamp", "৳ 11,000", "Paid", "At Bangladesh", "৳ 2,100"],
    ["Phone stand", "৳ 7,500", "Paid", "Shipped", "Not yet"],
    ["Kitchen organiser", "৳ 6,000", "Unpaid", "Not shipped", "Not yet"],
  ];
  return h("figure", { class: "tablefig" },
    h("div", { class: "tablewrap" }, h("table", null,
      h("thead", null, h("tr", null, ["Goods", "Price", "Payment", "Status", "Freight"].map((t) => h("th", { scope: "col" }, t)))),
      h("tbody", null, rows.map((r) => h("tr", null, r.map((c, i) => h(i === 0 ? "th" : "td", i === 0 ? { scope: "row" } : null, c))))))),
    h("figcaption", null, "Example, amounts illustrative. Freight means everything it costs to bring the goods from the supplier's country to you. It stays blank until the goods arrive, then appears here and on your Billing page."));
}

function whyForge() {
  const reasons = [
    ["Nothing starts without a signed agreement", "Forge does no work and takes no money until the agreement is signed. It says who pays for what and who carries which loss, so there are no surprises later."],
    ["You see every number before you pay", "Your first bill lists each line. Freight is never guessed in advance: it is billed at actual cost, only after your goods reach Bangladesh."],
    ["Forge does the work and answers for it", "Forge buys your domain, gets your packaging made, runs your ads and confirms your orders. You can see each step, and you can ask about any of them."],
    ["One place instead of eight suppliers", "Alone, you would find a designer, a packaging maker, a domain seller, an importer, a freight agent, an ad expert and a courier. Here it is one file and Forge."],
    ["It is your business, not ours", "Your brand, your Facebook page, your domain and your stock. You can see stock in hand and every order at any time, and you can pause whenever you decide to."],
    ["We tell you the risk first", "Most services only sell the dream. Forge tells you up front that mistakes happen and money can be lost, and shows you how we reduce that risk."],
  ];
  return h("dl", { class: "why" }, reasons.map(([t, d]) => h("div", null, h("dt", null, t), h("dd", null, d))));
}

function alone() {
  const rows = [
    ["Finding a supplier and price", "You search and compare alone", "Choose from the catalogue with a price estimate"],
    ["Logo and Facebook page", "Find and brief a designer", "Pick from 5 or 6 options in about an hour"],
    ["Packaging", "Find a maker, negotiate, wait", "A quote within 3 working days"],
    ["Domain", "Learn how to buy one", "You choose, our staff buy"],
    ["Shipping and freight", "Arrange it yourself, risk surprise costs", "A goods table, freight billed at actual cost on arrival"],
    ["Ads", "Learn Facebook ads, spend while learning", "Our staff run them"],
    ["Orders and returns", "Chase every customer", "Forge confirms orders, returned goods are resold"],
  ];
  return h("figure", { class: "tablefig", style: "max-width:960px" },
    h("div", { class: "tablewrap" }, h("table", null,
      h("thead", null, h("tr", null, ["The job", "Doing it alone", "With Forge"].map((t) => h("th", { scope: "col" }, t)))),
      h("tbody", null, rows.map((r) => h("tr", null, h("th", { scope: "row" }, r[0]), h("td", null, r[1]), h("td", null, r[2])))))),
    h("figcaption", null, "Forge reduces the work and the surprises. It does not remove the business risk."));
}

function whoDoes() {
  const you = ["What to sell and what to call it", "Which logo you like best", "How much to spend on ads", "When to reorder", "When to pause"];
  const team = ["Design your logo options and build your Facebook page", "Buy your domain and get your packaging made", "Ship your goods in and handle the freight", "Run your ads", "Confirm every order with the customer"];
  const col = (title, items, cls) => h("div", { class: "who " + cls }, h("h3", null, title), h("ul", null, items.map((i) => h("li", null, i))));
  return h("div", null,
    h("div", { class: "whogrid" }, col("You decide", you, "who--you"), col("Forge makes it happen", team, "who--team")),
    h("p", { class: "small muted", style: "margin-top:14px" }, "A few things only you can do: sign your agreement, show your ID, and hand parcels to the courier."));
}


// ---- Costs: every cost listed, and freight explained ----
function costTable() {
  const rows = [
    ["Product", "The supplier's price times your quantity.", "In your first bill", "Shown before you pay"],
    ["Domain", "Your web address, for one year.", "In your first bill", "Shown before you pay"],
    ["Packaging", "Your bags and boxes, made locally in Bangladesh.", "In your first bill", "From the quote you approve"],
    ["Website setup", "Setting up your online shop page.", "In your first bill", "Confirmed by Forge before you pay"],
    ["Freight, duty and clearance", "The whole cost of getting goods from the supplier's country into your hands. Explained below.", "When your goods reach Bangladesh", "Known only on arrival, then shown line by line"],
    ["Advertising", "Money spent on Facebook ads. Forge runs them.", "While ads run", "You set the budget"],
    ["Minimum to start", "The least money you must have ready before you begin: ৳30,000. It is a starting floor for a small first batch plus the costs above, not a fee, and not paid to Forge. More money gives you a bigger first batch and room for ads and returned parcels.", "Not paid to Forge", "You tell us in your details"],
    ["Trade licence", "Your licence in your business name, within 30 days. Paid to the licensing authority, not to Forge.", "Within 30 days of starting", "Set by the authority"],
    ["Forge's own fees", "What Forge charges for its service.", "As set in your agreement", "Written in your agreement before you sign"],
  ];
  return h("figure", { class: "tablefig", style: "max-width:1000px" },
    h("div", { class: "tablewrap" }, h("table", { class: "plain" },
      h("thead", null, h("tr", null, ["Cost", "What it is", "When you pay", "How you learn the amount"].map((t) => h("th", { scope: "col" }, t)))),
      h("tbody", null, rows.map(([a, b, c, d]) => h("tr", null, h("th", { scope: "row" }, a), h("td", null, b), h("td", null, c), h("td", null, d)))))),
    h("figcaption", null, "Nothing is charged before your agreement is signed. You need at least ৳30,000 ready to start; with less, the first costs cannot be covered."));
}

function freightExplainer() {
  const route = [
    ["Supplier's country", "Your goods leave the supplier."],
    ["International shipping", "By air or sea to Bangladesh."],
    ["Bangladesh customs", "Duty and taxes are worked out."],
    ["Clearance and port", "Your goods are released."],
    ["Forge stock", "They wait here until freight is paid."],
    ["Your hands", "You receive them and start selling."],
  ];
  const parts = [
    ["International shipping", "Moving the goods from the supplier's country to Bangladesh, by air or sea. Charged by weight or size.", "The shipping company"],
    ["Customs duty and taxes", "Charged by Bangladesh customs when goods enter the country. The amount depends on what the product is.", "Bangladesh customs"],
    ["Clearance and port charges", "The paperwork, agent fees and handling needed to get your goods released from the port or airport.", "The clearing agent and the port"],
    ["Delivery to Forge stock", "Transport from the port or airport to Forge's stock room.", "The transport company"],
  ];
  const lines = [
    ["International shipping", "৳ 5,200"],
    ["Customs duty and taxes", "৳ 2,600"],
    ["Clearance and port charges", "৳ 900"],
    ["Delivery to Forge stock", "৳ 700"],
  ];
  return h("div", { class: "freight" },
    h("h3", null, "What is freight?"),
    h("p", { class: "narrow" }, "Freight is the total cost of getting your goods from the supplier's country into your hands in Bangladesh. It is more than the shipping fee. It has four parts, and we show you each one as its own line."),
    h("ol", { class: "steps steps--track" }, route.map(([t, d]) => h("li", null, h("strong", null, t), h("span", null, d)))),
    h("div", { class: "tablewrap" }, h("table", { class: "plain" },
      h("thead", null, h("tr", null, ["Part of freight", "What it is", "Paid to, through Forge"].map((t) => h("th", { scope: "col" }, t)))),
      h("tbody", null, parts.map(([a, b, c]) => h("tr", null, h("th", { scope: "row" }, a), h("td", null, b), h("td", null, c)))))),
    h("div", { class: "split freight__split" },
      h("div", null,
        h("h3", null, "Why we bill it after your goods arrive"),
        h("p", null, "Customs duty and clearance cannot be known until your goods are in Bangladesh and customs has assessed them. Anyone who gives you a final number before that is guessing. We would rather show you the real number than a comfortable one."),
        h("p", null, "So we bill freight at the actual cost, as separate lines. You pay it to receive your goods. If it stays unpaid, your goods wait safely in Forge stock. Nothing is lost."),
        h("p", null, "Freight can come in higher or lower than an early estimate. It depends on the weight, the size and the type of product.")),
      h("figure", { class: "sheet sheet--small", "aria-label": "Example freight bill" },
        h("figcaption", null, h("strong", null, "Your freight bill"), h("span", null, "Example, amounts illustrative")),
        h("dl", { class: "sheet__rows" }, lines.map(([k, v]) => h("div", null, h("dt", null, k), h("dd", null, v)))),
        h("div", { class: "sheet__total" }, h("span", null, "Total freight"), h("strong", null, "৳ 9,400")))),
    h("div", { class: "formula", role: "group", "aria-label": "What your first batch really costs" },
      h("div", null, h("span", null, "Your first bill"), h("strong", null, "৳ 24,000")),
      h("b", { "aria-hidden": "true" }, "+"),
      h("div", null, h("span", null, "Freight, duty and clearance"), h("strong", null, "৳ 9,400")),
      h("b", { "aria-hidden": "true" }, "="),
      h("div", { class: "formula__sum" }, h("span", null, "What your first batch really costs"), h("strong", null, "৳ 33,400"))),
    h("p", { class: "small muted" }, "Example, amounts illustrative. Your real figures depend on your product and quantity."));
}

// ---- Home: six parts, read in order ----
const PARTS = [
  ["what", "What Forge is"],
  ["trust", "Why trust Forge"],
  ["flow", "How it works"],
  ["pay", "What you pay"],
  ["risk", "The honest risk"],
  ["begin", "Begin"],
];

function part(i, title, lead, ...kids) {
  const id = PARTS[i - 1][0];
  return h("section", { class: "part", id: "part-" + id, "data-part": id },
    h("div", { class: "wrap" },
      h("p", { class: "part__no" }, "Part " + i + " of 6"),
      h("h2", null, title),
      lead ? h("p", { class: "part__lead" }, lead) : null,
      ...kids));
}

function bridge(text) {
  return h("p", { class: "bridge" }, text);
}

function worries() {
  const rows = [
    ["What if I pay and nothing happens?",
      "Nothing starts until the agreement is signed, and no money is taken before it. After that you pay one itemised first bill, and you watch your goods move step by step.",
      "You see it on the Documents stage and the Billing page."],
    ["What if hidden costs appear later?",
      "There is nothing to hide, so we list every cost. Part 4 shows each one, when you pay it and how you learn the amount. One cost, freight, cannot be known until your goods reach Bangladesh. Part 4 explains exactly what it is, line by line, and why we never guess it.",
      "You see it in Part 4 below, and on your Billing page."],
    ["What if I do not know how to do any of this?",
      "You do not need to. You make the decisions, and Forge handles the hassle: Forge designs your logo options, builds your page, buys your domain, gets your packaging made and runs your ads.",
      "Every stage tells you what you do and what Forge does."],
    ["What if I cannot see what is going on?",
      "One table shows every item: price, paid or unpaid, status and freight. Your stock in hand and every order are in front of you at all times.",
      "You see it on the Shipping and Orders stages."],
    ["What if it goes wrong?",
      "Then you know where you stand. The agreement says who carries which loss, returned goods are resold, and you can pause at any time. We cannot promise profit. We do promise clear terms and numbers you can check.",
      "You see it in your agreement and on the Pause page."],
  ];
  return h("ol", { class: "worries" }, rows.map(([q, a, w]) => h("li", null, h("h3", null, q), h("p", null, a), h("p", { class: "worries__where" }, w))));
}

function progress() {
  return h("nav", { class: "parts", "aria-label": "Parts of this page" }, h("div", { class: "wrap parts__in" },
    h("ol", null, PARTS.map(([id, label], i) => h("li", null, h("a", { href: "#part-" + id, "data-go": id, onclick: (e) => { e.preventDefault(); const t = document.getElementById("part-" + id); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); } }, h("span", null, String(i + 1)), label))))));
}

function watchParts(root) {
  window.setTimeout(() => {
    try {
      const links = [...root.querySelectorAll("[data-go]")];
      const sections = [...root.querySelectorAll("[data-part]")];
      if (!("IntersectionObserver" in window)) return;
      const io = new IntersectionObserver((entries) => {
        for (const en of entries) if (en.isIntersecting) {
          const id = en.target.getAttribute("data-part");
          links.forEach((l) => { if (l.getAttribute("data-go") === id) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current"); });
          const cur = links.find((l) => l.getAttribute("aria-current"));
          if (cur) cur.scrollIntoView({ block: "nearest", inline: "center" });
        }
      }, { rootMargin: "-25% 0px -65% 0px" });
      sections.forEach((x) => io.observe(x));
    } catch (e) { /* the progress bar is a convenience only */ }
  }, 0);
}

const ICONS = {
  sign: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 15c1-2 2-2 3 0s2 1 3-1"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/></svg>',
};
function icon(name) {
  const el = h("span", { class: "ico", "aria-hidden": "true" });
  el.innerHTML = ICONS[name] || ""; // fixed strings above, never user or supplier text
  return el;
}

function moneyBar() {
  const parts = [
    ["bill", "Your first bill", 24000, "Product, domain, packaging and website setup. Paid once, before ordering."],
    ["freight", "Freight and customs", 3000, "Billed at actual cost after your goods reach Bangladesh."],
    ["ads", "Ads and spare cash", 3000, "Your ad budget and room for returned parcels. You decide."],
  ];
  const total = parts.reduce((n, x) => n + x[2], 0);
  return h("figure", { class: "money", "aria-label": "Example of where a starting amount can go" },
    h("figcaption", null, h("strong", null, "Where a ৳30,000 start can go"), h("span", null, "Example, amounts illustrative")),
    h("div", { class: "money__bar", role: "img", "aria-label": parts.map(([, l, v]) => l + " ৳" + v.toLocaleString("en-US")).join(", ") },
      parts.map(([k, l, v]) => h("span", { class: "money__seg money__seg--" + k, style: "flex-grow:" + v, title: l }))),
    h("ul", { class: "money__legend" }, parts.map(([k, l, v, d]) => h("li", null,
      h("span", { class: "money__key money__key--" + k, "aria-hidden": "true" }),
      h("div", null, h("strong", null, l), h("span", { class: "money__amt" }, "৳" + v.toLocaleString("en-US")), h("p", null, d))))),
    h("p", { class: "money__note" }, "That is ৳" + total.toLocaleString("en-US") + " in all. With more money you order a bigger first batch and keep more for ads."));
}

function fitLists() {
  const yes = ["You are 18 or older and can afford to lose the money you put in.", "You want to sell a physical product on cash on delivery.", "You will make the decisions and let Forge do the setup.", "You can keep at least ৳30,000 ready to start."];
  const no = ["You expect guaranteed income or a quick profit.", "You would be borrowing money you cannot repay.", "You want to skip reading the agreement.", "You want a business that runs with no effort from you."];
  const col = (title, items, cls) => h("div", { class: "fit__col fit__col--" + cls }, h("h3", null, title), h("ul", null, items.map((i) => h("li", null, i))));
  return h("div", { class: "fit" }, col("Forge suits you if", yes, "yes"), col("Forge is not for you if", no, "no"));
}

function trustStrip() {
  const items = [
    ["sign", "Nothing starts before you sign", "No work is done and no money is taken until your agreement is signed."],
    ["receipt", "You see every cost first", "Each line of your first bill is shown before you pay. Freight is billed at actual cost."],
    ["pause", "You can pause any time", "The exact terms are written in your agreement before you sign it."],
  ];
  return h("ul", { class: "trust" }, items.map(([ic, t, d]) => h("li", null, icon(ic), h("div", null, h("strong", null, t), h("span", null, d)))));
}

function secHead(title, lead, more) {
  return h("div", { class: "sec__head" }, h("h2", null, title), lead ? h("p", { class: "sec__lead" }, lead) : null, more || null);
}

function sec(id, ...kids) {
  return h("section", { class: "sec", id: "sec-" + id }, h("div", { class: "wrap" }, ...kids));
}

function costGlance() {
  const rows = [
    ["Minimum to start", "৳30,000", "The least you must have ready. It buys a small first batch. Not a fee, and not paid to Forge."],
    ["Your first bill", "Itemised", "Product, domain, packaging and website setup, shown line by line before you pay."],
    ["Freight and customs", "At actual cost", "Billed after your goods reach Bangladesh, because the real number is only known then."],
    ["Advertising", "Your budget", "You decide how much to spend. Forge runs the ads."],
  ];
  return h("dl", { class: "glance" }, rows.map(([k, v, d]) => h("div", null, h("dt", null, k), h("dd", { class: "glance__v" }, v), h("dd", { class: "glance__d" }, d))));
}

function homeFaq() {
  const pick = ["Do I need business experience?", "How much money do I need?", "Are there any hidden costs?", "What if my goods do not sell?", "Can I stop?"];
  const rows = QA.filter(([q]) => pick.includes(q));
  return h("div", { class: "faq" }, rows.map(([q, a]) => h("details", null, h("summary", null, q), h("p", null, a))));
}

const home = {
  title: "Home",
  render({ workspace }) {
    return h("div", null,
      h("section", { class: "hero" }, h("div", { class: "wrap hero__in" },
        h("div", { class: "hero__text" },
          h("h1", null, "You make the decisions. Forge handles the hassle."),
          h("p", { class: "lede" }, "Starting an import business means deciding and doing. You decide what to sell and how much to risk. Forge does the sourcing, branding, packaging, shipping, ads and order confirmation. You sell cash on delivery."),
          h("div", { class: "actions" }, cta(workspace), link("how", "See how it works")),
          h("p", { class: "hero__fine" }, "Forge can make mistakes, and a business can lose money. Forge does not promise sales or profit.")),
        orderSheet())),

      h("section", { class: "wrap trustrow" }, trustStrip()),

      sec("who", secHead("Deciding is yours. Doing is Forge's.", "Every business is two jobs. Forge takes the one where the hassle lives."), whoDoes()),

      sec("how", secHead("How it works", "Six steps from your first question to your first parcel.", link("how", "See all 15 stages")),
        h("ol", { class: "steps steps--track" }, STEPS.map(([t, d]) => h("li", null, h("strong", null, t), h("span", null, d))))),

      sec("cost", secHead("What it costs", "You need at least ৳30,000 ready. Here is where the money goes.", link("costs", "See every cost")), moneyBar(), costGlance()),

      sec("fit", secHead("Is Forge right for you?", "Read this before you start. Starting a business can lose money."), fitLists()),

      sec("faq", secHead("Questions people ask first", null, link("faq", "See all questions")), homeFaq()),

      sec("risk", secHead("The honest risk", "We would rather you hear this from us now than find out later."),
        warning("Your agreement says who pays for what and who carries which loss."),
        h("p", { class: "narrow", style: "margin-top:18px" }, "Products may not sell. Customers refuse some parcels. Ads cost money. Shipments run late. Forge reduces the work and the surprises. It cannot remove the risk."),
        h("p", null, link("risk", "Read about the risks"))),

      h("section", { class: "final" }, h("div", { class: "wrap" },
        h("h2", null, "Ready to open your business file?"),
        h("p", { class: "lede" }, "Answer the first questions now. Nothing is charged until you have signed the agreement and approved your first bill."),
        cta(workspace))));
  },
};

// ---- How it works ----
const STAGES = [
  { t: "Your details", by: "You", time: "5 minutes",
    what: "We learn who you are and how much experience you have, so the rest of the plan fits you.",
    you: "Give your name, mobile number, email, date of birth (you must be 18 or older) and your city.",
    we: "Nothing yet. Your answers are saved on your device as you go.",
    get: "Your business file is opened." },
  { t: "Industry", by: "You, with Forge", time: "Same day",
    what: "You decide what kind of business you will run.",
    you: "Pick an industry.",
    we: "Forge suggests what suits you and what logo type fits the industry. You are never forced to take a suggestion.",
    get: "An industry on your file." },
  { t: "Product", by: "You, with Forge", time: "Same day",
    what: "You decide what you will sell and how many to start with.",
    you: "Pick a product from the supplier catalogue, and a quantity. Start small: you can reorder when it sells.",
    we: "We show live supplier prices with an estimate in taka.",
    get: "A chosen product, with a price estimate on your order sheet." },
  { t: "Business name", by: "You", time: "Same day",
    what: "Your business needs a name that works as a domain and as a Facebook page.",
    you: "Type the name you want.",
    we: "We keep it on your file so the logo, page and domain all use the same name.",
    get: "A business name on your file." },
  { t: "Documents and agreement", by: "You", time: "Nothing else starts until this is done",
    what: "This is the gate. Until your documents and signed agreement are in, Forge does no work and no payment is taken.",
    you: "Upload your National ID (front and back). Give a cheque leaf for Pathao, or a bKash number if you have no bank account. Print the agreement, sign it, scan it and upload it. Later you will upload a trade licence within 30 days.",
    we: "We check the documents and release the next stages.",
    get: "Logo and page, packaging and domain all open together." },
  { t: "Logo and Facebook page", by: "Forge", time: "About one hour for each",
    what: "Your brand look and your first sales channel.",
    you: "Choose the kind of logo you want. Press the button, and a timer shows when to come back. Pick one of the 5 or 6 options. For the page, add Forge as an admin of your own Facebook profile so we can set it up.",
    we: "We suggest a logo type for your industry, design the options, and create your page.",
    get: "A chosen logo and a Facebook page link." },
  { t: "Packaging", by: "Forge", time: "Quote within 3 working days",
    what: "Your product needs a bag or box with your brand on it.",
    you: "Choose a polythene bag, a box, and optionally a sticker or card. Ask for the quote right away, because it takes the longest.",
    we: "We get your packaging made locally in Bangladesh and send you the quote.",
    get: "A packaging quote you approve when you pay." },
  { t: "Domain", by: "You choose, team buys", time: "Same day",
    what: "Your web address, such as yourbrand.com.",
    you: "Choose the name and check that it is available.",
    we: "Our staff buy the domain for you.",
    get: "A domain registered for your business." },
  { t: "Your first bill", by: "You", time: "Pay once, in full",
    what: "Everything you have chosen, in one bill.",
    you: "Check each line. Pay product price times quantity, the domain, the packaging and the website setup.",
    we: "We confirm your payment and start your shipment. Freight, duty and clearance are not in this bill. They come later, at actual cost.",
    get: "Your goods are ordered." },
  { t: "Business plan", by: "Forge, then you", time: "Same day",
    what: "A plain plan for your business, in writing.",
    you: "Read it. Ask us about anything unclear.",
    we: "Forge drafts the plan from your choices and goes through it with you.",
    get: "A business plan on your file." },
  { t: "Shipping and freight", by: "Forge", time: "Depends on the shipment",
    what: "Your goods travel to Bangladesh.",
    you: "Follow each item in the goods table: price, paid or unpaid, and status. When goods reach Bangladesh, the freight appears. Pay it to receive your goods.",
    we: "We ship the goods. Freight is everything it costs to bring them here: international shipping, customs duty and taxes, clearance and port charges, and delivery to Forge stock. We bill it at actual cost, as separate lines, only after arrival. If it stays unpaid, your goods wait in Forge stock.",
    get: "Goods in your hands." },
  { t: "Marketing", by: "Forge", time: "Ongoing",
    what: "People need to see your product.",
    you: "Set an ad budget. Post on your Facebook page when the weekly reminder arrives.",
    we: "Forge runs your ads and writes them with you.",
    get: "Customers and orders." },
  { t: "Orders and customers", by: "Shared", time: "Ongoing",
    what: "This is the daily business.",
    you: "Hand confirmed parcels to the Pathao courier and receive any that come back. Check your stock in hand at any time.",
    we: "Forge confirms every order with the customer before it goes out.",
    get: "Delivered orders and money collected on delivery." },
  { t: "Returns", by: "Shared", time: "Ongoing",
    what: "Not every parcel is accepted by the customer.",
    you: "Receive returned parcels from the courier and hand them over as Forge directs.",
    we: "Returned goods are checked and resold.",
    get: "Returned goods back in stock." },
  { t: "Reorder", by: "You decide, Forge orders", time: "Ongoing",
    what: "Stock runs out when your product sells.",
    you: "Ask for more when stock runs low. You can pause at any time.",
    we: "We check the supplier price and stock, then send you the bill for the reorder.",
    get: "A business that keeps going." },
];

const STEPS = [
  ["You tell us about you and your product", "A few questions: who you are, the industry, the product, the business name."],
  ["You sign the agreement and upload documents", "National ID, a cheque leaf or bKash number, and the signed agreement. Nothing else starts before this."],
  ["Three things run side by side", "Logo and Facebook page (about one hour each), packaging quote (within 3 working days), domain."],
  ["You pay your first bill", "Product, domain, packaging and website setup, in full. You see every line before you pay."],
  ["Goods ship and arrive", "You follow each item in a table. When goods reach Bangladesh, freight, duty and clearance are billed at actual cost."],
  ["Orders come in and parcels go out", "Forge confirms orders. You hand parcels to Pathao and receive anything that comes back."],
];

const how = {
  title: "How it works",
  render({ workspace }) {
    return h("div", null,
      intro("How it works", "Fifteen stages, in order. You make the decisions, and Forge carries them out. Each stage shows your part, Forge's part, how long it takes and what you get. A stage opens only when the one before it is done, so you are never asked for something we cannot use yet."),
      h("section", { class: "wrap" }, h("nav", { class: "jump", "aria-label": "Stages" }, h("strong", null, "Jump to a stage"), h("ol", null, STAGES.map((st, i) => h("li", null, h("a", { href: "#st" + (i + 1), onclick: (e) => { e.preventDefault(); document.getElementById("st" + (i + 1)).scrollIntoView({ behavior: "smooth", block: "start" }); } }, st.t)))))),
      band(null, h("div", { class: "stagelist" }, STAGES.map((st, i) =>
        h("article", { class: "stage", id: "st" + (i + 1) },
          h("div", { class: "stage__n" }, String(i + 1)),
          h("div", null,
            h("h3", null, st.t),
            h("p", { class: "stage__meta" }, h("span", null, "Done by: ", st.by), h("span", null, "Time: ", st.time)),
            h("p", { class: "stage__what" }, st.what),
            h("dl", { class: "stage__dl" },
              h("div", null, h("dt", null, "Your part"), h("dd", null, st.you)),
              h("div", null, h("dt", null, "Forge's part"), h("dd", null, st.we)),
              h("div", null, h("dt", null, "What you get"), h("dd", null, st.get)))))))),
      band("Your goods table", h("div", null, h("p", { class: "narrow" }, "Each item you import appears in one table. The freight cell stays blank until your goods reach Bangladesh."), goodsTable())),
      band("Doing it alone, or with Forge", alone()),
      h("section", { class: "wrap warnrow" }, warning("You can pause at any time. The exact terms are in your agreement.")),
      h("section", { class: "final" }, h("div", { class: "wrap" }, h("h2", null, "See it for yourself"), cta(workspace))));
  },
};

// ---- Costs ----
const costs = {
  title: "What you pay",
  render({ workspace }) {
    return h("div", null,
      intro("What you pay, and when", "Every cost we know of, when you pay it, and how you learn the amount. There is no charge before the agreement is signed."),
      band("Every cost, listed", costTable()),
      band(null, freightExplainer()),
      band("An example first bill", h("div", { class: "split" }, orderSheet(), h("div", null,
        h("p", null, "This is the shape of the bill you will receive. The amounts here are only an illustration, not a price list."),
        h("p", null, "Your real bill uses the product you chose, the quantity you chose, and the packaging quote we sent you.")))),
      h("section", { class: "final" }, h("div", { class: "wrap" }, h("h2", null, "Begin with the questions"), cta(workspace))));
  },
};

// ---- Risk ----
const risk = {
  title: "Before you start",
  render({ workspace }) {
    const risks = [
      ["Products may not sell", "A product that looks good can sell slowly or not at all. Unsold goods are yours."],
      ["Parcels can be refused", "On cash on delivery, some customers refuse the parcel. Returned goods can be resold, but delivery costs are lost."],
      ["Ads cost money", "Ad spend is paid whether or not it brings orders."],
      ["Shipments can be late", "Customs, suppliers and weather can delay goods."],
      ["Freight can differ from the estimate", "Shipping, customs duty and clearance are only known when your goods reach Bangladesh. The final amount can be higher or lower than an early estimate."],
      ["Forge can make mistakes", "Forge can get things wrong. We check the important steps, and you can check every number. If you see a mistake, tell us and we fix it."],
    ];
    const protections = [
      "A written agreement that says who pays for what and who carries which loss.",
      "Itemised bills. Nothing is charged that you have not seen.",
      "A table showing every item, its payment, its status and its freight.",
      "Stock in hand and every order visible to you at all times.",
      "You can pause at any time. The exact exit terms are written in your agreement.",
    ];
    return h("div", null,
      intro("Before you start", "Starting a business can lose money. Forge does not promise sales or profit, and no honest service can."),
      h("section", { class: "wrap warnrow" }, warning()),
      band("Common worries, answered", worries()),
      band("What can go wrong", h("div", { class: "factlist" }, risks.map(([t, d]) => h("div", null, h("h3", null, t), h("p", null, d))))),
      band("What Forge puts in place", h("ul", { class: "ticks" }, protections.map((p) => h("li", null, p)))),
      band("Who should not start", h("p", { class: "narrow" }, "Do not start if you cannot afford to lose the money in your first bill, if you are under 18, or if you expect guaranteed income.")),
      h("section", { class: "final" }, h("div", { class: "wrap" }, h("h2", null, "If that is clear, begin"), cta(workspace))));
  },
};

// ---- FAQ ----
const QA = [
  ["Who is Forge for?", "First-time owners in Bangladesh who want to import and sell a product on cash on delivery and want a team to do the setup with them."],
  ["Do I need business experience?", "No. Each stage tells you what to do and what we do."],
  ["How much money do I need?", "At least ৳30,000 ready before you start. This is a firm minimum, and a starting floor: it buys a small first batch. More money means a bigger batch and room for ads and returned parcels. Your first bill covers the product, domain, packaging and website setup. The amount depends on the product and quantity you choose, and you see it before paying. Freight, duty and clearance are billed separately once goods arrive."],
  ["What is freight?", "Freight is the total cost of getting your goods from the supplier's country into your hands in Bangladesh. It includes international shipping, customs duty and taxes, clearance and port charges, and delivery to Forge stock. Each part is shown as its own line on your bill."],
  ["Are there any hidden costs?", "We list every cost we know of on the What you pay page, with when you pay it and how you learn the amount. The one amount that cannot be known in advance is freight, because customs works out its part only when your goods arrive."],
  ["Why is freight billed after my goods arrive?", "Because customs duty and clearance are only known once your goods are in Bangladesh. A final number before that would be a guess. We bill the actual cost instead."],
  ["What if I cannot pay the freight?", "Your goods wait in Forge stock until it is paid. Nothing is lost, and you can pay when you are ready."],
  ["Do I need a trade licence?", "Yes. You upload a trade licence in your business name within 30 days of starting the business. If it is not uploaded, Forge stops the process of doing business."],
  ["I have no bank account. Can I still join?", "Yes. Give a bKash number instead. With a bank account, we ask for a cheque leaf so Pathao can pay you."],
  ["What documents do I need?", "Your National ID (front and back), a cheque leaf or bKash number, the signed agreement, and later the trade licence."],
  ["What if my goods do not sell?", "Unsold goods remain your stock. You can keep marketing them, and the agreement sets out what happens if you stop."],
  ["What happens to refused or returned parcels?", "You receive them from Pathao and hand them over as Forge directs. Returned goods go back to stock and are resold."],
  ["What do I do each day?", "Hand confirmed parcels to Pathao, receive returns, and post on your Facebook page once a week when reminded. Forge confirms orders and runs the ads."],
  ["Who owns my Facebook page?", "You do. You add Forge as an admin of your own profile so we can set it up, and you can remove us."],
  ["Can I stop?", "Yes, you can pause at any time. The exact terms for pausing or leaving are in your agreement."],
  ["Does Forge promise profit?", "No. Forge can make mistakes and a business can lose money. We promise a clear agreement and numbers you can check."],
];

const faq = {
  title: "Questions",
  render({ workspace }) {
    return h("div", null,
      intro("Questions", "Short answers to what new owners ask first."),
      band(null, h("div", { class: "faq" }, QA.map(([q, a]) => h("details", null, h("summary", null, q), h("p", null, a))))),
      h("section", { class: "final" }, h("div", { class: "wrap" }, h("h2", null, "Still unsure?"), h("p", { class: "lede" }, "Open your business file and look around. You can stop at any step."), cta(workspace))));
  },
};

// ---- Start ----
const start = {
  title: "Start",
  render({ workspace }) {
    return h("div", null,
      intro("Start your business file", "Have these ready. You can begin without them and come back."),
      band("What you need", h("ul", { class: "ticks" }, [
        "You are 18 or older.",
        "Your National ID, front and back.",
        "A cheque leaf from your bank account, or a bKash number.",
        "A trade licence in your business name, within 30 days of starting.",
        "A printer and scanner, or a phone that can scan, for the agreement.",
      ].map((t) => h("li", null, t)))),
      band("What happens next", h("ol", { class: "steps" }, STEPS.slice(0, 3).map(([t, d]) => h("li", null, h("strong", null, t), h("span", null, d))))),
      band(null, h("p", { class: "narrow" }, "Your answers are saved on your device while you go. No payment is asked for until the agreement is signed and you approve your first bill."), cta(workspace)));
  },
};

export const PAGES = { home, how, costs, risk, faq, start };
