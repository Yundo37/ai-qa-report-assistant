import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
import { ReportAssetSlot } from "@/components/report/ReportAssetSlot";
import type { AnalysisSummaryState } from "@/types/report";

const STATUS_PANEL_CLASS = {
  stable: "border-emerald-200 bg-emerald-50/90 text-emerald-700",
  caution: "border-amber-200 bg-amber-50/90 text-amber-700",
  risk: "border-red-200 bg-red-50/90 text-red-700",
};

const STATUS_BADGE_CLASS = {
  stable: "bg-emerald-600 text-white",
  caution: "bg-amber-500 text-white",
  risk: "bg-red-600 text-white",
};

function createStatusMessage(
  tone: "stable" | "caution" | "risk",
  remaining: number,
  blocked: number
) {
  if (tone === "risk") {
    return "High / Highest Remaining issues need release follow-up.";
  }

  if (tone === "caution") {
    if (blocked > 0) {
      return "Blocked and Remaining items need additional review.";
    }

    if (remaining > 0) {
      return "Remaining issues should be tracked as follow-up items.";
    }

    return "Some QA metrics need review before closing the report.";
  }

  return "No major risk signal is visible in the top dashboard metrics.";
}

export function QaReleaseStatusCard({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const metrics = createOverallDashboardMetrics(analysisSummary);
  const message = createStatusMessage(
    metrics.status.tone,
    metrics.remaining,
    metrics.blocked
  );
  const supportMetrics = [
    { label: "High Risk", value: metrics.highRisk, tone: "text-red-700" },
    { label: "Blocked", value: metrics.blocked, tone: "text-orange-700" },
    { label: "Remaining", value: metrics.remaining, tone: "text-slate-900" },
  ];
  const isRiskStatus = metrics.status.tone === "risk";

  return (
    <section
      className={`rounded-[1.75rem] border p-4 shadow-sm ${
        STATUS_PANEL_CLASS[metrics.status.tone]
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)_300px] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <ReportAssetSlot
            type="status"
            className="size-8 rounded-xl bg-white/80 bg-none shadow-sm ring-1 ring-red-100"
            imageClassName="size-4"
            useAsset={isRiskStatus}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
              AI Release Status
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  STATUS_BADGE_CLASS[metrics.status.tone]
                }`}
              >
                {metrics.status.label}
              </span>
              <span className="text-2xl font-bold tracking-tight">
                {metrics.status.label}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm font-medium leading-6 text-slate-700">{message}</p>

        <dl className="grid grid-cols-3 gap-2">
          {supportMetrics.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/70 bg-white/85 px-3 py-2 shadow-sm"
            >
              <dt className="truncate text-[11px] font-semibold text-slate-500">
                {item.label}
              </dt>
              <dd className={`mt-1 text-xl font-bold ${item.tone}`}>
                {item.value.toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
