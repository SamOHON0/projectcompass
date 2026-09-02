"use client";

import { useCompass } from "@/lib/store";
import { RagPill } from "@/components/Badges";
import AskCompass from "@/components/AskCompass";
import Modal from "@/components/Modal";
import GoalPathway from "@/components/GoalPathway";
import { MoveOnSummary } from "@/components/worker/panels";

export default function ResidentDrawer({
  residentId,
  onClose,
  onOpenIncident,
}: {
  residentId: string;
  onClose: () => void;
  onOpenIncident: (incidentId: string) => void;
}) {
  const { residents, notes, incidents, actions } = useCompass();
  const resident = residents.find((r) => r.id === residentId);
  if (!resident) return null;

  const residentNotes = notes.filter((n) => n.residentId === residentId).slice(0, 3);
  const residentIncidents = incidents.filter((i) => i.residentId === residentId);
  const openActions = actions.filter((a) => a.residentId === residentId && !a.done);

  return (
    <Modal label={`${resident.name} record`} onClose={onClose} wide>
        <div className="modal-head">
          <h2>{resident.name}</h2>
          <RagPill rag={resident.rag} />
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="incident-lede">
            Age {resident.age} · {resident.room} · Admitted {resident.admitted} · Key worker {resident.keyWorker}
          </p>

          <div className={`risk-box ${resident.rag === "red" ? "risk-red" : ""}`}>
            <div className="risk-title">Risk summary</div>
            {resident.riskSummary}
            <div className="risk-when">Last updated {resident.riskUpdated}</div>
          </div>

          {residentIncidents.length > 0 && (
            <>
              <div className="section-label">Incident reports</div>
              <div className="row-list">
                {residentIncidents.map((inc) => (
                  <button className="row row-button" key={inc.id} onClick={() => onOpenIncident(inc.id)}>
                    <div className="row-main">
                      <div className="row-title">{inc.ref}</div>
                      <div className="row-sub">
                        {inc.fields[0]?.value} · raised by {inc.raisedBy}, {inc.raisedAt}
                      </div>
                    </div>
                    <span
                      className={`pill ${
                        inc.status === "signed" ? "pill-green" : inc.status === "awaiting-signoff" ? "pill-amber" : "pill-neutral"
                      }`}
                    >
                      {inc.status === "signed"
                        ? "Signed off"
                        : inc.status === "awaiting-signoff"
                        ? "Needs sign-off"
                        : "With worker"}
                    </span>
                  </button>
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

          {openActions.length > 0 && (
            <>
              <div className="section-label">Open actions with the team</div>
              <div className="row-list">
                {openActions.map((a) => (
                  <div className="row" key={a.id}>
                    <div className="row-main">
                      <div className="row-title">{a.label}</div>
                      <div className="row-sub">{a.source}</div>
                    </div>
                    <span className="row-meta">{a.due}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="section-label">Recent case notes</div>
          <div className="row-list">
            {residentNotes.length === 0 && <p className="ask-empty">No case notes recorded yet.</p>}
            {residentNotes.map((n) => (
              <div className="note-item" key={n.id}>
                <div className="note-item-top">
                  <span className="note-type">{n.type}</span>
                  <span className="note-when">
                    {n.when} · {n.author}
                  </span>
                </div>
                <div className="note-summary">{n.summary}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <AskCompass resident={resident} />
          </div>
        </div>
    </Modal>
  );
}
