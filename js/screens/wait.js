// The waiting panel for work Forge does. Counts down to the time the team promised.
import { h } from "../ui.js?v=1791345108";
import { formatCountdown } from "../time.js?v=1791345108";

// Returns { el, stop }. onDue runs once when the promised time arrives.
export function waitPanel({ title, requestedAt, durationMs, lines, lateText, onDue }) {
  const dueAt = requestedAt + durationMs;
  const clock = h("span", { class: "wait__clock num", role: "timer", "aria-label": "Time left" });
  const late = h("p", { class: "field__help", hidden: true }, lateText);
  const left = h("p", { class: "wait__left" }, clock, " left");
  let timer = null;
  let fired = false;

  function tick() {
    const ms = dueAt - Date.now();
    clock.textContent = formatCountdown(ms);
    if (ms <= 0) {
      left.hidden = true;
      late.hidden = false;
      if (!fired) {
        fired = true;
        window.clearInterval(timer);
        if (onDue) onDue();
      }
    }
  }
  const el = h("div", { class: "wait" }, h("h3", null, title), left, late, h("div", { class: "wait__lines" }, lines.map((l) => h("p", null, l))));
  tick();
  if (!fired) timer = window.setInterval(tick, 1000);
  return { el, stop: () => window.clearInterval(timer) };
}
