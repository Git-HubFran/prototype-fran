"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Sign-in failed.");
      // Re-render the server page now that the session cookie is set.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-10">
      <div className="space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink-deep">Contract Review Prototype</h1>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-ink-text">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-[15px] text-ink-text shadow-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:opacity-50"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-flag-wash px-4 py-3 text-sm text-flag">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!password || busy}
            className="w-full rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-ink-deep disabled:opacity-40"
          >
            {busy ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
