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
import { useCompass } from "@/lib/store";
import { SERVICE } from "@/lib/data";

export default function ManagerPage() {
  const { alerts, incidents } = useCompass();
  const [openResident, setOpenResident] = useState<string | null>(null);
  const [openIncident, setOpenIncident] = useState<string | null>(null);
  const fresh = alerts.some((a) => a.isNew);
  const incident = incidents.find((i) => i.id === openIncident) ?? null;

  return (
    <AppShell role="manager">
      <main className="page" id="main" tabIndex={-1}>
        <div className="page-head">
          <h1>Good afternoon, Niamh</h1>
          <p>
            Monday 17 August · {SERVICE.name} ·{" "}
            {fresh
              ? "a new incident has come in from the floor since you last looked"
              : "service overview across residents, risk and operations"}
          </p>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {fresh ? "A new incident has arrived from the floor and is awaiting your review." : ""}
        </p>

        <div className="stack">
          <ServiceOverview />
          <div className="grid grid-manager">
            <div className="stack">
              <CriticalUpdates onOpenResident={setOpenResident} />
              <HandoverOverview />
              <ClientProgress onOpenResident={setOpenResident} />
            </div>
            <div className="stack">
              <OutstandingActions />
              <IncidentTrend />
              <StaffOps />
            </div>
          </div>
        </div>
      </main>

      {openResident && !openIncident && (
        <ResidentDrawer
          residentId={openResident}
          onClose={() => setOpenResident(null)}
          onOpenIncident={setOpenIncident}
        />
      )}
      {incident && (
        <IncidentReport incident={incident} role="manager" onClose={() => setOpenIncident(null)} />
      )}
    </AppShell>
  );
}
