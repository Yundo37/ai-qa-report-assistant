import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
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
  highRisk: number,
  blocked: number
) {
  if (tone === "risk") {
    return "High / Highest Remaining 이슈가 남아 있어 배포 전 후속 확인이 필요합니다.";
  }

  if (tone === "caution") {
    if (blocked > 0) {
      return "Blocked 항목과 Remaining 이슈를 중심으로 추가 확인이 필요합니다.";
    }

    if (remaining > 0) {
      return "Remaining 이슈가 남아 있어 후속 확인 항목을 정리해야 합니다.";
    }

    return "일부 QA 지표에 확인이 필요한 항목이 있습니다.";
  }

  return "상단 지표 기준 주요 위험 신호가 크지 않은 상태입니다.";
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
    metrics.highRisk,
    metrics.blocked
  );
  const supportMetrics = [
    { label: "High Risk", value: metrics.highRisk, tone: "text-red-700" },
    { label: "Blocked", value: metrics.blocked, tone: "text-orange-700" },
    { label: "Remaining", value: metrics.remaining, tone: "text-slate-900" },
  ];

  return (
    <section
      className={`rounded-3xl border p-5 shadow-sm ${
        STATUS_PANEL_CLASS[metrics.status.tone]
      }`}
    >
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
            QA Release Status
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                STATUS_BADGE_CLASS[metrics.status.tone]
              }`}
            >
              {metrics.status.label}
            </span>
            <span className="text-3xl font-bold tracking-tight">
              {metrics.status.label}
            </span>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-700">{message}</p>

        <dl className="grid grid-cols-3 gap-2">
          {supportMetrics.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2.5 shadow-sm"
            >
              <dt className="truncate text-[11px] font-semibold text-slate-500">
                {item.label}
              </dt>
              <dd className={`mt-1 text-2xl font-bold ${item.tone}`}>
                {item.value.toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
