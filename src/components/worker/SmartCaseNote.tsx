"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCompass } from "@/lib/store";
import Modal from "@/components/Modal";
import { EXAMPLE_NOTE_TEXT, SERVICE } from "@/lib/data";
import { PIPELINE_STEPS, type StructuredNoteResult } from "@/lib/ai";

type Stage = "compose" | "processing" | "review" | "saved";

export default function SmartCaseNote({
  onClose,
  defaultResidentId = "michael-doyle",
  debugStage,
}: {
  onClose: () => void;
  defaultResidentId?: string;
  debugStage?: Stage;
}) {
  const { residents, runPipeline, submitNote } = useCompass();
  const [stage, setStage] = useState<Stage>(debugStage ?? "compose");
  const [residentId, setResidentId] = useState(defaultResidentId);
  const [text, setText] = useState(debugStage ? EXAMPLE_NOTE_TEXT : "");
  const [stepIndex, setStepIndex] = useState(debugStage === "processing" ? 2 : 0);
  const [result, setResult] = useState<StructuredNoteResult | null>(
    debugStage === "review" || debugStage === "saved" ? runPipeline(defaultResidentId, EXAMPLE_NOTE_TEXT) : null
  );
  const [suggestionApplied, setSuggestionApplied] = useState(false);

  const resident = useMemo(() => residents.find((r) => r.id === residentId), [residents, residentId]);

  useEffect(() => {
    if (stage !== "processing" || debugStage) return;
    if (stepIndex >= PIPELINE_STEPS.length) {
      setResult(runPipeline(residentId, text));
      setStage("review");
      return;
    }
    const t = setTimeout(() => setStepIndex((i) => i + 1), 550);
    return () => clearTimeout(t);
  }, [stage, stepIndex, residentId, text, runPipeline, debugStage]);

  const startProcessing = () => {
    if (!text.trim()) return;
    setStepIndex(0);
    setStage("processing");
  };

  const save = () => {
    if (!result) return;
    submitNote(residentId, text, result);
    setStage("saved");
  };

  return (
    <Modal label="Smart case note" onClose={onClose}>
        <div className="modal-head">
          <h2>Smart case note</h2>
          {resident && <span className="pill pill-neutral">{resident.name}</span>}
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {stage === "compose" && (
            <>
              <label className="field-label" htmlFor="note-resident">
                Resident
              </label>
              <select id="note-resident" className="select" value={residentId} onChange={(e) => setResidentId(e.target.value)}>
                {residents
                  .filter((r) => r.keyWorker === SERVICE.workerName)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>

              <div style={{ marginTop: 16 }}>
                <label className="field-label" htmlFor="note-text">
                  What happened?
                </label>
                <textarea
                  id="note-text"
                  className="note-textarea"
                  placeholder="Record it once, in your own words. Compass structures it, checks the language, and routes it to the right places."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <p className="field-help">
                  Write naturally. Compass will structure the note, suggest clear, factual, trauma-informed wording
                  without changing what happened, create any follow-up actions, and update handover and management views.
                </p>
              </div>

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={startProcessing} disabled={!text.trim()}>
                  Process with Compass
                </button>
                <button className="btn btn-secondary" onClick={() => setText(EXAMPLE_NOTE_TEXT)}>
                  Insert example note
                </button>
              </div>
            </>
          )}

          {stage === "processing" && (
            <>
              <p style={{ marginTop: 0, color: "var(--ink-soft)" }}>
                Compass is reading the note against {resident ? resident.name.split(" ")[0] : "the resident"}&apos;s
                history, goals and the service&apos;s recording policies.
              </p>
              <div className="pipeline">
                {PIPELINE_STEPS.map((label, i) => {
                  const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "";
                  return (
                    <div key={label} className={`pipe-step ${state}`}>
                      <span className="dot">{i < stepIndex ? "✓" : ""}</span>
                      {label}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {(stage === "review" || stage === "saved") && result && (
            <>
              {stage === "review" && (
                <p style={{ marginTop: 0, color: "var(--ink-soft)" }}>
                  Review what Compass has drafted. Nothing is saved until you approve it.
                </p>
              )}

              <div className="result-block">
                <h3>Structured note, {result.type}</h3>
                {result.structured.map((s) => (
                  <p key={s.heading}>
                    <span className="heading">{s.heading}. </span>
                    {suggestionApplied || result.languageSuggestions.length === 0
                      ? s.text
                      : s.text.replace("became verbally agitated and raised his voice", "got aggressive")}
                  </p>
                ))}
              </div>

              {result.languageSuggestions.length > 0 && (
                <div className="result-block">
                  <h3>Trauma-informed language</h3>
                  {result.languageSuggestions.map((s) => (
                    <div className="suggestion" key={s.original}>
                      <div>
                        <span className="from">&ldquo;{s.original}&rdquo;</span>{" "}
                        <span className="to">&ldquo;{s.suggested}&rdquo;</span>
                      </div>
                      <div className="why">{s.reason}</div>
                      {stage === "review" && (
                        <div style={{ marginTop: 8 }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSuggestionApplied(true)}
                            disabled={suggestionApplied}
                          >
                            {suggestionApplied ? "Applied" : "Apply suggestion"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="result-block">
                <h3>Compass has prepared</h3>
                {result.adminPrompts.map((p) => (
                  <p key={p}>• {p}</p>
                ))}
                {result.newActions.map((a) => (
                  <p key={a.label}>
                    • New action: {a.label} <span style={{ color: "var(--ink-faint)" }}>({a.due})</span>
                  </p>
                ))}
                {result.riskChange && (
                  <p>
                    • Risk level change to <strong style={{ color: "var(--red)" }}>Red</strong>. {result.riskChange.reason}
                  </p>
                )}
              </div>

              {stage === "review" && (
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={save}>
                    Approve and save
                  </button>
                  <button className="btn btn-ghost" onClick={onClose}>
                    Discard
                  </button>
                </div>
              )}

              {stage === "saved" && (
                <>
                  <div className="flow-banner">
                    <strong>Saved and routed.</strong> One note has updated the resident record, your actions, tonight&apos;s
                    handover, and the Manager dashboard.
                  </div>
                  <div className="modal-actions">
                    <Link href="/manager" className="btn btn-primary">
                      See it on the Manager view
                    </Link>
                    <button className="btn btn-secondary" onClick={onClose}>
                      Back to my day
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
    </Modal>
  );
}
