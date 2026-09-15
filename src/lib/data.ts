import type { ActionItem, CaseNote, DailyTask, GoalArea, HandoverItem, ManagerAlert, Resident } from "./types";

// All data in this file is fictional sample data for the prototype.

/**
 * The stages each kind of goal moves through.
 *
 * These are the steps a service actually records, which is why goals are shown
 * as a position on a pathway rather than a percentage. Naming the stage tells a
 * worker what to do next; a number does not.
 */
export const PATHWAYS: Record<GoalArea, string[]> = {
  Housing: ["Assessed", "Application in", "On the list", "Viewing or offer", "Tenancy secured"],
  Health: ["Not engaged", "Referral made", "First appointment", "Engaging regularly", "Self-managing"],
  Documentation: ["Identified", "Applied for", "Received", "Complete"],
  Benefits: ["Not claimed", "Application in", "Under review", "In payment"],
  "Life skills": ["Assessed", "Learning with support", "Practising", "Independent"],
  "Education & work": ["Exploring", "Applied", "Placed", "Sustaining"],
};

/**
 * The fictional setting. Bill chose these names: Tina House after his late
 * mother, and Farlen and Brian after his sister and brother, so the story is
 * personal to tell while staying obviously invented. No resident is real.
 */
export const SERVICE = {
  name: "Tina House",
  location: "Portlaoise",
  beds: 18,
  occupied: 17,
  workerName: "Farlen",
  workerRole: "Project Worker",
  managerName: "Brian",
  managerRole: "Manager",
};

