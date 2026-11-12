"use client";

import { useState } from "react";
import type { ChatAnswer, ChatTurn, Citation } from "@/lib/types";

type DisplayTurn =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; citations: Citation[] };

export function ChatBox({ contract }: { contract: string }) {
  const [turns, setTurns] = useState<DisplayTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || busy || !contract.trim()) return;

    // Only plain text goes back to the server as history. Citations are display-only.
    const history: ChatTurn[] = turns.map((t) => ({ role: t.role, content: t.content }));

    setBusy(true);
    setError(null);
    setQuestion("");
    setTurns((prev) => [...prev, { role: "user", content: q }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract, history, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      const answer = data as ChatAnswer;
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: answer.answer, citations: answer.citations },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      // Keep the question so the user can retry without retyping it.
      setQuestion(q);
      setTurns((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Ask about this contract" className="space-y-5">
      <h2 className="font-serif text-2xl font-semibold text-ink-deep">Ask about this contract</h2>

      {turns.length > 0 && (
        <ol className="space-y-5">
          {turns.map((t, i) =>
            t.role === "user" ? (
              <li
                key={i}
                className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-ink px-5 py-3 text-[15px] leading-relaxed text-white shadow-sm"
              >
                {t.content}
              </li>
            ) : (
              <li
                key={i}
                className="max-w-[95%] space-y-4 rounded-2xl rounded-bl-md border border-line bg-surface p-5 shadow-sm sm:p-6"
              >
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-text">{t.content}</p>
                {t.citations.length === 0 ? (
                  <p className="text-sm text-muted">No clause in the contract addresses this.</p>
                ) : (
                  t.citations.map((c, j) => (
                    <figure key={j} className="space-y-2">
                      {c.verified ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-verified-wash px-2.5 py-0.5 text-xs font-semibold text-verified">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 16 16"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3.5 8.5l3 3 6-7" />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-caution-wash px-2.5 py-0.5 text-xs font-semibold text-caution">
                          Unverified
                        </span>
                      )}
                      <blockquote className="rounded-r-xl border-l-4 border-ink bg-ink-wash/60 px-5 py-3 font-serif text-[15px] italic leading-relaxed text-ink-deep">
                        &ldquo;{c.quote}&rdquo;
                      </blockquote>
                      {!c.verified && (
                        <figcaption className="text-sm text-caution">
                          This quote could not be matched exactly in the contract. Check the original before relying on it.
                        </figcaption>
                      )}
                    </figure>
                  ))
                )}
              </li>
            ),
          )}
        </ol>
      )}

      {busy && <p className="text-sm text-muted">Reading the contract&hellip;</p>}
      {error && (
        <p role="alert" className="rounded-lg bg-flag-wash px-4 py-3 text-sm text-flag">
          {error}
        </p>
      )}

      <form onSubmit={ask} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={contract.trim() ? "e.g. Can either party terminate early?" : "Paste a contract above first"}
          disabled={!contract.trim() || busy}
          maxLength={2000}
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-[15px] text-ink-text placeholder:text-muted/70 shadow-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!contract.trim() || busy || !question.trim()}
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink-deep disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </section>
  );
}
