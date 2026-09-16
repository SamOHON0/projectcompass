"use client";

import { useState } from "react";
import { useCompass } from "@/lib/store";
import { SERVICE } from "@/lib/data";
import { NewPill, RagPill } from "@/components/Badges";
import GoalPathway from "@/components/GoalPathway";
import { MOVE_ON_LABEL, goalStatus } from "@/lib/types";
import type { HandoverItem, Resident } from "@/lib/types";

/**
 * The handover, cut to this worker's shift.
 *
 * Bill asked for it to feel personal: when Farlen logs in, the parts that
 * concern Farlen's caseload, the actions due today, or the whole building come first,
 * and the rest of the service is one click away rather than gone. Each item
 * says why Compass picked it, so the cut is checkable rather than magic.
 */
export function HandoverPanel() {
  const { handover, residents, actions } = useCompass();
  const [showAll, setShowAll] = useState(false);

  const mine = new Set(residents.filter((r) => r.keyWorker === SERVICE.workerName).map((r) => r.id));
  const actionToday = new Set(
    actions
      .filter((a) => !a.done && (a.overdue || /^today/i.test(a.due)))
      .map((a) => a.residentId)
  );

  const why = (h: HandoverItem): string | null => {
    if (h.residentId === null) return h.tone === "info" ? null : "Whole building";
    if (!mine.has(h.residentId)) return null;
    return actionToday.has(h.residentId) ? "Your client, action today" : "Your client";
  };

  const forYou = handover.filter((h) => why(h) !== null);
  const rest = handover.filter((h) => why(h) === null);

  const renderRow = (h: HandoverItem) => {
    const res = residents.find((r) => r.id === h.residentId);
    const reason = why(h);
    return (
      <div className="row" key={h.id}>
        <span className={`tone-dot tone-${h.tone}`} aria-hidden />
        <div className="row-main">
          <div className="row-title">
            {res ? res.name : "Service"} {h.isNew && <NewPill />}
            {reason && <span className="handover-why">{reason}</span>}
          </div>
          <div className="row-sub">{h.text}</div>
        </div>
        <span className="row-meta">{h.when}</span>
      </div>
    );
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Your handover</h2>
        <span className="sub">
          {forYou.length} of {handover.length} entries picked for your shift
        </span>
      </div>
      <div className="card-body">
        <div className="row-list">{forYou.map(renderRow)}</div>
        {rest.length > 0 && (
          <div className="handover-rest">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
            >
              {showAll ? "Hide the rest of the service" : `Show full handover (${rest.length} more)`}
            </button>
            {showAll && <div className="row-list">{rest.map(renderRow)}</div>}
          </div>
        )}
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

const RAG_LABEL = { green: "Green", amber: "Amber", red: "Red" } as const;

/**
 * The caseload as a list to pick from, with the record opening beside it.
 * One resident is always selected, so the screen never shows an empty right-hand side.
 */
export function ClientRail({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { residents } = useCompass();
  const mine = residents.filter((r) => r.keyWorker === SERVICE.workerName);
  return (
    <section className="card" aria-labelledby="caseload-heading">
      <div className="card-head">
        <h2 id="caseload-heading">Caseload</h2>
        <span className="count">{mine.length}</span>
      </div>
      <div className="client-list">
        {mine.map((r) => {
          const active = selectedId === r.id;
          return (
            <button
              key={r.id}
              className={`client-item ${active ? "active" : ""}`}
              aria-current={active ? "true" : undefined}
              onClick={() => onSelect(r.id)}
            >
              <span className="client-item-top">
                <span className={`rag-dot rag-${r.rag}`} aria-hidden />
                <span className="sr-only">Risk {RAG_LABEL[r.rag]}. </span>
                <span className="name">{r.name}</span>
                <span className="room">{r.room}</span>
              </span>
              <span className="client-item-sub">{r.priorities[0]}</span>
              <span className="client-item-next">Next: {r.nextAppointment}</span>
            </button>
          );
        })}
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
      <div className="record-head">
        <div className="detail-head">
          <h2>{resident.name}</h2>
          <RagPill rag={resident.rag} />
          <button className="btn btn-sm btn-secondary" style={{ marginLeft: "auto" }} onClick={onOpenNote}>
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
      </div>

      <div className="card-body record-body">
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