export const RESIDENTS: Resident[] = [
  {
    id: "michael-doyle",
    name: "Michael Doyle",
    age: 47,
    room: "Room 4",
    keyWorker: SERVICE.workerName,
    rag: "amber",
    ragReason: "Alcohol use increasing over recent weeks",
    moveOnBand: "building",
    lastMovement: "Documentation completed, 12 Jun",
    stalledFor: "9 weeks",
    admitted: "11 Mar 2026",
    priorities: ["Housing meeting with Laois County Council on Tuesday", "Re-engage with GP after missed appointment"],
    nextAppointment: "Housing meeting, Tue 18 Aug, 11:00",
    riskSummary: "Moderate. Alcohol dependency, low mood following family bereavement last year.",
    riskUpdated: "4 Aug 2026",
    goals: [
      { id: "md-g1", area: "Housing", label: "Social housing application with Laois County Council", stages: PATHWAYS.Housing, stageIndex: 2 },
      { id: "md-g2", area: "Health", label: "Fortnightly GP engagement and alcohol support referral", stages: PATHWAYS.Health, stageIndex: 1, stalledFor: "3 weeks" },
      { id: "md-g3", area: "Documentation", label: "Replace lost birth certificate and PPS card", stages: PATHWAYS.Documentation, stageIndex: 3 },
      { id: "md-g4", area: "Life skills", label: "Budgeting plan ahead of independent tenancy", stages: PATHWAYS["Life skills"], stageIndex: 1 },
    ],
  },
  {
    id: "dara-o-ceallaigh",
    name: "Dara Ó Ceallaigh",
    age: 29,
    room: "Room 11",
    keyWorker: SERVICE.workerName,
    rag: "green",
    ragReason: "Stable and engaging well",
    moveOnBand: "ready",
    lastMovement: "Viewing arranged, 14 Aug",
    admitted: "2 Dec 2025",
    priorities: ["HAP tenancy viewing on Thursday", "Confirm deposit support with council"],
    nextAppointment: "Tenancy viewing, Thu 20 Aug, 14:30",
    riskSummary: "Low. No current concerns. Historic self-harm, last episode over two years ago.",
    riskUpdated: "28 Jul 2026",
    goals: [
      { id: "do-g1", area: "Housing", label: "Secure HAP tenancy and move-on plan", stages: PATHWAYS.Housing, stageIndex: 3 },
      { id: "do-g2", area: "Education & work", label: "Complete SOLAS safe pass course", stages: PATHWAYS["Education & work"], stageIndex: 3 },
      { id: "do-g3", area: "Life skills", label: "Independent cooking and tenancy management", stages: PATHWAYS["Life skills"], stageIndex: 2 },
    ],
  },
  {
    id: "amina-yusuf",
    name: "Amina Yusuf",
    age: 34,
    room: "Room 7",
    keyWorker: SERVICE.workerName,
    rag: "amber",
    ragReason: "HAP application stalled for 3 weeks",
    moveOnBand: "building",
    lastMovement: "Creche place confirmed, 15 Aug",
    admitted: "19 Jan 2026",
    priorities: ["Chase HAP application with council", "Creche place for Layla confirmed, start Monday"],
    nextAppointment: "Key working session, Wed 19 Aug, 10:00",
    riskSummary: "Low to moderate. Financial stress. Sole parent of one child.",
    riskUpdated: "10 Aug 2026",
    goals: [
      { id: "ay-g1", area: "Housing", label: "HAP application and landlord search", stages: PATHWAYS.Housing, stageIndex: 1, stalledFor: "3 weeks" },
      { id: "ay-g2", area: "Benefits", label: "One parent family payment review", stages: PATHWAYS.Benefits, stageIndex: 2 },
      { id: "ay-g3", area: "Life skills", label: "English conversation classes twice weekly", stages: PATHWAYS["Life skills"], stageIndex: 2 },
    ],
  },
  {
    id: "sean-fitzpatrick",
    name: "Sean Fitzpatrick",
    age: 24,
    room: "Room 15",
    keyWorker: SERVICE.workerName,
    rag: "amber",
    ragReason: "Missed two key working sessions in a row",
    moveOnBand: "early",
    lastMovement: "Youthreach application sent, 29 Jul",
    stalledFor: "2 weeks",
    admitted: "6 Jun 2026",
    priorities: ["Re-engage after missed sessions", "Youth mental health referral pending"],
    nextAppointment: "Key working session, Mon 17 Aug, 16:00",
    riskSummary: "Moderate. Care leaver, low engagement, suspected cannabis use.",
    riskUpdated: "12 Aug 2026",
    goals: [
      { id: "sf-g1", area: "Health", label: "Jigsaw youth mental health engagement", stages: PATHWAYS.Health, stageIndex: 1, stalledFor: "5 weeks" },
      { id: "sf-g2", area: "Education & work", label: "Youthreach placement application", stages: PATHWAYS["Education & work"], stageIndex: 1 },
      { id: "sf-g3", area: "Housing", label: "Long-term housing pathway assessment", stages: PATHWAYS.Housing, stageIndex: 0 },
    ],
  },
  {
    id: "patricia-whelan",
    name: "Patricia Whelan",
    age: 58,
    room: "Room 2",
    keyWorker: "Conor Lynch",
    rag: "red",
    ragReason: "Medication non-compliance, COPD deteriorating",
    moveOnBand: "early",
    lastMovement: "Clinic referral made, 5 Aug",
    admitted: "23 Sep 2025",
    priorities: ["Daily medication prompts", "Respiratory clinic referral"],
    nextAppointment: "Respiratory clinic, Fri 21 Aug, 09:15",
    riskSummary: "High. COPD with poor medication compliance. Falls risk.",
    riskUpdated: "15 Aug 2026",
    goals: [
      { id: "pw-g1", area: "Health", label: "Stabilise COPD management with community nurse", stages: PATHWAYS.Health, stageIndex: 2, stalledFor: "4 weeks" },
      { id: "pw-g2", area: "Housing", label: "Supported housing referral for older persons service", stages: PATHWAYS.Housing, stageIndex: 1 },
    ],
  },
  {
    id: "josip-kovac",
    name: "Josip Kovač",
    age: 41,
    room: "Room 9",
    keyWorker: "Mary O'Sullivan",
    rag: "green",
    ragReason: "Engaging well, in part-time work",
    moveOnBand: "nearly",
    lastMovement: "Deposit target on track, 11 Aug",
    admitted: "14 Feb 2026",
    priorities: ["Save deposit, on target for October", "Rental viewings ongoing"],
    nextAppointment: "Key working session, Thu 20 Aug, 17:30",
    riskSummary: "Low. No current concerns.",
    riskUpdated: "1 Aug 2026",
    goals: [
      { id: "jk-g1", area: "Education & work", label: "Sustain part-time warehouse role", stages: PATHWAYS["Education & work"], stageIndex: 3 },
      { id: "jk-g2", area: "Housing", label: "Private rental with rent supplement top-up", stages: PATHWAYS.Housing, stageIndex: 2 },
    ],
  },
];

