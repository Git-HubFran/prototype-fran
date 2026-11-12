"use client";

import { useState } from "react";
import { ChatBox } from "@/components/ChatBox";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { SummaryView } from "@/components/SummaryView";
import { DEMO_CONTRACT } from "@/lib/demo-contract";
import type { Summary } from "@/lib/types";

// In demo mode the sample contract is preloaded and locked, and the server only accepts
// that exact text without a login.
export function Workspace({ demo = false }: { demo?: boolean }) {
  // Contract text lives only in this component's memory. It is never written to
  // localStorage, cookies, or the URL, and clearing or closing the tab discards it.
  const [contract, setContract] = useState(demo ? DEMO_CONTRACT : "");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumping this remounts ChatBox, which discards the chat history.
  const [chatKey, setChatKey] = useState(0);

  async function summarize() {
    if (!contract.trim() || summarizing) return;
    setSummarizing(true);
    setError(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Summary failed.");
      setSummary(data.summary as Summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summary failed.");
    } finally {
      setSummarizing(false);
    }
  }

  function clearAll() {
    setContract("");
    setSummary(null);
    setError(null);
    setChatKey((k) => k + 1);
  }

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-5 py-10 sm:px-8 sm:py-14">
      <div role="note" className="rounded-2xl border border-flag/25 bg-flag-wash px-5 py-3 text-sm font-medium text-flag sm:px-6">
        Experimental prototype. Not legal advice. Don&apos;t paste confidential or personal data.
      </div>

      {demo && (
        <div role="note" className="rounded-2xl border border-ink/25 bg-ink-wash px-5 py-3 text-sm font-medium text-ink-deep sm:px-6">
          Demo with a sample contract. Log in for full access.
        </div>
      )}

      <header className="space-y-3 border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink">Contract review</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink-deep sm:text-4xl">
          Contract Review Prototype
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Paste a contract to get a plain-language summary, then ask questions. Answers quote the clause they
          rely on.
        </p>
      </header>

      <LegalDisclaimer />

      <section aria-label="Contract input" className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7">
        <label htmlFor="contract" className="block font-serif text-xl font-semibold text-ink-deep">
          Contract text
        </label>
        <textarea
          id="contract"
          value={contract}
          onChange={(e) => setContract(e.target.value)}
          readOnly={demo}
          rows={12}
          placeholder="Paste the full contract text here."
          className="w-full rounded-xl border border-line bg-paper/40 p-4 text-[15px] leading-relaxed text-ink-text placeholder:text-muted/70 focus:border-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-ink/15 read-only:bg-paper read-only:text-ink-text/80"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={summarize}
              disabled={!contract.trim() || summarizing}
              className="flex-1 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink-deep disabled:opacity-40 sm:flex-none"
            >
              {summarizing ? "Summarizing…" : "Summarize"}
            </button>
            {!demo && (
              <button
                type="button"
                onClick={clearAll}
                disabled={!contract && !summary}
                className="flex-1 rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink-text transition-colors hover:bg-paper disabled:opacity-40 sm:flex-none"
              >
                Clear
              </button>
            )}
          </div>
          <span className="text-sm text-muted sm:ml-auto">{contract.length.toLocaleString()} characters</span>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-flag-wash px-4 py-3 text-sm text-flag">
            {error}
          </p>
        )}
      </section>

      {summary && <SummaryView summary={summary} />}

      <ChatBox key={chatKey} contract={contract} />
    </main>
  );
}
