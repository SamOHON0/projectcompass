// End-to-end click-through of the demo story, run against the real components.
import { chromium } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const page_url = "file://" + join(here, "..", "preview", "interactive.html");
const shots = join(here, "..", "preview", "flow");
import { mkdirSync } from "fs";
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1360, height: 950 } });

const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));

const checks = [];
const check = (name, ok, extra = "") => {
  checks.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
};

await page.goto(page_url);
await page.waitForSelector(".page-head h1");

// --- 1. Ask Compass, before the incident ---
await page.getByRole("button", { name: "Catch me up on Michael" }).first().click();
await page.waitForSelector(".ask-a p");
const answerBefore = await page.locator(".ask-a p").first().innerText();
check("Ask Compass answers", answerBefore.length > 80, answerBefore.slice(0, 45) + "...");
check("Answer reflects pre-incident state", /drifting|Amber/i.test(answerBefore));
check("Answer shows its sources", (await page.locator(".ask-sources .pill").count()) > 0);

// --- 2. Smart case note ---
await page.getByRole("button", { name: "New smart case note" }).first().click();
await page.getByRole("button", { name: "Insert example note" }).click();
await page.getByRole("button", { name: "Process with Compass" }).click();
await page.waitForSelector(".result-block", { timeout: 15000 });
check("Pipeline reaches review", await page.locator("text=Approve and save").isVisible());

const beforeApply = await page.locator(".result-block p").first().innerText();
await page.getByRole("button", { name: "Apply suggestion" }).click();
const afterApply = await page.locator(".result-block p").first().innerText();
check(
  "Language suggestion rewrites the note",
  beforeApply.includes("got aggressive") && afterApply.includes("verbally agitated")
);

await page.getByRole("button", { name: "Approve and save" }).click();
await page.waitForSelector("text=Saved and routed");
await page.screenshot({ path: join(shots, "1-note-saved.png") });
await page.getByRole("button", { name: "Back to my day" }).click();

// --- 3. Worker view updated ---
const workerText = await page.locator(".page").innerText();
check("Risk raised to Red on worker view", workerText.includes("Red"));
check("Incident action created", workerText.includes("INC-2026-042"));
check("Handover updated", workerText.includes("intoxicated"));
await page.screenshot({ path: join(shots, "2-worker-after.png"), fullPage: true });

// --- 4. Ask Compass, after the incident: answer must change ---
await page.getByRole("button", { name: "What are the risks right now?" }).first().click();
await page.waitForFunction(() => document.querySelectorAll(".ask-a p").length >= 2);
const riskAnswer = await page.locator(".ask-a p").last().innerText();
check("Assistant is state aware", /Red as of today/i.test(riskAnswer), riskAnswer.slice(0, 45) + "...");

// --- 5. Incident report, worker side ---
await page.getByRole("button", { name: "Open draft report" }).click();
await page.waitForSelector("text=Incident report INC-2026-042");
const submitBtn = page.getByRole("button", { name: "Submit for sign-off" });
check("Submit blocked until human fields are filled", await submitBtn.isDisabled());
check("Compass prefilled the report", (await page.locator("text=Compass drafted").count()) >= 8);

await page.locator("input.incident-input").fill("Conor Lynch, Project Worker, arrived at 14:06");
await page.locator("textarea.incident-input").fill("“I'm not going to that meeting.”");
check("Submit enabled once complete", await submitBtn.isEnabled());
await page.screenshot({ path: join(shots, "3-incident-worker.png") });
await submitBtn.click();
await page.waitForSelector("text=Submitted for sign-off");
check("Worker gets confirmation after submitting", true);
await page.getByRole("button", { name: "Back to my day" }).click();
await page.waitForSelector(".overlay", { state: "detached" });

// --- 6. Manager view drill-down ---
await page.getByRole("link", { name: "Manager" }).click();
await page.waitForSelector(".page-head h1");
const managerText = await page.locator(".page").innerText();
check("Manager sees the new incident", managerText.includes("Incident during welfare check"));
check("Manager risk count updated", managerText.includes("2 Red"));
await page.screenshot({ path: join(shots, "4-manager-after.png"), fullPage: true });

