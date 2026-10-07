import { h } from "../ui.js?v=1791376102";
import { getState, update } from "../store.js?v=1791376102";
import { profileRules, validateProfile, ageFrom } from "../rules.js?v=1791376102";
import { DISTRICTS } from "../data/districts.js?v=1791376102";
import { head, textField, selectField, radioField, foot } from "./common.js?v=1791376102";

const SECTIONS = [
  {
    title: "About you",
    note: "Use the details on your NID. You will upload it later to confirm them.",
    fields: [
      { key: "fullName", kind: "text", label: "Full name", autocomplete: "name", full: true },
      { key: "phone", kind: "text", type: "tel", label: "Mobile number", help: "We use this to reach you about your order.", inputmode: "tel", autocomplete: "tel" },
      { key: "email", kind: "text", type: "email", label: "Email address", autocomplete: "email", inputmode: "email" },
      { key: "dob", kind: "text", type: "date", label: "Date of birth", help: "You must be 18 or older." },
      { key: "district", kind: "text", label: "City or district", list: "districts", autocomplete: "address-level2" },
    ],
  },
  {
    title: "Your situation",
    note: "This helps Forge plan the right size for your first order.",
    fields: [
      {
        key: "occupation", kind: "select", label: "What do you do now?",
        options: ["Employed", "I own a business", "Student", "Homemaker", "Overseas worker or returnee", "Retired", "Other"],
      },
      {
        key: "experience", kind: "select", label: "Business experience",
        options: ["None", "Under 1 year", "1 to 3 years", "3 to 10 years", "More than 10 years"],
      },
      {
        key: "selling", kind: "select", label: "Selling online",
        options: ["I have never sold online", "I have sold a few times", "I run an online page or shop now"],
      },
      {
        key: "capital", kind: "text", type: "number", label: "Money you can put in now (৳)", inputmode: "numeric",
        help: "At least ৳30,000 is required. It is a starting floor for a small first batch, freight, domain, packaging and website setup. More money gives you a bigger first batch and room for ads and returns. Use only money you can afford to lose.",
      },
    ],
  },
  {
    title: "Your plans",
    note: "These answers decide what you need to prepare before your goods arrive.",
    fields: [
      {
        key: "hours", kind: "select", label: "Time you can give each day",
        options: ["Under 1 hour", "1 to 2 hours", "3 to 4 hours", "Full time"],
      },
      {
        key: "goal", kind: "radio", label: "What do you want from this business?", full: true,
        options: ["Main income", "Extra income", "Grow a business I already have"],
      },
      {
        key: "license", kind: "radio", label: "Do you have a trade licence?", full: true, row: true,
        help: "You will need one in your business name within 30 days of starting.",
        options: ["Yes, I have one", "I am applying", "No, not yet"],
      },
      {
        key: "payout", kind: "radio", label: "Where should your sales money go?", full: true, row: true,
        options: ["Bank account", "bKash only", "Both bank and bKash"],
      },
      {
        key: "stock", kind: "radio", label: "Can you keep stock and hand parcels to a courier?", full: true, row: true,
        help: "You receive the goods from China and send parcels to your customers yourself.",
        options: ["Yes", "Not sure", "No"],
      },
    ],
  },
];

export default {
  id: "profile",
  stage: "profile",
  title: "Your details",
  render({ go }) {
    const st = getState();
    const controls = {};
    const touched = new Set();

    const set = (key, value) =>
      update((s) => {
        s.profile[key] = value;
      });

    const check = (key) => {
      const message = profileRules[key](getState().profile[key], getState().profile);
      controls[key].setError(touched.has(key) ? message : "");
      return message;
    };

    const stockNotice = h("div", { class: "notice notice--warn", hidden: true }, h("p", null, "Without a place for stock and someone to pass parcels to the courier, running this business will be hard. Talk to Forge before you continue."));
    const ageNotice = h("div", { class: "notice notice--error", hidden: true });

    function build(def) {
      const value = st.profile[def.key] ?? "";
      const common = { id: "f-" + def.key, label: def.label, help: def.help, full: def.full };
      let control;
      if (def.kind === "text") {
        control = textField({
          ...common, type: def.type, value, inputmode: def.inputmode, autocomplete: def.autocomplete, list: def.list,
          onInput: (v) => {
            set(def.key, v);
            if (touched.has(def.key)) check(def.key);
          },
          onBlur: () => {
            touched.add(def.key);
            check(def.key);
          },
        });
      } else if (def.kind === "select") {
        control = selectField({
          ...common, options: def.options, value,
          onChange: (v) => {
            touched.add(def.key);
            set(def.key, v);
            check(def.key);
          },
        });
      } else {
        control = radioField({
          ...common, row: def.row, options: def.options.map((o) => ({ value: o, label: o })), value,
          onChange: (v) => {
            touched.add(def.key);
            set(def.key, v);
            check(def.key);
            if (def.key === "stock") stockNotice.hidden = v !== "No";
          },
        });
      }
      controls[def.key] = control;
      return control.el;
    }

    const datalist = h("datalist", { id: "districts" }, DISTRICTS.map((d) => h("option", { value: d })));
    const sections = SECTIONS.map((section) =>
      h(
        "section",
        { class: "section" },
        h("div", { class: "section__head" }, h("h2", null, section.title), h("p", null, section.note)),
        h("div", { class: "fields" }, section.fields.map(build))
      )
    );
    stockNotice.hidden = st.profile.stock !== "No";

    // Age feedback appears as soon as a full date is entered.
    const dobInput = controls.dob.input;
    dobInput.addEventListener("change", () => {
      const age = ageFrom(dobInput.value);
      ageNotice.hidden = !(age !== null && age < 18);
      if (!ageNotice.hidden) ageNotice.textContent = "You must be 18 or older to start a business with Forge.";
    });

    const next = h(
      "button",
      {
        type: "button",
        class: "btn btn--primary",
        onclick: () => {
          Object.keys(profileRules).forEach((k) => touched.add(k));
          const errors = validateProfile(getState().profile);
          Object.keys(controls).forEach((k) => controls[k].setError(errors[k] || ""));
          const first = Object.keys(controls).find((k) => errors[k]);
          if (first) {
            controls[first].focus();
            controls[first].el.scrollIntoView({ block: "center", behavior: "smooth" });
            return;
          }
          go("industry");
        },
      },
      "Continue"
    );

    return h(
      "section",
      { class: "screen" },
      head("Tell us about yourself", "Forge uses your answers to plan your business with you. It takes a few minutes."),
      datalist,
      sections,
      ageNotice,
      stockNotice,
      foot({ back: "", next, note: "Your answers are saved as you type." })
    );
  },
};
