"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import {
  ClientProgress,
  CriticalUpdates,
  HandoverOverview,
  IncidentTrend,
  OutstandingActions,
  ServiceOverview,
  StaffOps,
} from "@/components/manager/panels";
import ResidentDrawer from "@/components/manager/ResidentDrawer";
import IncidentReport from "@/components/IncidentReport";
import DailyTasks from "@/components/DailyTasks";
import { useCompass } from "@/lib/store";
import { useView } from "@/lib/use-view";
import { SERVICE } from "@/lib/data";

const VIEWS = ["overview", "residents", "operations"] as const;
export type ManagerView = (typeof VIEWS)[number];

/**
 * The Manager's screen, in three sections.
 *
 * Overview is what needs Brian's attention now: the service numbers, the
 * alerts awaiting review, his own daily tasks and what needs chasing.
 * Residents is progress across the whole service, stalled cases first.
 * Operations is the shift handover, staffing and compliance.
 */
export default function ManagerScreen({ initialView = "overview" }: { initialView?: ManagerView }) {
  const { alerts, incidents } = useCompass();
  const [view, setView] = useView<ManagerView>(initialView, VIEWS);
  const [openResident, setOpenResident] = useState<string | null>(null);
  const [openIncident, setOpenIncident] = useState<string | null>(null);

  const fresh = alerts.some((a) => a.isNew);
  const awaiting = alerts.filter((a) => a.status === "awaiting-review").length;
  const incident = incidents.find((i) => i.id === openIncident) ?? null;

  return (
    <AppShell
      role="manager"
      view={view}
      onViewChange={setView}
      views={[
        { id: "overview", label: "Overview", count: awaiting, isNew: fresh },
        { id: "residents", label: "Residents" },
        { id: "operations", label: "Operations" },
      ]}
    >
      <main className="page" id="main" tabIndex={-1}>
        <p className="sr-only" role="status" aria-live="polite">
          {fresh ? "A new incident has arrived from the floor and is awaiting your review." : ""}
        </p>

        {view === "overview" && (
          <>
            <div className="page-head">
              <h1>Good afternoon, {SERVICE.managerName}</h1>
              <p>
                Monday 17 August · {SERVICE.name} ·{" "}
                {fresh
                  ? "a new incident has come in from the floor since you last looked"
                  : "what needs your attention across residents, risk and operations"}
              </p>
            </div>

            <div className="stack">
              <ServiceOverview />
              <div className="cols cols-7-5">
                <div className="stack">
                  <CriticalUpdates onOpenResident={setOpenResident} onOpenIncident={setOpenIncident} />
                  <IncidentTrend />
                </div>
                <div className="stack">
                  <OutstandingActions />
                  <DailyTasks role="manager" />
                </div>
              </div>
            </div>
          </>
        )}

        {view === "residents" && (
          <>
            <div className="page-head">
              <h1>Residents</h1>
              <p>Progress across the service, with what has stopped moving first. Open a resident for the full record.</p>
            </div>
            <ClientProgress onOpenResident={setOpenResident} />
          </>
        )}

        {view === "operations" && (
          <>
            <div className="page-head">
              <h1>Operations</h1>
              <p>The shift handover across the whole service, staffing and compliance.</p>
            </div>
            <div className="cols cols-6-6">
              <HandoverOverview />
              <StaffOps />
            </div>
          </>
        )}
      </main>

      {openResident && !openIncident && (
        <ResidentDrawer
          residentId={openResident}
          onClose={() => setOpenResident(null)}
          onOpenIncident={setOpenIncident}
        />
      )}
      {incident && <IncidentReport incident={incident} role="manager" onClose={() => setOpenIncident(null)} />}
    </AppShell>
  );
}
