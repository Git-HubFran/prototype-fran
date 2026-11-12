import type { ChatAnswer, Citation, Summary } from "./types";

// Pulls the first JSON object out of a model reply. Tolerates a code fence or stray
// prose around it, but returns null rather than guessing if nothing parses.
export function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

const isString = (v: unknown): v is string => typeof v === "string";
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

export function parseSummary(raw: unknown): Summary | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (
    !isStringArray(o.parties) ||
    !isString(o.term) ||
    !isString(o.payment) ||
    !isString(o.termination) ||
    !isString(o.liability) ||
    !isStringArray(o.redFlags) ||
    !isStringArray(o.missingOrUnclear)
  ) {
    return null;
  }
  return {
    parties: o.parties,
    term: o.term,
    payment: o.payment,
    termination: o.termination,
    liability: o.liability,
    redFlags: o.redFlags,
    missingOrUnclear: o.missingOrUnclear,
  };
}

// Quote matching ignores whitespace runs and smart-vs-straight quote differences,
// because PDFs and word processors produce those. Anything else must match exactly.
export function normalizeForMatch(s: string): string {
  return s
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function isVerbatimQuote(contract: string, quote: string): boolean {
  const needle = normalizeForMatch(quote);
  if (needle.length < 8) return false; // too short to be a meaningful clause reference
  return normalizeForMatch(contract).includes(needle);
}

export function parseChatAnswer(raw: unknown, contract: string): ChatAnswer | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (!isString(o.answer) || !isStringArray(o.citations)) return null;
  const citations: Citation[] = o.citations
    .map((quote) => quote.trim())
    .filter((quote) => quote.length > 0)
    .map((quote) => ({ quote, verified: isVerbatimQuote(contract, quote) }));
  return { answer: o.answer, citations };
}
