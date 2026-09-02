"use client";

import { useCompass } from "@/lib/store";
import { NewPill, RagPill } from "@/components/Badges";
import GoalPathway from "@/components/GoalPathway";
import { MOVE_ON_LABEL, goalStatus } from "@/lib/types";
import type { Resident } from "@/lib/types";

export function HandoverPanel() {
  const { handover, residents } = useCompass();
  return (
    <section className="card">
      <div className="card-head">
        <h2>Your handover</h2>
        <span className="sub">since your last shift, filtered to what you need</span>
      </div>
      <div className="card-body">
        <div className="row-list">
          {handover.map((h) => {
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

export function ActionsPanel({ onOpenIncident }: { onOpenIncident?: () => void }) {
  const { actions, residents, toggleAction } = useCompass();
  const open = actions.filter((a) => !a.done).length;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Actions due</h2>
        <span className="count">{open} open</span>
      </div>
      <div className="card-body">
        <div className="row-list">
          {actions.map((a) => {
            const res = residents.find((r) => r.id === a.residentId);
            const isIncident = a.label.includes("INC-");
            return (
              <label className={`row ${a.done ? "done" : ""}`} key={a.id} style={{ cursor: "pointer" }}>
                <input type="checkbox" className="checkbox" checked={a.done} onChange={() => toggleAction(a.id)} />
                <div className="row-main">
                  <div className="row-title">
                    {a.label} {a.isNew && <NewPill />}
                  </div>
                  <div className="row-sub">
                    {res ? `${res.name} · ` : ""}
                    {a.source}
                  </div>
                  {isIncident && !a.done && onOpenIncident && (
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ marginTop: 8 }}
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenIncident();
                      }}
                    >
                      Open draft report
                    </button>
                  )}
                </div>
                <span className="row-meta" style={a.overdue ? { color: "var(--red)", fontWeight: 700 } : undefined}>
                  {a.overdue ? `Overdue · ${a.due}` : a.due}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ClientGrid({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { residents } = useCompass();
  const mine = residents.filter((r) => r.keyWorker === "Aoife Brennan");
  return (
    <section className="card">
      <div className="card-head">
        <h2>My clients</h2>
        <span className="sub">{mine.length} allocated</span>
      </div>
      <div className="card-body">
        <div className="client-grid">
          {mine.map((r) => (
            <button
              key={r.id}
              className={`client-card ${selectedId === r.id ? "selected" : ""}`}
              onClick={() => onSelect(r.id)}
            >
              <div className="client-card-top">
                <span className="client-name">{r.name}</span>
                <RagPill rag={r.rag} />
                <span className="client-room" style={{ marginLeft: "auto" }}>
                  {r.room}
                </span>
              </div>
              <div className="client-priority">{r.priorities[0]}</div>
              <div className="client-next">Next: {r.nextAppointment}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ResidentDetail({
  resident,
  onOpenNote,
  onOpenIncident,
}: {
  resident: Resident;
  onOpenNote: () => void;
  onOpenIncident?: () => void;
}) {
  const { notes, incidents } = useCompass();
  const residentIncidents = incidents.filter((i) => i.residentId === resident.id);
  const residentNotes = notes.filter((n) => n.residentId === resident.id);
  return (
    <section className="card">
      <div className="card-body">
        <div className="detail-head">
          <h2>{resident.name}</h2>
          <RagPill rag={resident.rag} />
          <button className="btn btn-sm btn-primary" style={{ marginLeft: "auto" }} onClick={onOpenNote}>
            New smart case note
          </button>
          <div className="detail-meta">
            Age {resident.age} · {resident.room} · Admitted {resident.admitted} · Key worker {resident.keyWorker}
          </div>
        </div>

        <div className={`risk-box ${resident.rag === "red" ? "risk-red" : ""}`}>
          <div className="risk-title">Risk summary</div>
          {resident.riskSummary}
          <div className="risk-when">Last updated {resident.riskUpdated}</div>
        </div>

        {residentIncidents.length > 0 && onOpenIncident && (
          <>
            <div className="section-label">Incident reports</div>
            <div className="row-list">
              {residentIncidents.map((inc) => (
                <div className="row" key={inc.id}>
                  <div className="row-main">
                    <div className="row-title">{inc.ref}</div>
                    <div className="row-sub">
                      {inc.status === "needs-worker"
                        ? "Compass drafted this. Two fields still need you."
                        : inc.status === "awaiting-signoff"
                          ? "Submitted, waiting on manager sign-off."
                          : `Signed off by ${inc.signedBy}.`}
                    </div>
                    <div className="row-actions">
                      <button className="btn btn-sm btn-primary" onClick={onOpenIncident}>
                        {inc.status === "needs-worker" ? "Complete report" : "Open report"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="section-label">Independent living</div>
        <MoveOnSummary resident={resident} />

        <div className="section-label">Support plan goals</div>
        <div className="goal-list">
          {resident.goals.map((g) => (
            <GoalPathway goal={g} key={g.id} />
          ))}
        </div>

        <div className="section-label">Recent case notes</div>
        <div className="row-list">
          {residentNotes.length === 0 && (
            <p style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>No case notes recorded yet.</p>
          )}
          {residentNotes.map((n) => (
            <div className="note-item" key={n.id}>
              <div className="note-item-top">
                <span className="note-type">{n.type}</span>
                <span className="note-when">
                  {n.when} · {n.author}
                </span>
                {n.isNew && <NewPill />}
              </div>
              <div className="note-summary">{n.summary}</div>
              {n.flags.length > 0 && (
                <div className="note-flags">
                  {n.flags.map((f) => (
                    <span className="pill pill-amber" key={f}>
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Where the resident is on the way out, as a band plus the counts behind it.
 *
 * The band is a keyworker judgement, which is how services actually record it.
 * The counts underneath are the checkable facts that justify it.
 */
export function MoveOnSummary({ resident }: { resident: Resident }) {
  const achieved = resident.goals.filter((g) => goalStatus(g) === "achieved").length;
  const stalled = resident.goals.filter((g) => goalStatus(g) === "stalled").length;
  const moving = resident.goals.length - achieved - stalled;

  return (
    <div className="moveon">
      <span className={`band band-${resident.moveOnBand}`}>{MOVE_ON_LABEL[resident.moveOnBand]}</span>
      <span className="moveon-counts">
        {achieved > 0 && <>{achieved} achieved · </>}
        {moving} progressing
        {stalled > 0 && <> · {stalled} stalled</>}
      </span>
      <span className="moveon-move">
        {resident.stalledFor ? (
          <span className="moveon-stalled">Nothing moved for {resident.stalledFor}</span>
        ) : (
          <>Last moved: {resident.lastMovement}</>
        )}
      </span>
    </div>
  );
}
