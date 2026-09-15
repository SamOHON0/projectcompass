"use client";

import { useCompass } from "@/lib/store";
import { NewPill, RagPill } from "@/components/Badges";
import { INCIDENT_TREND, MANAGER_OUTSTANDING, SERVICE, STAFF_OPS } from "@/lib/data";
import { MOVE_ON_LABEL, goalStatus } from "@/lib/types";

export function ServiceOverview() {
  const { residents, alerts } = useCompass();
  const green = residents.filter((r) => r.rag === "green").length;
  const amber = residents.filter((r) => r.rag === "amber").length;
  const red = residents.filter((r) => r.rag === "red").length;
  const awaiting = alerts.filter((a) => a.status === "awaiting-review").length;
  const stalled = residents.filter((r) => r.stalledFor).length;
  const moving = residents.length - stalled;
  const longestStall = residents
    .filter((r) => r.stalledFor)
    .map((r) => r.stalledFor as string)
    .sort((a, b) => (parseInt(b, 10) || 0) - (parseInt(a, 10) || 0))[0];

  return (
    <div className="stat-row">
      <div className="stat">
        <div className="num">
          {SERVICE.occupied}/{SERVICE.beds}
        </div>
        <div className="lbl">Beds occupied</div>
        <div className="delta delta-good">1 move-on planned this week</div>
      </div>
      <div className="stat">
        <div className="num">
          {red > 0 ? <span style={{ color: "var(--red)" }}>{red} Red</span> : "0 Red"}
        </div>
        <div className="lbl">Resident risk levels</div>
        <div className="rag-strip" aria-label={`${green} green, ${amber} amber, ${red} red`}>
          <span style={{ flex: green, background: "var(--green)" }} />
          <span style={{ flex: amber, background: "var(--amber)" }} />
          <span style={{ flex: red, background: "var(--red)" }} />
        </div>
        <div className="delta" style={{ color: "var(--ink-faint)" }}>
          {green} green · {amber} amber · {red} red
        </div>
      </div>
      <div className="stat">
        <div className="num">{awaiting}</div>
        <div className="lbl">Items awaiting your review</div>
        <div className="delta delta-warn">Incident report pending sign-off</div>
      </div>
      <div className="stat">
        <div className="num">
          {moving} of {residents.length}
        </div>
        <div className="lbl">Residents whose plans are moving</div>
        <div className={`delta ${stalled > 0 ? "delta-warn" : "delta-good"}`}>
          {stalled > 0 ? `${stalled} stalled, longest ${longestStall}` : "None stalled"}
        </div>
      </div>
    </div>
  );
}

