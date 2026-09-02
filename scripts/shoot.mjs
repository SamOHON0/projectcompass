import { launchChromium } from "./browser.mjs";
import { readdirSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "preview");
const mobileDir = join(dir, "mobile");
mkdirSync(mobileDir, { recursive: true });

const browser = await launchChromium();

const only = process.argv[2];
const files = readdirSync(dir).filter((f) => f.endsWith(".html") && (!only || f.includes(only)));

const desktop = await browser.newPage({ viewport: { width: 1360, height: 900 } });
for (const f of files) {
  await desktop.goto("file://" + join(dir, f));
  await desktop.waitForTimeout(100);
  await desktop.screenshot({ path: join(dir, f.replace(".html", ".png")), fullPage: true });
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const f of files) {
  await mobile.goto("file://" + join(dir, f));
  await mobile.waitForTimeout(100);
  // flag any horizontal overflow, which is the usual mobile failure
  const overflow = await mobile.evaluate(() => {
    const d = document.documentElement;
    return { scrollW: d.scrollWidth, clientW: d.clientWidth };
  });
  if (overflow.scrollW > overflow.clientW + 1) {
    console.log(`OVERFLOW ${f}: content ${overflow.scrollW}px in ${overflow.clientW}px viewport`);
  }
  await mobile.screenshot({ path: join(mobileDir, f.replace(".html", ".png")), fullPage: true });
}

console.log(`shot ${files.length} views at desktop and mobile`);
await browser.close();
