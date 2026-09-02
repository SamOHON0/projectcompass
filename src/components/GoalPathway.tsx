import { goalStatus } from "@/lib/types";
import type { Goal } from "@/lib/types";

/**
 * A goal shown as a position on a named pathway.
 *
 * The stage name is the point. "Application in, on the list next" tells a
 * worker what happens next; a percentage tells them nothing they can act on,
 * and implies a measurement the service never took.
 */
export default function GoalPathway({ goal }: { goal: Goal }) {
  const status = goalStatus(goal);
  const current = goal.stages[goal.stageIndex] ?? goal.stages[0];
  const next = goal.stageIndex < goal.stages.length - 1 ? goal.stages[goal.stageIndex + 1] : null;

  return (
    <div className="goal">
      <div className="goal-head">
        <span className="goal-area">{goal.area}</span>
        <span className="goal-label">{goal.label}</span>
        {status === "achieved" && <span className="pill pill-green">Achieved</span>}
        {status === "stalled" && <span className="pill pill-amber">Stalled {goal.stalledFor}</span>}
      </div>

      <ol className={`steps steps-${status}`} aria-label={`${goal.area} pathway`}>
        {goal.stages.map((stage, i) => {
          const state = i < goal.stageIndex ? "done" : i === goal.stageIndex ? "current" : "todo";
          return (
            <li key={stage} className={`step step-${state}`}>
              <span className="step-mark" aria-hidden />
              <span className="step-name">{stage}</span>
            </li>
          );
        })}
      </ol>

      <p className="goal-now">
        {status === "achieved" ? (
          <>All stages complete.</>
        ) : (
          <>
            Now at <strong>{current}</strong>
            {next && <>, next is {next.toLowerCase()}</>}.
          </>
        )}
      </p>
    </div>
  );
}
