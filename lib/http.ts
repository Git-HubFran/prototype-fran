import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { MissingApiKeyError, ModelOutputTruncatedError, ModelRefusalError } from "./anthropic";
import type { ChatRole, ChatTurn } from "./types";

// ~100k tokens. Generous for real contracts, and bounds cost per request.
export const MAX_CONTRACT_CHARS = 400_000;
export const MAX_QUESTION_CHARS = 2_000;
export const MAX_HISTORY_TURNS = 20;
export const MAX_TURN_CHARS = 8_000;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

export function readContract(body: unknown): ParseResult<string> {
  const contract = (body as { contract?: unknown } | undefined)?.contract;
  if (typeof contract !== "string" || contract.trim().length === 0) {
    return { ok: false, error: "Paste the contract text first." };
  }
  if (contract.length > MAX_CONTRACT_CHARS) {
    return { ok: false, error: `Contract is too long (limit ${MAX_CONTRACT_CHARS.toLocaleString()} characters).` };
  }
  return { ok: true, value: contract };
}

export function readChatInput(body: unknown): ParseResult<{ history: ChatTurn[]; question: string }> {
  const { history, question } = (body ?? {}) as { history?: unknown; question?: unknown };
  if (typeof question !== "string" || question.trim().length === 0) {
    return { ok: false, error: "Type a question first." };
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return { ok: false, error: `Question is too long (limit ${MAX_QUESTION_CHARS} characters).` };
  }
  if (!Array.isArray(history) || history.length > MAX_HISTORY_TURNS) {
    return { ok: false, error: "Chat history is invalid or too long. Clear the chat and try again." };
  }
  const turns: ChatTurn[] = [];
  for (const turn of history) {
    const { role, content } = (turn ?? {}) as { role?: unknown; content?: unknown };
    const validRole = role === "user" || role === "assistant";
    if (!validRole || typeof content !== "string" || content.length > MAX_TURN_CHARS) {
      return { ok: false, error: "Chat history is invalid. Clear the chat and try again." };
    }
    turns.push({ role: role as ChatRole, content });
  }
  return { ok: true, value: { history: turns, question: question.trim() } };
}

// Maps failures to HTTP responses, most specific first. The response and log carry
// only the error type and status, never the request body (which holds the contract).
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof MissingApiKeyError) {
    return NextResponse.json({ error: "The server is missing its Anthropic API key." }, { status: 500 });
  }
  if (err instanceof ModelRefusalError || err instanceof ModelOutputTruncatedError) {
    return NextResponse.json({ error: err.message }, { status: 422 });
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return NextResponse.json({ error: "The server's Anthropic API key was rejected." }, { status: 500 });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return NextResponse.json({ error: "Rate limited by the AI service. Try again in a moment." }, { status: 429 });
  }
  if (err instanceof Anthropic.BadRequestError) {
    return NextResponse.json({ error: "The AI service rejected the request. The contract may be too long." }, { status: 400 });
  }
  if (err instanceof Anthropic.APIError) {
    console.error(`Anthropic API error: status=${err.status ?? "none"}`);
    return NextResponse.json({ error: "The AI service request failed. Try again." }, { status: 502 });
  }
  console.error(`Unhandled error: ${err instanceof Error ? err.name : typeof err}`);
  return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
}
