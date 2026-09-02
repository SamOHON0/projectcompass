export type Rag = "green" | "amber" | "red";

export type Role = "worker" | "manager";

export interface Goal {
  id: string;
  area: "Housing" | "Health" | "Benefits" | "Life skills" | "Documentation" | "Education & work";
  label: string;
  progress: number; // 0-100
  status: "on-track" | "stalled" | "achieved";
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
  moveOnProgress: number; // 0-100 towards independent living
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
