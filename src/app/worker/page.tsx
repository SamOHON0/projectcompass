"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { ActionsPanel, ClientGrid, HandoverPanel, ResidentDetail } from "@/components/worker/panels";
import SmartCaseNote from "@/components/worker/SmartCaseNote";
import AskCompass from "@/components/AskCompass";
import IncidentReport from "@/components/IncidentReport";
import { useCompass } from "@/lib/store";
import { SERVICE } from "@/lib/data";

export default function WorkerPage() {
  const { residents, demoRan, incidents } = useCompass();
  const [selectedId, setSelectedId] = useState<string | null>("michael-doyle");
  const [noteOpen, setNoteOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const selected = residents.find((r) => r.id === selectedId) ?? null;
  const activeIncident = incidents[0] ?? null;

  return (
    <AppShell role="worker">
      <main className="page" id="main" tabIndex={-1}>
        <div className="page-head page-head-row">
          <div>
            <h1>Good afternoon, Aoife</h1>
            <p>
              Monday 17 August · {SERVICE.name} · 4 clients on your caseload ·{" "}
              {demoRan ? "1 incident recorded this shift" : "nothing urgent flagged since 07:00"}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setNoteOpen(true)}>
            New smart case note
          </button>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {demoRan
            ? "Compass updated Michael Doyle's record. Risk raised to Red, three actions added, handover updated, incident report drafted."
            : ""}
        </p>

        <div className="grid grid-worker">
          <div className="stack">
            <HandoverPanel />
            <ClientGrid selectedId={selectedId} onSelect={setSelectedId} />
            {selected && <ResidentDetail
                resident={selected}
                onOpenNote={() => setNoteOpen(true)}
                onOpenIncident={activeIncident ? () => setIncidentOpen(true) : undefined}
              />}
          </div>
          <div className="stack">
            <ActionsPanel onOpenIncident={activeIncident ? () => setIncidentOpen(true) : undefined} />
            {selected && <AskCompass resident={selected} />}
          </div>
        </div>
      </main>

      {noteOpen && <SmartCaseNote onClose={() => setNoteOpen(false)} defaultResidentId={selectedId ?? undefined} />}
      {incidentOpen && activeIncident && (
        <IncidentReport incident={activeIncident} role="worker" onClose={() => setIncidentOpen(false)} />
      )}
    </AppShell>
  );
}
