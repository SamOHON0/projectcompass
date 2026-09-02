# Compass Prototype

Concept prototype for Project Compass: an intelligent colleague for frontline homelessness services. Built by SquareTwo. All residents, staff and events are fictional.

## What it demonstrates

Two role-based views drawing from one shared source of information:

- **Project Worker view** (`/worker`): tailored handover, My Clients caseload, resident profile with goals and independent living progress, actions due, Ask Compass, and the Smart Case Note.
- **Manager view** (`/manager`): RAG service overview, critical updates, outstanding actions, incident trends with Compass insights, handover overview, client progress, and staff/operational prompts. Alerts and residents open the full record.

### The demo story

Run it in this order. It takes about two minutes and shows one piece of frontline information moving through the whole service.

1. **Worker view.** Ask Compass "Catch me up on Michael". Note the answer cites what it drew on.
2. **New smart case note** → **Insert example note** → **Process with Compass**. Compass structures the note, suggests trauma-informed wording ("got aggressive" becomes "became verbally agitated and raised his voice"), and lists what it has prepared. Apply the suggestion, then approve.
3. **Back on the worker view**, Michael is now Red, three new actions exist, the handover is written, and an incident report is waiting.
4. **Ask Compass "What are the risks right now?"** The answer has changed, because the record has.
5. **Open draft report.** Compass has filled nine fields from the note and deliberately left two: who else was present, and the resident's own words. Submitting is blocked until a human fills them.
6. **Switch to Manager.** The incident is on the dashboard, the Red count has moved, and the handover is updated. Click the alert to open Michael's record, then the incident report, and sign it off.

The point of step 5 is that Compass drafts, a person decides. Every field is labelled "Compass drafted" or "You added this".

### Ask Compass

Answers questions about a resident's history, risk, goals and next steps. Three things worth pointing out in a demo:

- Every answer shows its sources, so a worker can see where a claim came from.
- Answers change as the record changes, which is why step 4 above matters.
- Ask something outside the record and it says so rather than inventing an answer.

The intelligence is simulated (deterministic, no API calls) so the demo always tells the same story. In production this layer would be a model call grounded in the resident's record, the service's policies, and the staff member's permissions. `src/lib/assistant.ts` and `src/lib/ai.ts` are the only files that would change.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

Push to GitHub, then import the repo in Vercel. No environment variables, no database, no build config. Defaults work as-is.

## Structure

- `src/lib/data.ts`: seed data (residents, actions, handover, alerts)
- `src/lib/ai.ts`: the case note pipeline and incident report drafting
- `src/lib/assistant.ts`: Ask Compass knowledge base and question matching
- `src/lib/store.tsx`: shared state; one saved note fans out to every view
- `src/app/worker`, `src/app/manager`: the two role views
- `src/components`: shared UI, plus role-specific panels

## Verification

```bash
npm install
npm run verify
```

`verify` runs, in order: TypeScript, the preview build, the contrast check, the accessibility check, and the end-to-end flow test. Run it before pushing.

| Command | What it proves |
| --- | --- |
| `npm run typecheck` | The app compiles under strict TypeScript. |
| `npm run test:contrast` | Every colour pair the UI renders meets WCAG AA. Parsed from `globals.css`, so it cannot drift from the stylesheet. |
| `npm run test:a11y` | 11 rendered views have accessible names on every control, no duplicate ids, no skipped headings, and 24px minimum target sizes. |
| `npm run test:flow` | 31 assertions clicking the whole demo story in a real browser, including keyboard operation. |
| `node scripts/shoot.mjs` | Screenshots every view at 1360px and 390px and fails on horizontal overflow. |

`scripts/` is developer tooling and is not part of the deployed app. The flow test covers the cross-role loop: the assistant answering and then changing its answer, the case note pipeline, the language suggestion rewriting the note, risk and handover fan-out, the incident report gating submission until a human completes it, the manager drill-down through to sign-off, plus Escape, focus return, and the skip link.

The accessibility checks are hand-written because axe-core is not reachable from the build sandbox. They are not a substitute for a full axe run or for testing with a real screen reader.

## Demo safeguards

The prototype shows realistic-looking care records, so it is marked as a demo in several places that survive someone landing deep in the app: a persistent banner on every view, a notice on the landing page, and `noindex, nofollow, nocache` in the document metadata. Keep these if you deploy it anywhere public.

The banner also carries a **Reset walkthrough** button, so the demo can be re-run in front of the next person without reloading.
