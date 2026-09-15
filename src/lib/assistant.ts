// Simulated "Ask Compass" assistant.
//
// In production this would be a model call grounded in the resident's record,
// the service's policies, and the staff member's permissions. Here answers are
// matched deterministically from a curated knowledge base so the demo always
// tells the same story, and so every answer can show its sources.

export interface AssistantAnswer {
  text: string;
  sources: string[];
  followUps: string[];
  suggestedActions?: string[];
}

export interface AskContext {
  /** True once the welfare-check incident has been recorded this shift. */
  incidentRecorded: boolean;
  riskLevel: "green" | "amber" | "red";
}

type Topic =
  | "summary"
  | "risk"
  | "next"
  | "housing"
  | "health"
  | "goals"
  | "background"
  | "engagement"
  | "unknown";

const TOPIC_KEYWORDS: [Topic, RegExp][] = [
  ["summary", /summar|catch me up|what.*happen|history|last (week|month)|brief me|overview|update/i],
  ["risk", /risk|safe|safeguard|danger|concern|worried|vulnerab/i],
  ["next", /next|suggest|recommend|should i|what do i do|advice|plan for|priorit/i],
  ["housing", /hous|accommodat|move.?on|tenanc|hap|council|landlord|independent living/i],
  ["health", /health|gp|doctor|medical|medication|drink|alcohol|mental|wellbeing|copd|nurse/i],
  ["goals", /goal|progress|support plan|target|how.*doing/i],
  ["background", /background|family|history before|came to us|admitted|why.*here/i],
  ["engagement", /engag|attend|missed|turn(ing)? up|session|no.?show/i],
];

function classify(question: string): Topic {
  for (const [topic, re] of TOPIC_KEYWORDS) {
    if (re.test(question)) return topic;
  }
  return "unknown";
}

export const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  "michael-doyle": [
    "Catch me up on Michael",
    "What are the risks right now?",
    "What should I do next?",
    "Where is he up to with housing?",
  ],
  "sean-fitzpatrick": [
    "Why is Sean disengaging?",
    "Catch me up on Sean",
    "What should I do next?",
  ],
  "amina-yusuf": [
    "Why has the HAP application stalled?",
    "Catch me up on Amina",
    "What should I do next?",
  ],
  "dara-o-ceallaigh": ["Is Dara ready to move on?", "Catch me up on Dara", "What should I do next?"],
  "patricia-whelan": ["Catch me up on Patricia", "What are the risks right now?"],
  "josip-kovac": ["Catch me up on Josip", "What should I do next?"],
};

const GENERIC_FOLLOWUPS = ["What should I do next?", "What are the risks right now?"];

type Knowledge = Partial<Record<Topic, (ctx: AskContext) => AssistantAnswer>>;

