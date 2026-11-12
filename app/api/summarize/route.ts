import { NextResponse } from "next/server";
import { MODEL, extractText, getClient } from "@/lib/anthropic";
import { SUMMARY_SYSTEM, summaryUserMessage } from "@/lib/prompts";
import { extractJsonObject, parseSummary } from "@/lib/parse";
import { errorResponse, readContract, readJson } from "@/lib/http";
import { hasValidSession } from "@/lib/auth";

// Nothing here writes the contract anywhere: it lives in the request body, is sent to
// the model, and is dropped when the response is returned.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const input = readContract(await readJson(req));
  if (!input.ok) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  try {
    const message = await getClient().messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "medium" },
      system: SUMMARY_SYSTEM,
      messages: [{ role: "user", content: summaryUserMessage(input.value) }],
    });

    const summary = parseSummary(extractJsonObject(extractText(message)));
    if (!summary) {
      return NextResponse.json(
        { error: "The summary came back in an unexpected format. Try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ summary });
  } catch (err) {
    return errorResponse(err);
  }
}
