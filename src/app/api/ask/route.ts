import { buildBriefing } from "@/lib/briefing";

/**
 * Ask Compass, live.
 *
 * The API key stays on the server and is never sent to the browser. If no key
 * is configured the route reports itself as unavailable and the client falls
 * back to the prepared answers, so a deployment without a key still demos.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.COMPASS_MODEL ?? "claude-haiku-4-5";
const MAX_QUESTION = 300;

// Rate limiting.
//
// This is in-process, so on serverless it is per instance rather than global
// and a determined caller could exceed it. That is an accepted limit for a
// demo: it stops casual abuse and runaway cost, which is what it is for. A
// production build would put these counters in Redis or Vercel KV.
const PER_IP_MAX = 8;
const PER_IP_WINDOW_MS = 10 * 60 * 1000;
const DAILY_MAX = Number(process.env.COMPASS_DAILY_MAX ?? 200);

const hits = new Map<string, number[]>();
let dayStamp = new Date().toISOString().slice(0, 10);
let dayCount = 0;

function rateLimit(ip: string): { ok: true } | { ok: false; reason: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dayStamp) {
    dayStamp = today;
    dayCount = 0;
  }
  if (dayCount >= DAILY_MAX) {
    return { ok: false, reason: "daily limit reached" };
  }

  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < PER_IP_WINDOW_MS);
  if (recent.length >= PER_IP_MAX) {
    return { ok: false, reason: "too many questions in a short time" };
  }
  recent.push(now);
  hits.set(ip, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= PER_IP_WINDOW_MS)) hits.delete(key);
    }
  }

  dayCount += 1;
  return { ok: true };
}

interface AskBody {
  question?: unknown;
  residentId?: unknown;
  residentName?: unknown;
  incidentRecorded?: unknown;
}

export async function GET() {
  // Lets the client decide whether to offer live answers at all.
  return Response.json({ live: Boolean(process.env.ANTHROPIC_API_KEY), model: MODEL });
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "not-configured" }, { status: 503 });
  }

  let body: AskBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const residentName = typeof body.residentName === "string" ? body.residentName : "";
  const incidentRecorded = body.incidentRecorded === true;

  if (!question || question.length > MAX_QUESTION || !residentName) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limit = rateLimit(ip);
  if (!limit.ok) {
    return Response.json({ error: "rate-limited", reason: limit.reason }, { status: 429 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        temperature: 0.2,
        system: buildBriefing(incidentRecorded),
        messages: [
          {
            role: "user",
            // The question is wrapped so the model treats it as the staff
            // member's words rather than as further instructions.
            content: `A member of staff is asking about ${residentName}.\n\nTheir question:\n<question>\n${question}\n</question>`,
          },
        ],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("Anthropic API error", upstream.status, detail.slice(0, 300));
      return Response.json({ error: "upstream", status: upstream.status }, { status: 502 });
    }

    const payload = (await upstream.json()) as {
      content?: { type: string; text?: string }[];
    };
    const raw = (payload.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("")
      .trim();

    return Response.json(parseAnswer(raw));
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error("Ask Compass failed:", err);
    return Response.json({ error: aborted ? "timeout" : "failed" }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}

/** Models occasionally wrap JSON in prose or a fence. Recover what we can. */
function parseAnswer(raw: string) {
  const strings = (v: unknown, cap: number) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, cap) : [];

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (typeof parsed.text === "string" && parsed.text.trim()) {
        return {
          text: parsed.text.trim(),
          sources: strings(parsed.sources, 4),
          followUps: strings(parsed.followUps, 3),
          suggestedActions: strings(parsed.suggestedActions, 3),
          live: true,
        };
      }
    } catch {
      /* fall through to plain text */
    }
  }

  return { text: raw, sources: [], followUps: [], suggestedActions: [], live: true };
}
