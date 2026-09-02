// Checks every colour pair the UI actually renders against WCAG AA.
// Parses the real custom properties out of globals.css so it can never drift
// from the stylesheet.
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "..", "src", "app", "globals.css"), "utf8");

const vars = {};
for (const [, name, value] of css.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
  vars[name] = value;
}

const hex = (h) => {
  const v = h.replace("#", "");
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const lum = (h) => {
  const [r, g, b] = hex(h).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const v = (n) => vars[n] ?? n;

// [label, foreground, background, minimum]
// 4.5 for body text, 3.0 for large text (18px+ / 14px bold) and UI boundaries.
const PAIRS = [
  ["body text on page", v("ink"), v("bg"), 4.5],
  ["body text on card", v("ink"), v("surface"), 4.5],
  ["secondary text on card", v("ink-soft"), v("surface"), 4.5],
  ["secondary text on page", v("ink-soft"), v("bg"), 4.5],
  ["muted text on card", v("ink-faint"), v("surface"), 4.5],
  ["muted text on page", v("ink-faint"), v("bg"), 4.5],
  ["muted text on soft surface", v("ink-faint"), v("surface-soft"), 4.5],
  ["primary button label", "#ffffff", v("accent"), 4.5],
  ["primary button hover label", "#ffffff", v("accent-ink"), 4.5],
  ["disabled button label", v("ink-soft"), v("line"), 4.5],
  ["accent link text on card", v("accent-ink"), v("surface"), 4.5],
  ["accent text on accent tint", v("accent-ink"), v("accent-soft"), 4.5],
  ["green pill text", v("green"), v("green-soft"), 4.5],
  ["amber pill text", v("amber"), v("amber-soft"), 4.5],
  ["red pill text", v("red"), v("red-soft"), 4.5],
  ["red text on card", v("red"), v("surface"), 4.5],
  ["amber text on card", v("amber"), v("surface"), 4.5],
  ["active role switch label", "#ffffff", v("ink"), 4.5],
  ["new badge label", "#ffffff", v("accent"), 4.5],
  ["input border against card", v("line-strong"), v("surface"), 3.0],
  ["focus ring against card", v("accent"), v("surface"), 3.0],
  ["focus ring against page", v("accent"), v("bg"), 3.0],
  ["card border against page", v("line"), v("bg"), 1.2],
  ["meter fill against track", v("accent"), v("line"), 3.0],
];

let failed = 0;
console.log("WCAG contrast check\n");
for (const [label, fg, bg, min] of PAIRS) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1  (min ${min})  ${label}  ${fg} on ${bg}`
  );
}

console.log(`\n${PAIRS.length - failed}/${PAIRS.length} pairs pass`);
if (failed) process.exit(1);
