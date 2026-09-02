// Accessibility checks across every rendered view.
//
// axe-core is not reachable from this environment, so these are hand-written
// checks for the WCAG failures that actually occur in this UI and that can be
// detected reliably from the DOM. They are not a substitute for a full axe run
// or for testing with a real screen reader.
import { launchChromium } from "./browser.mjs";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "preview");

const AUDIT = () => {
  const problems = [];
  const add = (rule, detail) => problems.push({ rule, detail });
  const label = (el) =>
    (el.getAttribute("aria-label") ||
      (el.getAttribute("aria-labelledby") &&
        document.getElementById(el.getAttribute("aria-labelledby"))?.textContent) ||
      (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent) ||
      el.closest("label")?.textContent ||
      el.textContent ||
      el.getAttribute("title") ||
      "").trim();

  // 1. Controls must have an accessible name.
  document.querySelectorAll("button").forEach((el) => {
    if (!label(el)) add("button-name", el.outerHTML.slice(0, 90));
  });
  document.querySelectorAll("input, select, textarea").forEach((el) => {
    if (el.type === "hidden") return;
    if (!label(el)) add("form-label", el.outerHTML.slice(0, 90));
  });
  document.querySelectorAll("a[href]").forEach((el) => {
    if (!label(el)) add("link-name", el.outerHTML.slice(0, 90));
  });

  // 2. Images and decorative SVG.
  document.querySelectorAll("img").forEach((el) => {
    if (!el.hasAttribute("alt")) add("img-alt", el.outerHTML.slice(0, 90));
  });
  document.querySelectorAll("svg").forEach((el) => {
    const hidden = el.closest("[aria-hidden='true']") || el.getAttribute("aria-hidden") === "true";
    const named = el.getAttribute("role") === "img" && label(el);
    if (!hidden && !named) add("svg-unlabelled", el.outerHTML.slice(0, 70));
  });

  // 3. Structure.
  const h1s = document.querySelectorAll("h1");
  if (h1s.length > 1) add("multiple-h1", `${h1s.length} found`);

  let previous = 0;
  document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
    const level = Number(h.tagName[1]);
    if (previous && level > previous + 1) {
      add("heading-skip", `h${previous} to h${level}: ${h.textContent.slice(0, 40)}`);
    }
    previous = level;
  });

  // 4. Duplicate ids break label and aria references.
  const seen = new Set();
  document.querySelectorAll("[id]").forEach((el) => {
    if (seen.has(el.id)) add("duplicate-id", el.id);
    seen.add(el.id);
  });

  // 5. Positive tabindex fights the natural tab order.
  document.querySelectorAll("[tabindex]").forEach((el) => {
    if (Number(el.getAttribute("tabindex")) > 0) add("positive-tabindex", el.outerHTML.slice(0, 70));
  });

  // 6. WCAG 2.2 target size (minimum): 24x24 CSS px for pointer targets.
  document.querySelectorAll("button, a[href], input[type=checkbox]").forEach((el) => {
    // A control wrapped in a clickable label is targetable across that whole
    // label, which is the area a user actually has to hit.
    const wrapper = el.closest("label");
    const r = (wrapper ?? el).getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return; // not rendered
    if (r.width < 24 || r.height < 24) {
      add("target-size", `${Math.round(r.width)}x${Math.round(r.height)} ${label(el).slice(0, 32)}`);
    }
  });

  return problems;
};

const browser = await launchChromium();
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });

const files = readdirSync(dir).filter((f) => f.endsWith(".html"));
let total = 0;

for (const f of files) {
  await page.goto("file://" + join(dir, f));
  await page.waitForTimeout(120);
  const problems = await page.evaluate(AUDIT);
  total += problems.length;
  if (problems.length) {
    console.log(`\n${f}`);
    const grouped = {};
    for (const p of problems) (grouped[p.rule] ??= []).push(p.detail);
    for (const [rule, details] of Object.entries(grouped)) {
      console.log(`  ${rule} x${details.length}`);
      details.slice(0, 3).forEach((d) => console.log(`     ${d}`));
    }
  }
}

await browser.close();
console.log(`\n${total === 0 ? "PASS" : "FAIL"}  ${total} issue(s) across ${files.length} views`);
if (total) process.exit(1);
