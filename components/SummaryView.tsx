import type { Summary } from "@/lib/types";

const FIELDS: { key: "parties" | "term" | "payment" | "termination" | "liability"; label: string }[] = [
  { key: "parties", label: "Parties" },
  { key: "term", label: "Term" },
  { key: "payment", label: "Payment" },
  { key: "termination", label: "Termination" },
  { key: "liability", label: "Liability" },
];

export function SummaryView({ summary }: { summary: Summary }) {
  return (
    <section aria-label="Contract summary" className="space-y-5">
      <h2 className="font-serif text-2xl font-semibold text-ink-deep">Summary</h2>

      <dl className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-2 rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">{label}</dt>
            <dd className="text-[15px] leading-relaxed text-ink-text">
              {Array.isArray(summary[key]) ? (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-ink">
                  {summary[key].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                summary[key]
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="space-y-4 rounded-2xl border border-caution/25 bg-surface p-5 shadow-sm sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-caution">Missing or unclear</h3>
        {summary.missingOrUnclear.length === 0 ? (
          <p className="text-[15px] text-muted">Nothing obvious is missing or unclear in the text provided.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {summary.missingOrUnclear.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-caution/25 bg-caution-wash px-4 py-3 text-[15px] leading-relaxed"
              >
                <span aria-hidden="true" className="mt-[0.45rem] h-2 w-2 flex-none rounded-full bg-caution" />
                <span className="text-ink-text">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-flag/20 bg-surface p-5 shadow-sm sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-flag">Red flags</h3>
        {summary.redFlags.length === 0 ? (
          <p className="text-[15px] text-muted">None identified from the text provided.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {summary.redFlags.map((flag, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-flag/25 bg-flag-wash px-4 py-3 text-[15px] leading-relaxed text-flag"
              >
                <span
                  aria-hidden="true"
                  className="mt-[0.45rem] h-2 w-2 flex-none rounded-full bg-flag"
                />
                <span className="text-ink-text">{flag}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
