"use client";

import { useState, type ReactNode } from "react";

export function DetailedSummarySection({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Appendix
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Detailed QA Data
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Raw summaries and verification data are preserved here, including
            Jira Summary, Version Summary, Report Preview, Remaining Issues,
            and Follow-up lists.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          {isExpanded ? "Hide Detailed QA Data" : "Show Detailed QA Data"}
        </button>
      </div>

      {isExpanded && <div className="mt-5 space-y-5">{children}</div>}
    </section>
  );
}
