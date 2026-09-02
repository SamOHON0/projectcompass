// Simulated Compass intelligence for the prototype.
// In production this layer would call an LLM with service policies and the
// resident's history as context. Here the output is deterministic so the
// demo always tells the same story.

export interface LanguageSuggestion {
  original: string;
  suggested: string;
  reason: string;
}

export interface StructuredNoteResult {
  type: string;
  summary: string;
  structured: { heading: string; text: string }[];
  languageSuggestions: LanguageSuggestion[];
  adminPrompts: string[];
  newActions: { label: string; due: string; source: string }[];
  riskChange: { to: "red" | "amber" | "green"; reason: string } | null;
  handoverText: string;
  managerAlert: { title: string; detail: string; kind: "incident" | "risk-change" };
}

import type { IncidentField } from "./types";

/**
 * Compass drafts the incident report from the case note it just structured.
 * Two fields are deliberately left for the worker: Compass does not invent
 * who was present or what the resident said in his own words.
 */
export function draftIncidentFields(residentName: string): IncidentField[] {
  const firstName = residentName.split(" ")[0];
  return [
    { label: "Incident type", value: "Verbal aggression toward staff", prefilled: true },
    { label: "Date and time", value: "Monday 17 August 2026, 14:00", prefilled: true },
    { label: "Location", value: "Room 4, Cara House", prefilled: true },
    { label: "Resident involved", value: residentName, prefilled: true },
    { label: "Staff involved", value: "Aoife Brennan, Project Worker", prefilled: true },
    {
      label: "Description of incident",
      value: `Welfare check completed at 14:00 in ${firstName}'s room. ${firstName} was intoxicated and became verbally agitated and raised his voice when asked about the missed GP appointment. No threats were made and there was no physical contact. The situation de-escalated through conversation and ${firstName} accepted a cup of tea in the communal kitchen.`,
      prefilled: true,
      multiline: true,
    },
    {
      label: "Immediate action taken",
      value: "Verbal de-escalation. Resident moved to communal area. Welfare monitored for the remainder of the shift. Deputy Manager notified through Compass.",
      prefilled: true,
      multiline: true,
    },
    { label: "Injuries", value: "None reported", prefilled: true },
    { label: "Emergency services required", value: "No", prefilled: true },
    { label: "Risk assessment review required", value: "Yes, risk raised to Red", prefilled: true },
    {
      label: "Other people present",
      value: "",
      prefilled: false,
      humanOnly: true,
    },
    {
      label: "Resident's account in their own words",
      value: "",
      prefilled: false,
      humanOnly: true,
      multiline: true,
    },
  ];
}

export const PIPELINE_STEPS = [
  "Structuring case note",
  "Reviewing language",
  "Updating actions",
  "Assessing risk",
  "Preparing handover",
  "Notifying manager view",
];

export function processNote(residentName: string, raw: string): StructuredNoteResult {
  const firstName = residentName.split(" ")[0];
  const mentionsDrink = /drink|intoxicat|alcohol/i.test(raw);
  const mentionsAggression = /aggressive|aggression|kicked off|threatening/i.test(raw);
  const mentionsMissed = /missed|did not attend|didn't attend/i.test(raw);

  return {
    type: mentionsAggression ? "Welfare check with incident" : "Welfare check",
    summary: `${firstName} intoxicated at welfare check, verbally agitated when GP appointment raised. Drinking since Thursday following family news. De-escalated. Stating he will not attend housing meeting tomorrow.`,
    structured: [
      { heading: "What happened", text: `Welfare check completed at 14:00 in ${firstName}'s room. ${firstName} was intoxicated and became verbally agitated and raised his voice when asked about the missed GP appointment. Situation de-escalated through conversation and ${firstName} accepted a cup of tea in the communal kitchen.` },
      { heading: "Context", text: `${firstName} reports drinking since Thursday after receiving difficult news about his brother. This follows several weeks of increasing alcohol use.` },
      { heading: "Resident voice", text: `${firstName} says he does not want to attend tomorrow's housing meeting with the council.` },
      { heading: "Plan", text: "Follow-up conversation when sober. Encourage attendance at housing meeting or seek to reschedule. Re-refer to community alcohol support." },
    ],
    languageSuggestions: mentionsAggression
      ? [
          {
            original: "got aggressive",
            suggested: "became verbally agitated and raised his voice",
            reason: "More specific and trauma-informed. Describes the behaviour rather than labelling the person.",
          },
        ]
      : [],
    adminPrompts: [
      "An incident report is likely required: verbal aggression during a welfare check.",
      mentionsDrink ? "Risk assessment review suggested: escalation in alcohol use since Thursday." : "",
      mentionsMissed ? "Missed health appointment should be recorded against the GP engagement goal." : "",
    ].filter(Boolean),
    newActions: [
      { label: `Follow-up conversation with ${firstName} when sober, before housing meeting`, due: "Today", source: "Compass, from this case note" },
      { label: "Contact housing officer: attendance at risk for Tuesday meeting", due: "Today", source: "Compass, from this case note" },
      { label: "Re-refer to community alcohol support service", due: "Tomorrow", source: "Compass, from this case note" },
    ],
    riskChange: mentionsDrink
      ? { to: "red", reason: "Sustained drinking episode, verbal aggression, and disengagement from housing plan in the same 24 hours." }
      : null,
    handoverText: `${residentName}: intoxicated at 14:00 welfare check, verbally agitated but de-escalated. Drinking since Thursday (family news). Saying he will not attend tomorrow's housing meeting. Incident report pending. Please check in this evening and record any further drinking.`,
    managerAlert: {
      title: `Incident during welfare check, ${residentName}`,
      detail: "Verbal aggression while intoxicated. De-escalated by Aoife Brennan. Compass has raised risk to Red and drafted an incident report for review. Housing meeting attendance now at risk.",
      kind: "incident",
    },
  };
}
