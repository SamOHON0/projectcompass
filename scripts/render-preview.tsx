// Local verification harness. Renders each view to static HTML so the UI can
// be screenshot-checked without a Next.js build. Not part of the shipped app.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import Home from "@/app/page";
import WorkerPage from "@/app/worker/page";
import ManagerPage from "@/app/manager/page";
import WorkerScreen from "@/components/worker/WorkerScreen";
import ManagerScreen from "@/components/manager/ManagerScreen";
import SmartCaseNote from "@/components/worker/SmartCaseNote";
import IncidentReport from "@/components/IncidentReport";
import ResidentDrawer from "@/components/manager/ResidentDrawer";
import { CompassProvider } from "@/lib/store";
import { draftIncidentFields } from "@/lib/ai";
import { SERVICE } from "@/lib/data";
import type { IncidentRecord } from "@/lib/types";

const demoIncident = (status: IncidentRecord["status"]): IncidentRecord => {
  const fields = draftIncidentFields("Michael Doyle");
  if (status !== "needs-worker") {
    fields[fields.length - 2].value = "Conor Lynch, Project Worker, arrived at 14:06";
    fields[fields.length - 1].value =
      "“I'm not going to that meeting. There's no point in any of it.”";
  }
  return {
    id: "demo-incident",
    ref: "INC-2026-042",
    residentId: "michael-doyle",
    raisedBy: SERVICE.workerName,
    raisedAt: "Today, 14:20",
    status,
    fields,
    signedBy: status === "signed" ? SERVICE.managerName : undefined,
    signedAt: status === "signed" ? "Today" : undefined,
    managerNote:
      status === "signed" ? `Debrief with ${SERVICE.workerName} at handover. Risk review to be completed within 24 hours.` : undefined,
  };
};

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "preview");
mkdirSync(outDir, { recursive: true });
const css = readFileSync(join(here, "..", "src", "app", "globals.css"), "utf8");

function wrap(title: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${css}</style></head><body>${body}</body></html>`;
}

const views: [string, React.ReactElement][] = [
  ["home", <Home />],
  [
    "worker",
    <CompassProvider>
      <WorkerPage />
    </CompassProvider>,
  ],
  [
    "worker-clients",
    <CompassProvider>
      <WorkerScreen initialView="clients" />
    </CompassProvider>,
  ],
  [
    "manager",
    <CompassProvider>
      <ManagerPage />
    </CompassProvider>,
  ],
  [
    "manager-residents",
    <CompassProvider>
      <ManagerScreen initialView="residents" />
    </CompassProvider>,
  ],
  [
    "manager-operations",
    <CompassProvider>
      <ManagerScreen initialView="operations" />
    </CompassProvider>,
  ],
  [
    "note-compose",
    <CompassProvider>
      <SmartCaseNote onClose={() => {}} debugStage="compose" />
    </CompassProvider>,
  ],
  [
    "note-processing",
    <CompassProvider>
      <SmartCaseNote onClose={() => {}} debugStage="processing" />
    </CompassProvider>,
  ],
  [
    "note-review",
    <CompassProvider>
      <SmartCaseNote onClose={() => {}} debugStage="review" />
    </CompassProvider>,
  ],
  [
    "note-saved",
    <CompassProvider>
      <SmartCaseNote onClose={() => {}} debugStage="saved" />
    </CompassProvider>,
  ],
  [
    "incident-worker",
    <CompassProvider>
      <IncidentReport incident={demoIncident("needs-worker")} role="worker" onClose={() => {}} />
    </CompassProvider>,
  ],
  [
    "incident-manager",
    <CompassProvider>
      <IncidentReport incident={demoIncident("awaiting-signoff")} role="manager" onClose={() => {}} />
    </CompassProvider>,
  ],
  [
    "manager-drawer",
    <CompassProvider>
      <ResidentDrawer residentId="michael-doyle" onClose={() => {}} onOpenIncident={() => {}} />
    </CompassProvider>,
  ],
];

for (const [name, el] of views) {
  const html = wrap(`Compass preview: ${name}`, renderToStaticMarkup(el));
  writeFileSync(join(outDir, `${name}.html`), html);
  console.log(`rendered ${name}.html (${html.length} bytes)`);
}
console.log("OK");