export const INITIAL_ACTIONS: ActionItem[] = [
  { id: "a1", residentId: "michael-doyle", label: "Confirm Michael's attendance at council housing meeting", due: "Today", overdue: false, source: "Housing goal", done: false },
  { id: "a2", residentId: "sean-fitzpatrick", label: "Key working session with Sean, re-engagement plan", due: "Today 16:00", overdue: false, source: "Missed sessions alert", done: false },
  { id: "a3", residentId: "amina-yusuf", label: "Phone council re HAP application, stalled 3 weeks", due: "Tomorrow", overdue: false, source: "Compass flagged stalled goal", done: false },
  { id: "a4", residentId: "dara-o-ceallaigh", label: "Prepare tenancy viewing checklist with Dara", due: "Wed 19 Aug", overdue: false, source: "Move-on plan", done: false },
  { id: "a5", residentId: "michael-doyle", label: "Follow up missed GP appointment from last week", due: "Fri 14 Aug", overdue: true, source: "Health goal", done: false },
];

export const INITIAL_NOTES: CaseNote[] = [
  {
    id: "n1",
    residentId: "michael-doyle",
    author: "Conor Lynch",
    when: "Sun 16 Aug, 21:40",
    type: "General observation",
    summary: "Michael quiet at evening check, stayed in his room. Declined dinner but took tea.",
    body: "Michael quiet at evening check, stayed in his room. Declined dinner but took tea. Said he was tired.",
    flags: ["Low mood noted"],
  },
  {
    id: "n2",
    residentId: "dara-o-ceallaigh",
    author: SERVICE.workerName,
    when: "Fri 14 Aug, 15:10",
    type: "Key working session",
    summary: "Reviewed move-on plan. Dara confident ahead of Thursday viewing. Deposit support confirmed.",
    body: "Full session covering move-on plan. Dara confident ahead of Thursday viewing. Deposit support confirmed by council.",
    flags: [],
  },
];

export const INITIAL_HANDOVER: HandoverItem[] = [
  { id: "h1", residentId: "michael-doyle", text: "Michael declined dinner Sunday evening and appeared low. Worth a check-in early in your shift.", tone: "attention", when: "Overnight" },
  { id: "h2", residentId: "patricia-whelan", text: "Patricia took morning medications with prompting. Community nurse visiting Wednesday.", tone: "info", when: "This morning" },
  { id: "h3", residentId: "sean-fitzpatrick", text: "Sean back in the building at 02:15, no concerns raised. Reminder his key working session is today at 16:00.", tone: "info", when: "Overnight" },
  { id: "h4", residentId: null, text: "Fire panel showed a fault on zone 2 overnight, cleared by 06:30. Engineer booked for Tuesday morning. Include the top-floor exits in today's fire checks.", tone: "attention", when: "Overnight" },
  { id: "h5", residentId: "josip-kovac", text: "Josip on a late shift Tuesday and will miss dinner. Plate to be kept.", tone: "info", when: "This morning" },
  { id: "h6", residentId: null, text: "Room 6 deep-cleaned after Friday's move-out and ready for admission. Bedlist updated.", tone: "info", when: "This morning" },
];

export const INITIAL_ALERTS: ManagerAlert[] = [
  {
    id: "m1",
    kind: "operational",
    title: "Fire drill overdue",
    detail: "Quarterly evacuation drill was due 10 Aug. Last completed 29 Apr.",
    when: "Flagged Mon 17 Aug",
    status: "awaiting-review",
  },
  {
    id: "m2",
    kind: "risk-change",
    title: "Patricia Whelan risk raised to Red",
    detail: "Medication non-compliance three days running. Risk assessment updated by Conor Lynch on Saturday.",
    when: "Sat 15 Aug",
    status: "acknowledged",
  },
];

