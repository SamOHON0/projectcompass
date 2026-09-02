// Resolves a Chromium for the test scripts.
//
// Playwright normally manages its own download. The container this was authored
// in ships one at a fixed path instead, so try an explicit override, then that
// path, then fall back to Playwright's own resolution.
import { chromium } from "playwright";
import { existsSync } from "fs";

export async function launchChromium() {
  const override = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const authoringPath = "/opt/pw-browsers/chromium";
  const executablePath =
    override && existsSync(override)
      ? override
      : existsSync(authoringPath)
        ? authoringPath
        : undefined; // let Playwright find its managed install

  try {
    return await chromium.launch({ executablePath, args: ["--no-sandbox"] });
  } catch (cause) {
    throw new Error(
      "Could not launch Chromium. Install Playwright's browser once with:\n\n" +
        "  npx playwright install chromium\n\n" +
        "Or point PLAYWRIGHT_CHROMIUM_PATH at an existing Chrome or Chromium binary.",
      { cause }
    );
  }
}
