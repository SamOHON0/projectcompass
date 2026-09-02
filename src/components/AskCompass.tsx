"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { askCompass, SUGGESTED_QUESTIONS, type AssistantAnswer } from "@/lib/assistant";
import { useCompass } from "@/lib/store";
import type { Resident } from "@/lib/types";

interface Turn {
  id: number;
  question: string;
  answer: (AssistantAnswer & { live?: boolean; note?: string }) | null;
}

let turnId = 0;

type LiveResult =
  | { kind: "live"; answer: AssistantAnswer }
  | { kind: "rate-limited"; reason: string }
  | { kind: "unavailable" };

async function askLive(
  resident: Resident,
  question: string,
  incidentRecorded: boolean,
  signal: AbortSignal
): Promise<LiveResult> {
  const res = await fetch("/api/ask", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      question,
      residentId: resident.id,
      residentName: resident.name,
      incidentRecorded,
    }),
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({ reason: "" }));
    return { kind: "rate-limited", reason: body.reason || "rate limit reached" };
  }
  if (!res.ok) return { kind: "unavailable" };

  const data = await res.json();
  if (typeof data?.text !== "string" || !data.text.trim()) return { kind: "unavailable" };

  return {
    kind: "live",
    answer: {
      text: data.text,
      sources: Array.isArray(data.sources) ? data.sources : [],
      followUps: Array.isArray(data.followUps) ? data.followUps : [],
      suggestedActions: Array.isArray(data.suggestedActions) ? data.suggestedActions : [],
    },
  };
}

export default function AskCompass({ resident }: { resident: Resident }) {
  const { demoRan } = useCompass();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [liveAvailable, setLiveAvailable] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const aborters = useRef<AbortController[]>([]);

  useEffect(() => {
    setTurns([]);
    setDraft("");
  }, [resident.id]);

  // Ask the server once whether a key is configured, so the badge is honest.
  // Skipped when the page is not served over http, which is the case for the
  // static preview harness where there is no route to call.
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.protocol.startsWith("http")) return;
    let cancelled = false;
    fetch("/api/ask")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.live) setLiveAvailable(true);
      })
      .catch(() => {
        /* stay on prepared answers */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      aborters.current.forEach((a) => a.abort());
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

      const scripted = () =>
        askCompass(resident.id, resident.name, q, {
          incidentRecorded: demoRan,
          riskLevel: resident.rag,
        });

      const settle = (answer: Turn["answer"]) =>
        setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, answer } : t)));

      if (!liveAvailable) {
        // Prepared answers, with a beat so it does not feel instantaneous.
        const t = setTimeout(() => settle({ ...scripted(), live: false }), 700);
        timers.current.push(t);
        return;
      }

      const controller = new AbortController();
      aborters.current.push(controller);
      askLive(resident, q, demoRan, controller.signal)
        .then((result) => {
          if (result.kind === "live") {
            settle({ ...result.answer, live: true });
          } else if (result.kind === "rate-limited") {
            settle({ ...scripted(), live: false, note: `Live answers paused: ${result.reason}.` });
          } else {
            settle({ ...scripted(), live: false, note: "Live answer unavailable, showing the prepared one." });
          }
        })
        .catch((err) => {
          if (err?.name === "AbortError") return;
          settle({ ...scripted(), live: false, note: "Live answer unavailable, showing the prepared one." });
        });
    },
    [resident, demoRan, liveAvailable]
  );

  const suggestions = SUGGESTED_QUESTIONS[resident.id] ?? ["Catch me up", "What are the risks right now?"];
  const firstName = resident.name.split(" ")[0];

  return (
    <section className="card ask">
      <div className="card-head">
        <h2>Ask Compass</h2>
        <span className="sub">about {firstName}&apos;s record</span>
        {liveAvailable && <span className="pill pill-accent">Live</span>}
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
                  {turn.answer.note && <p className="ask-note ask-note-inline">{turn.answer.note}</p>}
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
            maxLength={300}
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