export function CriticalUpdates({
  onOpenResident,
  onOpenIncident,
}: {
  onOpenResident?: (id: string) => void;
  onOpenIncident?: (id: string) => void;
}) {
  const { alerts, incidents } = useCompass();
  return (
    <section className="card">
      <div className="card-head">
        <h2>Critical updates</h2>
        <span className="sub">incidents, safeguarding and risk changes</span>
      </div>
      <div className="card-body">
        <div className="row-list">
          {alerts.map((a) => {
            const incident = a.incidentId ? incidents.find((i) => i.id === a.incidentId) : undefined;
            const reportLabel =
              incident?.status === "awaiting-signoff"
                ? "Review and sign off"
                : incident?.status === "signed"
                  ? "View signed report"
                  : "View draft report";

            return (
              <div className={`row alert-row alert-${a.kind}`} key={a.id}>
                <div className="row-main">
                  <div className="row-title">
                    {a.title} {a.isNew && <NewPill />}
                  </div>
                  <div className="row-sub">{a.detail}</div>
                  {incident?.status === "needs-worker" && (
                    <div className="row-sub" style={{ color: "var(--amber)", fontWeight: 600 }}>
                      Still with {incident.raisedBy.split(" ")[0]}, two fields outstanding.
                    </div>
                  )}
                  <div className="row-actions">
                    {incident && onOpenIncident && (
                      <button className="btn btn-sm btn-primary" onClick={() => onOpenIncident(incident.id)}>
                        {reportLabel}
                      </button>
                    )}
                    {a.residentId && onOpenResident && (
                      <button className="btn btn-sm btn-secondary" onClick={() => onOpenResident(a.residentId!)}>
                        Open resident record
                      </button>
                    )}
                  </div>
                </div>
                <div className="row-right">
                  <span className="row-meta">{a.when}</span>
                  <span className={`pill ${a.status === "awaiting-review" ? "pill-amber" : "pill-neutral"}`}>
                    {a.status === "awaiting-review" ? "Awaiting review" : "Acknowledged"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function OutstandingActions() {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Outstanding actions</h2>
        <span className="sub">what needs chasing</span>
      </div>
      <div className="card-body">
        <div className="row-list">
          {MANAGER_OUTSTANDING.map((o) => (
            <div className="row" key={o.id}>
              <div className="row-main">
                <div className="row-title">{o.label}</div>
                <div className="row-sub">{o.detail}</div>
              </div>
              <span
                className="row-meta"
                style={o.due.startsWith("Overdue") ? { color: "var(--red)", fontWeight: 700 } : undefined}
              >
                {o.due}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function IncidentTrend() {
  const max = Math.max(...INCIDENT_TREND.map((d) => d.count));
  const last = INCIDENT_TREND.length - 1;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Incidents and near misses</h2>
        <span className="sub">last 8 weeks</span>
      </div>
      <div className="card-body">
        <div className="trend" role="img" aria-label="Weekly incident counts for the last 8 weeks, ranging 1 to 5, trending down">
          {INCIDENT_TREND.map((d, i) => {
            const labelled = i === last || d.count === max;
            return (
              <div className="bar-wrap" key={d.week} title={`${d.week}: ${d.count}`}>
                {labelled && <span className="bar-count">{d.count}</span>}
                <span
                  className={`bar ${i === last ? "current" : ""}`}
                  style={{ height: `${(d.count / max) * 52}px` }}
                />
              </div>
            );
          })}
        </div>
        <div className="trend-labels">
          {INCIDENT_TREND.map((d, i) => (
            <span key={d.week}>{i === 0 || i === last ? d.week.replace("w/c ", "") : ""}</span>
          ))}
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--ink-soft)" }}>
          Compass insight: incidents cluster on weekend evenings and involve the communal kitchen in 6 of the last 10
          reports. Consider staffing the kitchen area on Saturday nights.
        </p>
      </div>
    </section>
  );
}

/**
 * The manager's cut of the same handover: everything, but risk first, then
 * anything that needs attention, then the routine. Same entries Farlen sees,
 * ordered for oversight rather than for a caseload.
 */
export function HandoverOverview() {
  const { handover, residents } = useCompass();
  const weight = { risk: 0, attention: 1, info: 2 } as const;
  const ordered = [...handover].sort(
    (a, b) => (a.isNew ? 0 : 1) - (b.isNew ? 0 : 1) || weight[a.tone] - weight[b.tone]
  );
  return (
    <section className="card">
      <div className="card-head">
        <h2>Handover overview</h2>
        <span className="sub">every entry since your last shift, risk first</span>
      </div>
      <div className="card-body">
        <div className="row-list">
          {ordered.map((h) => {
            const res = residents.find((r) => r.id === h.residentId);
            return (
              <div className="row" key={h.id}>
                <span className={`tone-dot tone-${h.tone}`} aria-hidden />
                <div className="row-main">
                  <div className="row-title">
                    {res ? res.name : "Service"} {h.isNew && <NewPill />}
                  </div>
                  <div className="row-sub">{h.text}</div>
                </div>
                <span className="row-meta">{h.when}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Bill asked to see "whether residents are progressing and where cases may have
 * stalled". Position alone cannot answer that, so this sorts by what has stopped
 * moving and leads with how long it has been stuck.
 */
export function ClientProgress({ onOpenResident }: { onOpenResident?: (id: string) => void }) {
  const { residents } = useCompass();
  const weeks = (r: { stalledFor?: string }) => (r.stalledFor ? parseInt(r.stalledFor, 10) || 1 : 0);
  const ordered = [...residents].sort((a, b) => weeks(b) - weeks(a));
  const stalledCount = ordered.filter((r) => r.stalledFor).length;

  return (
    <section className="card">
      <div className="card-head">
        <h2>Client progress</h2>
        <span className="sub">what is moving, and what has stopped</span>
        <span className="count">{stalledCount} stalled</span>
      </div>
      <div className="card-body">
        <div className="row-list">
          {ordered.map((r) => {
            const stalledGoals = r.goals.filter((g) => goalStatus(g) === "stalled").length;
            return (
              <button className="row row-button" key={r.id} onClick={() => onOpenResident?.(r.id)}>
                <div className="row-main">
                  <div className="row-title" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {r.name} <RagPill rag={r.rag} />
                    <span className={`band band-${r.moveOnBand}`}>{MOVE_ON_LABEL[r.moveOnBand]}</span>
                  </div>
                  <div className="row-sub">
                    {stalledGoals > 0
                      ? `${stalledGoals} of ${r.goals.length} goals stalled`
                      : `All ${r.goals.length} goals moving`}
                    {" · "}
                    {r.lastMovement}
                  </div>
                </div>
                <span className="row-right">
                  {r.stalledFor ? (
                    <span className="pill pill-amber">Stalled {r.stalledFor}</span>
                  ) : stalledGoals > 0 ? (
                    <span className="pill pill-amber">
                      {stalledGoals} goal{stalledGoals > 1 ? "s" : ""} stuck
                    </span>
                  ) : (
                    <span className="pill pill-green">Moving</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function StaffOps() {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Staff and operations</h2>
      </div>
      <div className="card-body">
        <div className="row-list">
          {STAFF_OPS.map((s) => (
            <div className="row" key={s.id}>
              <div className="row-main">
                <div className="row-title">{s.label}</div>
                <div className="row-sub">{s.detail}</div>
              </div>
              <span className={`pill ${s.kind === "ok" ? "pill-green" : "pill-amber"}`}>
                {s.kind === "ok" ? "OK" : "Action needed"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
