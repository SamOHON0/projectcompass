"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ActionItem, CaseNote, DailyTask, HandoverItem, IncidentRecord, ManagerAlert, Resident } from "./types";
import { DAILY_TASKS, INITIAL_ACTIONS, INITIAL_ALERTS, INITIAL_HANDOVER, INITIAL_NOTES, RESIDENTS, SERVICE } from "./data";
import { draftIncidentFields, processNote, type StructuredNoteResult } from "./ai";

interface CompassState {
  residents: Resident[];
  actions: ActionItem[];
  notes: CaseNote[];
  handover: HandoverItem[];
  alerts: ManagerAlert[];
  incidents: IncidentRecord[];
  dailyTasks: DailyTask[];
  demoRan: boolean;
  submitNote: (residentId: string, raw: string, result: StructuredNoteResult) => void;
  toggleAction: (id: string) => void;
  toggleDailyTask: (id: string) => void;
  runPipeline: (residentId: string, raw: string) => StructuredNoteResult;
  updateIncidentField: (incidentId: string, label: string, value: string) => void;
  submitIncident: (incidentId: string) => void;
  signIncident: (incidentId: string, note: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  resetDemo: () => void;
}

const CompassContext = createContext<CompassState | null>(null);

let uid = 0;
const nextId = (prefix: string) => `${prefix}-${++uid}`;

export function CompassProvider({ children }: { children: React.ReactNode }) {
  const [residents, setResidents] = useState<Resident[]>(RESIDENTS);
  const [actions, setActions] = useState<ActionItem[]>(INITIAL_ACTIONS);
  const [notes, setNotes] = useState<CaseNote[]>(INITIAL_NOTES);
  const [handover, setHandover] = useState<HandoverItem[]>(INITIAL_HANDOVER);
  const [alerts, setAlerts] = useState<ManagerAlert[]>(INITIAL_ALERTS);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(DAILY_TASKS);
  const [demoRan, setDemoRan] = useState(false);

  const runPipeline = useCallback((residentId: string, raw: string) => {
    const resident = RESIDENTS.find((r) => r.id === residentId);
    return processNote(resident ? resident.name : "the resident", raw);
  }, []);

  const submitNote = useCallback((residentId: string, raw: string, result: StructuredNoteResult) => {
    const resident = residents.find((r) => r.id === residentId);
    if (!resident) return;

    setNotes((prev) => [
      {
        id: nextId("note"),
        residentId,
        author: SERVICE.workerName,
        when: "Just now",
        type: result.type,
        summary: result.summary,
        body: result.structured.map((s) => `${s.heading}: ${s.text}`).join("\n"),
        flags: result.riskChange ? ["Risk raised", "Incident report pending"] : [],
        isNew: true,
      },
      ...prev,
    ]);

    setActions((prev) => [
      ...result.newActions.map((a) => ({
        id: nextId("action"),
        residentId,
        label: a.label,
        due: a.due,
        overdue: false,
        source: a.source,
        done: false,
        isNew: true,
      })),
      ...prev,
    ]);

    if (result.riskChange) {
      const change = result.riskChange;
      setResidents((prev) =>
        prev.map((r) =>
          r.id === residentId
            ? { ...r, rag: change.to, ragReason: change.reason, riskSummary: `Raised by Compass today. ${change.reason}`, riskUpdated: "Today" }
            : r
        )
      );
    }

    setHandover((prev) => [
      { id: nextId("handover"), residentId, text: result.handoverText, tone: "risk", when: "Just now", isNew: true },
      ...prev,
    ]);

    const incidentId = nextId("incident");
    setIncidents((prev) => [
      {
        id: incidentId,
        ref: "INC-2026-042",
        residentId,
        raisedBy: SERVICE.workerName,
        raisedAt: "Today, 14:20",
        status: "needs-worker",
        fields: draftIncidentFields(resident.name),
      },
      ...prev,
    ]);

    setAlerts((prev) => [
      {
        id: nextId("alert"),
        kind: result.managerAlert.kind,
        title: result.managerAlert.title,
        detail: result.managerAlert.detail,
        when: "Just now",
        status: "awaiting-review",
        isNew: true,
        residentId,
        incidentId,
      },
      ...prev,
    ]);

    setActions((prev) => [
      {
        id: nextId("action"),
        residentId,
        label: "Complete incident report INC-2026-042",
        due: "Before end of shift",
        overdue: false,
        source: "Compass drafted this from your case note",
        done: false,
        isNew: true,
      },
      ...prev,
    ]);

    setDemoRan(true);
  }, [residents]);

  const updateIncidentField = useCallback((incidentId: string, label: string, value: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, fields: inc.fields.map((f) => (f.label === label ? { ...f, value } : f)) }
          : inc
      )
    );
  }, []);

  const submitIncident = useCallback((incidentId: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, status: "awaiting-signoff" } : inc))
    );
    setActions((prev) =>
      prev.map((a) => (a.label.includes("INC-2026-042") ? { ...a, done: true } : a))
    );
  }, []);

  const signIncident = useCallback((incidentId: string, note: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, status: "signed", signedBy: SERVICE.managerName, signedAt: "Today", managerNote: note }
          : inc
      )
    );
    setAlerts((prev) =>
      prev.map((a) => (a.incidentId === incidentId ? { ...a, status: "acknowledged" } : a))
    );
  }, []);

  /** Puts the walkthrough back to its opening state without a page reload. */
  const resetDemo = useCallback(() => {
    setResidents(RESIDENTS);
    setActions(INITIAL_ACTIONS);
    setNotes(INITIAL_NOTES);
    setHandover(INITIAL_HANDOVER);
    setAlerts(INITIAL_ALERTS);
    setIncidents([]);
    setDailyTasks(DAILY_TASKS);
    setDemoRan(false);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: "acknowledged" } : a)));
  }, []);

  const toggleAction = useCallback((id: string) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a)));
  }, []);

  const toggleDailyTask = useCallback((id: string) => {
    setDailyTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const value = useMemo(
    () => ({
      residents,
      actions,
      notes,
      handover,
      alerts,
      incidents,
      dailyTasks,
      demoRan,
      submitNote,
      toggleAction,
      toggleDailyTask,
      runPipeline,
      updateIncidentField,
      submitIncident,
      signIncident,
      acknowledgeAlert,
      resetDemo,
    }),
    [
      residents,
      actions,
      notes,
      handover,
      alerts,
      incidents,
      dailyTasks,
      demoRan,
      submitNote,
      toggleAction,
      toggleDailyTask,
      runPipeline,
      updateIncidentField,
      submitIncident,
      signIncident,
      acknowledgeAlert,
      resetDemo,
    ]
  );

  return <CompassContext.Provider value={value}>{children}</CompassContext.Provider>;
}

export function useCompass(): CompassState {
  const ctx = useContext(CompassContext);
  if (!ctx) throw new Error("useCompass must be used within CompassProvider");
  return ctx;
}
