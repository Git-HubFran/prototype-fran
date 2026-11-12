import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { MODEL, extractText, getClient } from "@/lib/anthropic";
import { chatSystemWithContract } from "@/lib/prompts";
import { extractJsonObject, parseChatAnswer } from "@/lib/parse";
import { errorResponse, readChatInput, readContract, readJson } from "@/lib/http";
import { hasValidSession } from "@/lib/auth";

// Stateless: the client sends the contract and prior turns each time, so the server
// keeps nothing between requests.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await readJson(req);
  const contract = readContract(body);
  if (!contract.ok) {
    return NextResponse.json({ error: contract.error }, { status: 400 });
  }
  const chat = readChatInput(body);
  if (!chat.ok) {
    return NextResponse.json({ error: chat.error }, { status: 400 });
  }

  // The first message must be from the user, so drop any leading assistant turns.
  const firstUser = chat.value.history.findIndex((t) => t.role === "user");
  const priorTurns = firstUser === -1 ? [] : chat.value.history.slice(firstUser);
  const messages: Anthropic.MessageParam[] = [
    ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: chat.value.question },
  ];

  try {
    const message = await getClient().messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "medium" },
      // The contract sits in the system prompt, which is identical across turns, so
      // repeated questions about one contract can reuse the cached prefix.
      system: [
        {
          type: "text",
          text: chatSystemWithContract(contract.value),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    const answer = parseChatAnswer(extractJsonObject(extractText(message)), contract.value);
    if (!answer) {
      return NextResponse.json(
        { error: "The answer came back in an unexpected format. Try asking again." },
        { status: 502 },
      );
    }
    return NextResponse.json(answer);
  } catch (err) {
    return errorResponse(err);
  }
}