await page.getByRole("button", { name: /Incident during welfare check/ }).click();
await page.waitForSelector(".modal-wide");
check(
  "Drill-down opens resident record",
  (await page.locator(".modal-wide .modal-head h2").innerText()) === "Michael Doyle"
);
check("Drawer lists the linked incident", (await page.getByRole("button", { name: /INC-2026-042/ }).count()) > 0);
check("Manager can ask Compass from the drawer", (await page.locator(".modal-wide .ask").count()) === 1);
await page.screenshot({ path: join(shots, "5-manager-drawer.png") });

await page.getByRole("button", { name: /INC-2026-042/ }).click();
await page.waitForSelector("text=Sign off report");
check("Manager sees the worker's own words", (await page.locator("text=I'm not going to that meeting").count()) > 0);
await page.locator("#manager-note").fill("Debrief at handover. Risk review within 24 hours.");
await page.screenshot({ path: join(shots, "6-incident-manager.png") });
await page.getByRole("button", { name: "Sign off report" }).click();

await page.waitForTimeout(300);
const afterSign = await page.locator(".page").innerText();
check("Alert moves to acknowledged after sign-off", afterSign.includes("Acknowledged"));
await page.screenshot({ path: join(shots, "7-manager-signed.png"), fullPage: true });

// Signing off returns the manager to the resident record, where the incident
// now reads as signed. Close it with the keyboard.
check("Signed incident shows as signed in the drawer", (await page.locator("text=Signed off").count()) > 0);
await page.keyboard.press("Escape");
await page.waitForSelector(".overlay", { state: "detached" });
check("Escape closes the resident drawer", true);

// --- 7. Hardening: demo safeguards, keyboard, focus ---
const bannerText = await page.locator(".demo-banner").innerText();
check("Demo banner present on every view", /invented|Demo/i.test(bannerText));

await page.getByRole("button", { name: "Reset walkthrough" }).click();
await page.waitForTimeout(200);
const afterReset = await page.locator(".page").innerText();
check("Reset returns the walkthrough to its opening state", !afterReset.includes("INC-2026-042"));
check("Reset clears the incident alert", !afterReset.includes("Incident during welfare check"));

// keyboard: open a dialog, confirm focus moves in, Escape closes, focus returns
await page.getByRole("link", { name: "Project Worker" }).click();
await page.waitForSelector(".page-head h1");
const opener = page.getByRole("button", { name: "New smart case note" }).first();
await opener.focus();
await page.keyboard.press("Enter");
await page.waitForSelector('[role="dialog"]');
const focusInDialog = await page.evaluate(() =>
  Boolean(document.querySelector('[role="dialog"]')?.contains(document.activeElement))
);
check("Focus moves into the dialog on open", focusInDialog);

await page.keyboard.press("Escape");
await page.waitForSelector('[role="dialog"]', { state: "detached" });
check("Escape closes the dialog", true);
const focusReturned = await page.evaluate(
  () => document.activeElement?.textContent?.includes("New smart case note") ?? false
);
check("Focus returns to the control that opened it", focusReturned);

// Skip link is the first thing a keyboard user reaches. Tab order starts from
// the document, so this has to be checked on a fresh load.
await page.reload();
await page.waitForSelector(".page-head h1");
await page.keyboard.press("Tab");
const firstStop = await page.evaluate(() => document.activeElement?.className ?? "");
check("Skip link is the first tab stop", firstStop.includes("skip-link"), firstStop);

await page.keyboard.press("Enter");
const jumpedToMain = await page.evaluate(() => window.location.hash === "#main");
check("Skip link targets main content", jumpedToMain);

check("No console or page errors", errors.length === 0, errors.slice(0, 2).join(" | "));

await browser.close();

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exit(1);
