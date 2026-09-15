export type Rag = "green" | "amber" | "red";

export type Role = "worker" | "manager";

export type GoalArea =
  | "Housing"
  | "Health"
  | "Benefits"
  | "Life skills"
  | "Documentation"
  | "Education & work";

/**
 * Goals are tracked as named stages on a pathway, not as a percentage.
 *
 * A housing application is not "70% done"; it is at a stage, and the stage is
 * what a worker can act on. Percentages here would invent a measurement the
 * service does not take.
 */
export interface Goal {
  id: string;
  area: GoalArea;
  label: string;
  stages: string[];
  /** Index into stages. The last stage means the goal is achieved. */
  stageIndex: number;
  /** Set when the goal has not moved for a while; the value is how long. */
  stalledFor?: string;
}

/** Where a resident is on the journey out. A keyworker judgement, not a score. */
export type MoveOnBand = "early" | "building" | "nearly" | "ready";

export const MOVE_ON_LABEL: Record<MoveOnBand, string> = {
  early: "Early stages",
  building: "Building",
  nearly: "Nearly ready",
  ready: "Ready to move on",
};

export function goalStatus(goal: Goal): "achieved" | "stalled" | "on-track" {
  if (goal.stageIndex >= goal.stages.length - 1) return "achieved";
  return goal.stalledFor ? "stalled" : "on-track";
}

export interface ActionItem {
  id: string;
  residentId: string | null;
  label: string;
  due: string; // human readable, e.g. "Today", "Tue 18 Aug"
  overdue: boolean;
  source: string; // where Compass derived it from
  done: boolean;
  isNew?: boolean;
}

export interface CaseNote {
  id: string;
  residentId: string;
  author: string;
  when: string;
  type: string;
  summary: string;
  body: string;
  flags: string[];
  isNew?: boolean;
}

export interface Resident {
  id: string;
  name: string;
  age: number;
  room: string;
  keyWorker: string;
  rag: Rag;
  ragReason: string;
  moveOnBand: MoveOnBand;
  /** When something on this resident's plan last moved forward. */
  lastMovement: string;
  /** Set when nothing has moved for a while. Drives the manager's attention. */
  stalledFor?: string;
  admitted: string;
  priorities: string[];
  nextAppointment: string;
  goals: Goal[];
  riskSummary: string;
  riskUpdated: string;
}

export interface HandoverItem {
  id: string;
  residentId: string | null;
  text: string;
  tone: "info" | "attention" | "risk";
  when: string;
  isNew?: boolean;
}

export type IncidentStatus = "needs-worker" | "awaiting-signoff" | "signed";

export interface IncidentField {
  label: string;
  value: string;
  /** true when Compass filled this from the case note */
  prefilled: boolean;
  /** true when a human must supply it; Compass deliberately does not guess */
  humanOnly?: boolean;
  multiline?: boolean;
}

export interface IncidentRecord {
  id: string;
  ref: string;
  residentId: string;
  raisedBy: string;
  raisedAt: string;
  status: IncidentStatus;
  fields: IncidentField[];
  signedBy?: string;
  signedAt?: string;
  managerNote?: string;
}

export interface ManagerAlert {
  id: string;
  kind: "incident" | "safeguarding" | "risk-change" | "operational";
  title: string;
  detail: string;
  when: string;
  status: "awaiting-review" | "acknowledged";
  isNew?: boolean;
  /** links the alert to a resident record for manager drill-down */
  residentId?: string;
  incidentId?: string;
}

/**
 * A routine, mandatory task that sits alongside case management: wellbeing
 * checks, the bedlist, fire checks for a worker; the relief tracker, the
 * occupancy return, the alarm test for a manager. Bill asked for these because
 * they are the other half of a shift, and staff should not have to keep them in
 * their heads or on a separate sheet.
 */
export interface DailyTask {
  id: string;
  role: Role;
  /** When it is due, as staff would say it: "09:00", "By 14:00". */
  time: string;
  label: string;
  detail: string;
  /** Shown instead of detail once the task is done, e.g. "Sent 09:48". */
  doneDetail?: string;
  /** The state while not done. "overdue" is what the service calls outstanding. */
  status: "due" | "overdue" | "later";
  done: boolean;
  /** A line Compass adds once the incident has been recorded this shift. */
  compassNoteAfterIncident?: string;
}
