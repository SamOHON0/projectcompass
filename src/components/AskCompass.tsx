"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { askCompass, SUGGESTED_QUESTIONS, type AssistantAnswer } from "@/lib/assistant";
import { useCompass } from "@/lib/store";
import type { Resident } from "@/lib/types";

interface Turn {
  id: number;
  question: string;
  answer: AssistantAnswer | null; // null while "thinking"
}

let turnId = 0;

export default function AskCompass({ resident }: { resident: Resident }) {
  const { demoRan } = useCompass();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setTurns([]);
    setDraft("");
  }, [resident.id]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  const ask = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!q) return;
      const id = ++turnId;
      setTurns((prev) => [...prev, { id, question: q, answer: null }]);
      setDraft("");
      const t = setTimeout(() => {
        const answer = askCompass(resident.id, resident.name, q, {
          incidentRecorded: demoRan,
          riskLevel: resident.rag,
        });
        setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, answer } : turn)));
      }, 700);
      timers.current.push(t);
    },
    [resident, demoRan]
  );

  const suggestions = SUGGESTED_QUESTIONS[resident.id] ?? ["Catch me up", "What are the risks right now?"];
  const firstName = resident.name.split(" ")[0];

  return (
    <section className="card ask">
      <div className="card-head">
        <h2>Ask Compass</h2>
        <span className="sub">about {firstName}&apos;s record</span>
      </div>
      <div className="card-body">
        {turns.length === 0 && (
          <p className="ask-empty">
            Compass has read {firstName}&apos;s case notes, support plan, risk assessments and correspondence. Ask
            anything, or start with one of these.
          </p>
        )}

        <div className="ask-thread">
          {turns.map((turn) => (
            <div key={turn.id}>
              <div className="ask-q">{turn.question}</div>
              {turn.answer === null ? (
                <div className="ask-a ask-thinking">
                  <span className="ask-dots" aria-label="Compass is thinking">
                    <i />
                    <i />
                    <i />
                  </span>
                  Reading {firstName}&apos;s record
                </div>
              ) : (
                <div className="ask-a">
                  <p>{turn.answer.text}</p>
                  {turn.answer.sources.length > 0 && (
                    <div className="ask-sources">
                      <span className="ask-sources-label">Based on</span>
                      {turn.answer.sources.map((s) => (
                        <span className="pill pill-neutral" key={s}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {turn.answer.suggestedActions && turn.answer.suggestedActions.length > 0 && (
                    <div className="ask-actions">
                      {turn.answer.suggestedActions.map((a) => (
                        <span className="pill pill-accent" key={a}>
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  {turn.answer.followUps.length > 0 && (
                    <div className="ask-chips">
                      {turn.answer.followUps.map((f) => (
                        <button className="chip" key={f} onClick={() => ask(f)}>
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {turns.length === 0 && (
          <div className="ask-chips">
            {suggestions.map((s) => (
              <button className="chip" key={s} onClick={() => ask(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          className="ask-form"
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
        >
          <label className="sr-only" htmlFor={`ask-${resident.id}`}>
            Ask Compass about {resident.name}
          </label>
          <input
            id={`ask-${resident.id}`}
            className="ask-input"
            placeholder={`Ask about ${firstName}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={!draft.trim()}>
            Ask
          </button>
        </form>
        <p className="ask-note">
          Compass answers from this resident&apos;s record only. Every answer shows what it drew on.
        </p>
      </div>
    </section>
  );
}
