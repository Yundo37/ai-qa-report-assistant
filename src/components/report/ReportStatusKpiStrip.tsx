import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
import type { AnalysisSummaryState } from "@/types/report";

const STATUS_TONE_CLASS = {
  stable: "border-emerald-200 bg-emerald-50 text-emerald-700",
  caution: "border-amber-200 bg-amber-50 text-amber-700",
  risk: "border-red-200 bg-red-50 text-red-700",
};

export function ReportStatusKpiStrip({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const metrics = createOverallDashboardMetrics(analysisSummary);
  const kpis = [
    { label: "Total TC", value: metrics.totalTc.toLocaleString() },
    { label: "Pass Rate", value: `${metrics.passRate}%` },
    { label: "Remaining", value: metrics.remaining.toLocaleString() },
    { label: "High Risk", value: metrics.highRisk.toLocaleString() },
    { label: "Blocked", value: metrics.blocked.toLocaleString() },
    { label: "Next Event", value: metrics.nextEvent.toLocaleString() },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[210px_1fr]">
        <div
          className={`rounded-2xl border px-4 py-3 ${
            STATUS_TONE_CLASS[metrics.status.tone]
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide">
            QA Status
          </p>
          <p className="mt-2 text-xl font-bold">{metrics.status.label}</p>
          <p className="mt-1 text-xs leading-5">{metrics.status.description}</p>
        </div>

        <dl className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <dt className="truncate text-xs font-medium text-slate-500">
                {kpi.label}
              </dt>
              <dd className="mt-2 text-xl font-bold text-slate-950">
                {kpi.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
