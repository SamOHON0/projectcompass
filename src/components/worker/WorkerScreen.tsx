"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { ActionsPanel, ClientRail, HandoverPanel, ResidentDetail } from "@/components/worker/panels";
import SmartCaseNote from "@/components/worker/SmartCaseNote";
import AskCompass from "@/components/AskCompass";
import IncidentReport from "@/components/IncidentReport";
import DailyTasks from "@/components/DailyTasks";
import { useCompass } from "@/lib/store";
import { useView } from "@/lib/use-view";
import { SERVICE } from "@/lib/data";

const VIEWS = ["today", "clients"] as const;
export type WorkerView = (typeof VIEWS)[number];

/**
 * The Project Worker's screen, in two sections.
 *
 * Today is what Farlen needs to know and do this shift: the handover cut to
 * her caseload, the actions due, and the routine daily tasks. My clients is
 * the caseload itself: pick a resident, see the whole record, ask Compass
 * about it. The smart case note is reachable from the sidebar in both.
 */
export default function WorkerScreen({ initialView = "today" }: { initialView?: WorkerView }) {
  const { residents, actions, demoRan, incidents } = useCompass();
  const [view, setView] = useView<WorkerView>(initialView, VIEWS);
  const [selectedId, setSelectedId] = useState<string | null>("michael-doyle");
  const [noteOpen, setNoteOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);

  const mine = residents.filter((r) => r.keyWorker === SERVICE.workerName);
  const selected = residents.find((r) => r.id === selectedId) ?? null;
  const activeIncident = incidents[0] ?? null;
  const openIncident = activeIncident ? () => setIncidentOpen(true) : undefined;

  const openActions = actions.filter((a) => !a.done).length;
  const newActions = actions.some((a) => a.isNew && !a.done);

  return (
    <AppShell
      role="worker"
      view={view}
      onViewChange={setView}
      views={[
        { id: "today", label: "Today", count: openActions, isNew: newActions },
        { id: "clients", label: "My clients", count: mine.length },
      ]}
      primaryAction={{ label: "New smart case note", onClick: () => setNoteOpen(true) }}
    >
      <main className="page" id="main" tabIndex={-1}>
        <p className="sr-only" role="status" aria-live="polite">
          {demoRan
            ? "Compass updated Michael Doyle's record. Risk raised to Red, three actions added, handover updated, incident report drafted."
            : ""}
        </p>

        {view === "today" && (
          <>
            <div className="page-head">
              <h1>Good afternoon, {SERVICE.workerName}</h1>
              <p>
                Monday 17 August · {SERVICE.name} · {mine.length} clients on your caseload ·{" "}
                {demoRan ? "1 incident recorded this shift" : "nothing urgent flagged since 07:00"}
              </p>
            </div>

            <div className="cols cols-7-5">
              <HandoverPanel />
              <div className="stack">
                <ActionsPanel onOpenIncident={openIncident} />
                <DailyTasks role="worker" />
              </div>
            </div>
          </>
        )}

        {view === "clients" && (
          <>
            <div className="page-head">
              <h1>My clients</h1>
              <p>Your allocated caseload. Select a client to open their record.</p>
            </div>

            <div className="split">
              <ClientRail selectedId={selectedId} onSelect={setSelectedId} />
              {selected && (
                <div className="stack">
                  <ResidentDetail
                    resident={selected}
                    onOpenNote={() => setNoteOpen(true)}
                    onOpenIncident={openIncident}
                  />
                  <AskCompass resident={selected} />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {noteOpen && <SmartCaseNote onClose={() => setNoteOpen(false)} defaultResidentId={selectedId ?? undefined} />}
      {incidentOpen && activeIncident && (
        <IncidentReport incident={activeIncident} role="worker" onClose={() => setIncidentOpen(false)} />
      )}
    </AppShell>
  );
}
