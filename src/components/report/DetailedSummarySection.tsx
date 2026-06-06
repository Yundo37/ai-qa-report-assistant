import type { ReactNode } from "react";

export function DetailedSummarySection({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Detailed QA Data
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
        상세 데이터
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