const KNOWLEDGE: Record<string, Knowledge> = {
  "michael-doyle": {
    summary: (ctx) => ({
      text: ctx.incidentRecorded
        ? "Michael has had a difficult fortnight. Alcohol use has been climbing since late July, and he received bad news about his brother on Thursday. He missed his GP appointment on the 14th, was withdrawn at Sunday's evening check, and today's welfare check ended in verbal aggression while he was intoxicated. He is now saying he will not attend tomorrow's council housing meeting, which is the furthest along of all his goals at 70 per cent. Compass raised him to Red today."
        : "Michael has been drifting for about three weeks. His housing application is the strongest part of his plan at 70 per cent and he has a council meeting on Tuesday. Against that, alcohol use has been increasing, he missed his GP appointment on the 14th, and Conor recorded him as withdrawn and declining dinner at Sunday's evening check. He is Amber, last reviewed on 4 August.",
      sources: ctx.incidentRecorded
        ? ["Case notes, 29 Jul to today", "Support plan goals", "Risk assessment, updated today"]
        : ["Case notes, 29 Jul to 16 Aug", "Support plan goals", "Risk assessment, 4 Aug"],
      followUps: ["What are the risks right now?", "What should I do next?", "Where is he up to with housing?"],
    }),
    risk: (ctx) => ({
      text: ctx.incidentRecorded
        ? "Red as of today. Three things landed inside 24 hours: a sustained drinking episode since Thursday, verbal aggression toward staff during a welfare check, and disengagement from his housing plan. Individually each is manageable. Together they are the pattern that preceded his previous placement breakdown in 2024. The bereavement anniversary for his mother also falls next month."
        : "Amber, last reviewed 4 August. The active concerns are alcohol dependency and low mood following his brother's illness. What Compass is watching: alcohol use has increased in three of the last four weeks, and a missed health appointment often precedes a wider disengagement for Michael. No aggression or safeguarding concerns on record.",
      sources: ["Risk assessment", "Case notes, last 30 days", "Placement history, 2024"],
      followUps: ["What should I do next?", "Catch me up on Michael"],
      suggestedActions: ctx.incidentRecorded
        ? ["Bring to today's handover as priority", "Check in this evening when sober", "Flag to the manager"]
        : ["Complete the overdue GP follow-up", "Check in before Tuesday's meeting"],
    }),
    next: (ctx) => ({
      text: ctx.incidentRecorded
        ? "Three things, in order. First, a follow-up conversation this evening when he is sober, focused on the bereavement rather than the drinking, because pushing on alcohol while he is defensive has backfired twice before. Second, contact the housing officer today to flag that Tuesday's attendance is at risk, so the slot can be rescheduled rather than recorded as a no-show, which would set the application back roughly six weeks. Third, the alcohol support re-referral, which lapsed in June."
        : "Two things. The GP follow-up is five days overdue and is the item most likely to unblock the health goal. Then confirm Tuesday's housing meeting with him directly rather than by note, because he has quietly skipped two appointments in the last month. Compass would also suggest raising the increasing alcohol use at your next supervision.",
      sources: ["Support plan", "Actions due", "Previous engagement patterns"],
      followUps: ["What are the risks right now?", "Where is he up to with housing?"],
      suggestedActions: ctx.incidentRecorded
        ? ["Add evening check-in to my actions", "Draft note to housing officer"]
        : ["Add GP follow-up to today"],
    }),
    housing: () => ({
      text: "Furthest along of any of his goals at 70 per cent. Social housing application with Laois County Council is live, supporting documents are complete since he replaced his birth certificate and PPS card in June, and there is a meeting on Tuesday 18 August at 11:00. The risk is attendance rather than eligibility. A missed meeting typically pushes the review back about six weeks.",
      sources: ["Housing goal", "Documentation goal, achieved 12 Jun", "Council correspondence"],
      followUps: ["What should I do next?", "What are the risks right now?"],
    }),
    health: () => ({
      text: "Two open threads. The GP engagement goal is stalled at 40 per cent, with a missed appointment on 14 August and no rebooking recorded. The alcohol support referral was made in April and lapsed in June without a re-referral. He has been drinking since Thursday following news about his brother. No medication is managed by the service for Michael.",
      sources: ["Health goal", "Case notes, last 30 days"],
      followUps: ["What should I do next?", "What are the risks right now?"],
    }),
    goals: () => ({
      text: "Four goals. Documentation is achieved. Housing is on track at 70 per cent with Tuesday's meeting the next milestone. Life skills, meaning the budgeting plan for an independent tenancy, is at 50 per cent and moving slowly but steadily. Health is the stalled one at 40 per cent and has not moved since 24 July.",
      sources: ["Support plan goals"],
      followUps: ["What should I do next?", "Where is he up to with housing?"],
    }),
    background: () => ({
      text: "Michael is 47 and has been with the service since 11 March 2026, referred after a private tenancy ended. He worked in construction for over twenty years. His mother died in 2024 and his brother became seriously ill this summer, which he links directly to his current drinking. He has one previous stay with another service in 2024 that ended in placement breakdown.",
      sources: ["Admission record", "Key working sessions", "Referral information"],
      followUps: ["What are the risks right now?", "Catch me up on Michael"],
    }),
    engagement: () => ({
      text: "Mixed. He attends key working sessions reliably and engages well when the subject is housing. Health appointments are where he drops out, with two missed in the last month. The pattern Compass sees is that engagement dips within a few days of a difficult family contact.",
      sources: ["Attendance records", "Case notes, last 60 days"],
      followUps: ["What should I do next?"],
    }),
  },

  "sean-fitzpatrick": {
    engagement: () => ({
      text: "Sean has missed his last two key working sessions, on 5 and 12 August. Before that he attended six in a row. He is 24 and a care leaver, which means the transition from structured support has been abrupt for him. Night staff record him returning late but with no concerns raised. Compass reads this as withdrawal rather than a placement breaking down, but two consecutive misses is the threshold where a risk review is triggered.",
      sources: ["Attendance records", "Case notes, last 30 days", "Service policy on missed sessions"],
      followUps: ["What should I do next?", "Catch me up on Sean"],
      suggestedActions: ["Complete overdue risk review"],
    }),
    summary: () => ({
      text: "Sean is 24, a care leaver, with the service since 6 June. He is the earliest in his journey of anyone on your caseload at 30 per cent move-on readiness. Two missed key working sessions have triggered a risk review that is now two days overdue. The Jigsaw youth mental health referral is stalled at 20 per cent and the Youthreach application is progressing slowly. Suspected cannabis use, not confirmed.",
      sources: ["Support plan", "Attendance records", "Risk assessment, 12 Aug"],
      followUps: ["Why is Sean disengaging?", "What should I do next?"],
    }),
    next: () => ({
      text: "His session is at 16:00 today, so the immediate thing is to make sure it happens. Compass would suggest keeping it informal rather than leading with the two misses, because for care leavers a session that opens with attendance often becomes the last one. The risk review is two days overdue and your manager has it on his outstanding list.",
      sources: ["Actions due", "Risk review, overdue", "Service policy"],
      followUps: ["Why is Sean disengaging?"],
      suggestedActions: ["Complete overdue risk review"],
    }),
    risk: () => ({
      text: "Amber, updated 12 August. Care leaver with low engagement and suspected cannabis use. No safeguarding concerns and no incidents recorded. The specific risk Compass is tracking is disengagement rather than harm: two missed sessions, a stalled mental health referral, and the least progress on the caseload.",
      sources: ["Risk assessment, 12 Aug", "Attendance records"],
      followUps: ["What should I do next?"],
    }),
  },

  "amina-yusuf": {
    housing: () => ({
      text: "The HAP application has not moved in three weeks. The paperwork went in on 24 July and the council acknowledged it on the 26th, with nothing since. Compass flagged it as stalled on 12 August. In practice at this service, applications quiet for over two weeks usually need a phone call rather than more waiting. Everything on Amina's side is complete.",
      sources: ["Housing goal", "Council correspondence", "Stalled goal alert, 12 Aug"],
      followUps: ["What should I do next?", "Catch me up on Amina"],
      suggestedActions: ["Phone council re HAP application"],
    }),
    summary: () => ({
      text: "Amina is 34, with the service since 19 January, and sole parent to Layla. She is at 60 per cent move-on readiness. The HAP application is the blocker, stalled three weeks. Better news elsewhere: the creche place is confirmed and starts Monday, the one parent family payment review is at 75 per cent, and she attends English conversation classes twice weekly without fail. Amber mainly because of financial stress.",
      sources: ["Support plan", "Case notes, last 30 days"],
      followUps: ["Why has the HAP application stalled?", "What should I do next?"],
    }),
    next: () => ({
      text: "Phone the council about the HAP application, which is the single thing holding up her move-on. Beyond that, the creche starting Monday changes her availability, so it is worth revisiting the goals that assumed she had Layla with her all day, particularly around training and work.",
      sources: ["Actions due", "Support plan goals"],
      followUps: ["Why has the HAP application stalled?"],
    }),
  },

  "dara-o-ceallaigh": {
    summary: () => ({
      text: "Dara is your closest to move-on at 85 per cent and has been with the service since December. The HAP tenancy viewing is Thursday at 14:30, deposit support is confirmed by the council, and the safe pass course is complete. Green, last reviewed 28 July. Historic self-harm on record with no episode in over two years and no current concerns.",
      sources: ["Support plan", "Risk assessment, 28 Jul", "Case notes"],
      followUps: ["Is Dara ready to move on?", "What should I do next?"],
    }),
    housing: () => ({
      text: "Viewing on Thursday 20 August at 14:30, a one-bed under HAP within budget. Deposit support is confirmed. If it goes ahead, Compass estimates a move-on date in mid-September once the tenancy agreement and utility setup are done.",
      sources: ["Housing goal", "Move-on plan", "Council correspondence"],
      followUps: ["What should I do next?"],
    }),
    next: () => ({
      text: "Prepare the viewing checklist with him on Wednesday, which is already in your actions. Compass would add one thing: move-on for someone at 85 per cent is the point where aftercare planning should start, and there is no aftercare contact recorded on his plan yet.",
      sources: ["Actions due", "Move-on plan", "Service move-on policy"],
      followUps: ["Is Dara ready to move on?"],
    }),
  },

  "patricia-whelan": {
    summary: () => ({
      text: "Patricia is 58, with the service since September, and the only Red on the service. COPD with poor medication compliance, three days of non-compliance recorded last week. Conor updated her risk assessment on Saturday. The respiratory clinic appointment is Friday at 09:15 and the community nurse visits Wednesday. She is Conor's client rather than yours.",
      sources: ["Risk assessment, 15 Aug", "Medication records", "Case notes"],
      followUps: ["What are the risks right now?"],
    }),
    risk: () => ({
      text: "Red. COPD is deteriorating and medication compliance is the driver. She is also a falls risk. Compass is tracking that the pattern of missed doses clusters at weekends when agency staff cover the medication prompt, which is the sort of thing that gets missed when it sits across separate weekly records.",
      sources: ["Risk assessment, 15 Aug", "Medication records, 8 weeks", "Rota"],
      followUps: ["Catch me up on Patricia"],
    }),
  },

  "josip-kovac": {
    summary: () => ({
      text: "Josip is 41, with the service since February, in part-time warehouse work and saving steadily. He is on target for a deposit by October and is viewing private rentals with a rent supplement top-up. Green with no current concerns, last reviewed 1 August. He is Mary's client.",
      sources: ["Support plan", "Case notes", "Risk assessment, 1 Aug"],
      followUps: ["What should I do next?"],
    }),
  },
};

function fallback(name: string, topic: Topic): AssistantAnswer {
  const first = name.split(" ")[0];
  if (topic === "unknown") {
    return {
      text: `I do not have anything recorded that answers that for ${first}. In a live system I would search the full record, including documents and correspondence. For this prototype try one of the suggested questions below, or ask about risk, housing, health, goals or next steps.`,
      sources: [],
      followUps: GENERIC_FOLLOWUPS,
    };
  }
  return {
    text: `There is nothing specific recorded on that for ${first} in this prototype. The demo record is fullest for Michael Doyle.`,
    sources: [],
    followUps: GENERIC_FOLLOWUPS,
  };
}

export function askCompass(
  residentId: string,
  residentName: string,
  question: string,
  ctx: AskContext
): AssistantAnswer {
  const topic = classify(question);
  const entry = KNOWLEDGE[residentId]?.[topic];
  if (!entry) return fallback(residentName, topic);
  return entry(ctx);
}
