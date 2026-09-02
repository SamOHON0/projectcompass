"use client";

import { useCompass } from "@/lib/store";
import { NewPill, RagPill } from "@/components/Badges";
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

export function ResidentDetail({ resident, onOpenNote }: { resident: Resident; onOpenNote: () => void }) {
  const { notes } = useCompass();
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

        <div className="section-label">Independent living progress</div>
        <div className="goal-row">
          <div className="goal-row-top">
            <span className="goal-label">Overall move-on readiness</span>
            <span className="goal-pct">{resident.moveOnProgress}%</span>
          </div>
          <div className="meter">
            <span style={{ width: `${resident.moveOnProgress}%` }} />
          </div>
        </div>

        <div className="section-label">Support plan goals</div>
        <div className="row-list">
          {resident.goals.map((g) => (
            <div className="goal-row" key={g.id}>
              <div className="goal-row-top">
                <span className="goal-area">{g.area}</span>
                <span className="goal-label">{g.label}</span>
                <span className="goal-pct">
                  {g.status === "achieved" ? "Achieved" : g.status === "stalled" ? "Stalled" : `${g.progress}%`}
                </span>
              </div>
              <div className="meter">
                <span
                  style={{
                    width: `${g.progress}%`,
                    background: g.status === "stalled" ? "var(--amber)" : "var(--accent)",
                  }}
                />
              </div>
            </div>
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
