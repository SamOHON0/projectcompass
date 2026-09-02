// Renders every view to preview/ and bundles the interactive harness.
// Developer tooling only, not part of the deployed app.
import { execFileSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const preview = join(root, "preview");
mkdirSync(preview, { recursive: true });

const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });

console.log("Rendering static views...");
run("npx", ["tsx", "--tsconfig", "scripts/tsconfig.json", "scripts/render-preview.tsx"]);

// esbuild ships inside tsx, so the harness needs no extra dependency. Prefer a
// project-local install, fall back to the copy nested under tsx.
function resolveEsbuild() {
  const candidates = [
    join(root, "node_modules", ".bin", "esbuild"),
    join(root, "node_modules", "tsx", "node_modules", ".bin", "esbuild"),
  ];
  try {
    const globalRoot = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
    candidates.push(join(globalRoot, "tsx", "node_modules", ".bin", "esbuild"));
  } catch {
    /* npm not on PATH; the local candidates still apply */
  }
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    "Could not find esbuild. Run `npm install` first, or install tsx (`npm i -D tsx`), which bundles it."
  );
}

console.log("Bundling interactive harness...");
run(resolveEsbuild(), [
  "scripts/interactive-entry.tsx",
  "--bundle",
  "--outfile=preview/interactive.js",
  "--loader:.tsx=tsx",
  "--jsx=automatic",
  '--define:process.env.NODE_ENV="development"',
  "--alias:@=./src",
  "--alias:next/link=./scripts/stubs/next-link.tsx",
  "--alias:next/font/google=./scripts/stubs/next-font-google.ts",
]);

const css = readFileSync(join(root, "src", "app", "globals.css"), "utf8");
writeFileSync(
  join(preview, "interactive.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Compass interactive harness</title><style>${css}</style></head>
<body><div id="root"></div><script src="./interactive.js"></script></body></html>`
);

console.log("Done. Open preview/interactive.html, or run scripts/flow-test.mjs.");