/**
 * Routine mandatory tasks for the shift, per role. Bill's list for the worker
 * is used almost verbatim. The manager's includes the relief tracker, which he
 * named, plus the returns and checks a service manager actually carries.
 * It is mid-afternoon on the demo day, so the morning tasks are done.
 */
export const DAILY_TASKS: DailyTask[] = [
  { id: "w1", role: "worker", time: "09:00", label: "Resident wellbeing checks", detail: "Every resident seen or accounted for", doneDetail: "17 of 17 residents seen, completed 09:35", status: "due", done: true },
  { id: "w2", role: "worker", time: "10:00", label: "Email bedlist", detail: "Occupancy and voids to the placement team", doneDetail: "Sent 09:48, one void (Room 6)", status: "due", done: true },
  { id: "w3", role: "worker", time: "By 14:00", label: "Laundry check", detail: "Rooms 7 and 11 on today's rota", status: "overdue", done: false },
  { id: "w4", role: "worker", time: "By 17:00", label: "Fire checks", detail: "Exits, extinguishers and call points. See handover: top-floor exits after last night's panel fault", status: "due", done: false },
  { id: "w5", role: "worker", time: "15:00", label: "Resident wellbeing checks", detail: "Afternoon round", status: "due", done: false, compassNoteAfterIncident: "Michael is Red since 14:00. Start with Room 4 and record what you find." },
  { id: "w6", role: "worker", time: "22:00", label: "Resident wellbeing checks", detail: "Night round, handed to the night team", status: "later", done: false },
  { id: "m1", role: "manager", time: "09:00", label: "Handover meeting with day team", detail: "Overnight log and priorities for the day", doneDetail: "Held 09:05, four staff present", status: "due", done: true },
  { id: "m2", role: "manager", time: "10:30", label: "PASS occupancy return", detail: "Daily bed return to the local authority", doneDetail: "17 of 18 submitted 10:22", status: "due", done: true },
  { id: "m3", role: "manager", time: "Today", label: "Relief tracker", detail: "Confirm relief cover for Wednesday and Thursday nights, log last week's agency hours", status: "overdue", done: false },
  { id: "m4", role: "manager", time: "Mondays", label: "Weekly fire alarm test", detail: "Panel test and log. Zone 2 fault overnight, engineer Tuesday. Quarterly drill is also overdue", status: "due", done: false },
  { id: "m5", role: "manager", time: "16:30", label: "Sign off day team case notes", detail: "Review and countersign before the late shift", status: "later", done: false },
];

export const MANAGER_OUTSTANDING = [
  { id: "mo1", label: "Risk review for Sean Fitzpatrick", detail: "Due after two missed key working sessions", due: "Overdue 2 days" },
  { id: "mo2", label: "Incident report 2026-041 sign-off", detail: "Verbal altercation in communal kitchen, 9 Aug", due: "Due today" },
  { id: "mo3", label: "Support plan reviews", detail: "3 residents due within 7 days", due: "This week" },
];

export const STAFF_OPS = [
  { id: "s1", label: "Supervision due", detail: "Conor Lynch, last supervision 19 Jun", kind: "attention" },
  { id: "s2", label: "Training expiry", detail: "2 staff MAPA refresher lapses on 31 Aug", kind: "attention" },
  { id: "s3", label: "Rota", detail: "Fully covered next 7 days", kind: "ok" },
];

export const INCIDENT_TREND = [
  { week: "w/c 29 Jun", count: 4 },
  { week: "w/c 6 Jul", count: 3 },
  { week: "w/c 13 Jul", count: 5 },
  { week: "w/c 20 Jul", count: 2 },
  { week: "w/c 27 Jul", count: 3 },
  { week: "w/c 3 Aug", count: 2 },
  { week: "w/c 10 Aug", count: 3 },
  { week: "w/c 17 Aug", count: 1 },
];

export const EXAMPLE_NOTE_TEXT =
  "Called to Michael's room at 2pm for a welfare check. He was intoxicated and got aggressive when I asked about the GP appointment he missed. He said he has been drinking since Thursday after bad news about his brother. He calmed down after we spoke for a while and agreed to a cup of tea in the kitchen. He says he will not go to the housing meeting tomorrow.";
