"use client";

import { useCompass } from "@/lib/store";
import type { DailyTask, Role } from "@/lib/types";

/**
 * The routine, mandatory side of a shift, shown small so it sits beside case
 * management rather than competing with it. Same component for both roles:
 * Farlen sees wellbeing rounds, the bedlist and fire checks; Brian sees the
 * relief tracker, the occupancy return and the alarm test. What is due,
 * done or outstanding is the whole story here.
 */
function StatusPill({ task }: { task: DailyTask }) {
  if (task.done) return <span className="pill pill-green">Done</span>;
  if (task.status === "overdue") return <span className="pill pill-red">Outstanding</span>;
  if (task.status === "due") return <span className="pill pill-amber">Due</span>;
  return <span className="pill pill-neutral">Later</span>;
}

export default function DailyTasks({ role }: { role: Role }) {
  const { dailyTasks, toggleDailyTask, demoRan } = useCompass();
  const tasks = dailyTasks.filter((t) => t.role === role);
  const done = tasks.filter((t) => t.done).length;
  const outstanding = tasks.filter((t) => !t.done && t.status === "overdue").length;

  return (
    <section className="card" aria-labelledby={`daily-tasks-${role}`}>
      <div className="card-head">
        <h2 id={`daily-tasks-${role}`}>Daily tasks</h2>
        <span className="sub">
          {role === "worker" ? "routine checks alongside your caseload" : "mandatory management tasks today"}
        </span>
        <span className="count">
          {done} of {tasks.length} done{outstanding > 0 ? ` · ${outstanding} outstanding` : ""}
        </span>
      </div>
      <div className="card-body">
        <div className="row-list">
          {tasks.map((t) => {
            const note = demoRan && !t.done ? t.compassNoteAfterIncident : undefined;
            return (
              <label className={`row task-row ${t.done ? "done" : ""}`} key={t.id} style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={t.done}
                  onChange={() => toggleDailyTask(t.id)}
                  aria-label={`${t.label}, ${t.time}`}
                />
                <span className="task-when">{t.time}</span>
                <div className="row-main">
                  <div className="row-title">{t.label}</div>
                  <div className="row-sub">{t.done && t.doneDetail ? t.doneDetail : t.detail}</div>
                  {note && <div className="row-sub task-compass">Compass: {note}</div>}
                </div>
                <StatusPill task={t} />
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}
