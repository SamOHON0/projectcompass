"use client";

import { useState } from "react";
import { useCompass } from "@/lib/store";
import Modal from "@/components/Modal";
import type { IncidentRecord, Role } from "@/lib/types";

export default function IncidentReport({
  incident,
  role,
  onClose,
}: {
  incident: IncidentRecord;
  role: Role;
  onClose: () => void;
}) {
  const { residents, updateIncidentField, submitIncident, signIncident } = useCompass();
  const [managerNote, setManagerNote] = useState("");
  const resident = residents.find((r) => r.id === incident.residentId);

  const outstanding = incident.fields.filter((f) => f.humanOnly && !f.value.trim());
  const canSubmit = outstanding.length === 0;
  const editable = role === "worker" && incident.status === "needs-worker";

  const statusPill =
    incident.status === "signed" ? (
      <span className="pill pill-green">Signed off</span>
    ) : incident.status === "awaiting-signoff" ? (
      <span className="pill pill-amber">Awaiting manager sign-off</span>
    ) : (
      <span className="pill pill-amber">Needs your input</span>
    );

  return (
    <Modal label={`Incident report ${incident.ref}`} onClose={onClose}>
        <div className="modal-head">
          <h2>Incident report {incident.ref}</h2>
          {statusPill}
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="incident-lede">
            Compass drafted this from your case note. {resident ? resident.name : "The resident"} ·{" "}
            {incident.raisedBy} · {incident.raisedAt}
          </p>

          {editable && outstanding.length > 0 && (
            <div className="flow-banner flow-banner-amber">
              <strong>
                {outstanding.length} field{outstanding.length > 1 ? "s" : ""} left for you.
              </strong>{" "}
              Compass does not fill these in. Who else was present and what the resident said in their own words are
              yours to record.
            </div>
          )}

          <div className="incident-fields">
            {incident.fields.map((f) => {
              const fieldId = `${incident.id}-${f.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              const isInput = editable && f.humanOnly;
              return (
              <div className="incident-field" key={f.label}>
                <div className="incident-field-head">
                  {isInput ? (
                    <label className="field-label" htmlFor={fieldId}>
                      {f.label}
                    </label>
                  ) : (
                    <span className="field-label">{f.label}</span>
                  )}
                  {f.prefilled ? (
                    <span className="pill pill-accent">Compass drafted</span>
                  ) : (
                    <span className={`pill ${f.value.trim() ? "pill-neutral" : "pill-amber"}`}>
                      {f.value.trim() ? "You added this" : "Needs your input"}
                    </span>
                  )}
                </div>
                {isInput ? (
                  f.multiline ? (
                    <textarea
                      id={fieldId}
                      className="note-textarea incident-input"
                      value={f.value}
                      placeholder="Record in the resident's own words where possible"
                      onChange={(e) => updateIncidentField(incident.id, f.label, e.target.value)}
                    />
                  ) : (
                    <input
                      id={fieldId}
                      className="ask-input incident-input"
                      value={f.value}
                      placeholder="Names and roles, or None"
                      onChange={(e) => updateIncidentField(incident.id, f.label, e.target.value)}
                    />
                  )
                ) : (
                  <div className={`incident-value ${f.value.trim() ? "" : "incident-value-empty"}`}>
                    {f.value.trim() || "Not completed"}
                  </div>
                )}
              </div>
              );
            })}
          </div>

          {incident.status === "signed" && (
            <div className="result-block">
              <h3>Manager sign-off</h3>
              <p>
                Signed by {incident.signedBy}, {incident.signedAt}.
              </p>
              {incident.managerNote && <p>{incident.managerNote}</p>}
            </div>
          )}

          {editable && (
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => submitIncident(incident.id)} disabled={!canSubmit}>
                Submit for sign-off
              </button>
              <button className="btn btn-ghost" onClick={onClose}>
                Save and close
              </button>
              {!canSubmit && (
                <span className="field-help" style={{ marginTop: 0 }}>
                  Complete the two fields above to submit.
                </span>
              )}
            </div>
          )}

          {role === "worker" && incident.status === "awaiting-signoff" && (
            <>
              <div className="flow-banner">
                <strong>Submitted for sign-off.</strong> This is now with Niamh Kavanagh, and it is off your actions
                list. The risk review she needs is already on hers.
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={onClose}>
                  Back to my day
                </button>
              </div>
            </>
          )}

          {role === "worker" && incident.status === "signed" && (
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          )}

          {role === "manager" && incident.status === "awaiting-signoff" && (
            <>
              <div style={{ marginTop: 16 }}>
                <label className="field-label" htmlFor="manager-note">
                  Management comment
                </label>
                <textarea
                  id="manager-note"
                  className="note-textarea"
                  style={{ minHeight: 80 }}
                  placeholder="Any follow-up, debrief or supervision point"
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    signIncident(incident.id, managerNote.trim());
                    onClose();
                  }}
                >
                  Sign off report
                </button>
                <button className="btn btn-ghost" onClick={onClose}>
                  Close without signing
                </button>
              </div>
            </>
          )}

          {role === "manager" && incident.status === "needs-worker" && (
            <div className="modal-actions">
              <span className="field-help" style={{ marginTop: 0 }}>
                Aoife has not submitted this yet. Two fields are still with her.
              </span>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          )}

          {role === "manager" && incident.status === "signed" && (
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
    </Modal>
  );
}
