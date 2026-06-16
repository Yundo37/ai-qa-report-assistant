import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
import { ReportAssetSlot } from "@/components/report/ReportAssetSlot";
import type { AnalysisSummaryState } from "@/types/report";

const STATUS_PANEL_CLASS = {
  stable: "border-emerald-100 bg-white/85 text-slate-900",
  caution: "border-amber-100 bg-white/85 text-slate-900",
  risk: "border-rose-100 bg-white/85 text-slate-900",
};

const STATUS_LABEL = {
  stable: "안정",
  caution: "주의 필요",
  risk: "위험",
};

const STATUS_TEXT_CLASS = {
  stable: "text-emerald-600",
  caution: "text-amber-600",
  risk: "text-red-600",
};

const STATUS_ICON_CLASS = {
  stable: "bg-transparent ring-emerald-100/40",
  caution: "bg-transparent ring-amber-100/40",
  risk: "bg-transparent ring-rose-100/40",
};

type QaReleaseStatusMessageParams = {
  state: "stable" | "caution" | "risk";
  rcLabel?: string;
  highHighestRemainingCount: number;
  mediumRemainingCount: number;
  lowRemainingCount: number;
  blockedCount: number;
  nextEventCount: number;
};

function createQaReleaseStatusMessage({
  state,
  rcLabel,
}: QaReleaseStatusMessageParams) {
  const targetText =
    rcLabel && rcLabel !== "-" ? `현재 ${rcLabel}는` : "현재 릴리즈는";

  if (state === "risk") {
    return {
      title: STATUS_LABEL.risk,
      lines: [
        `${targetText} 배포 전 우선 확인이 필요한 잔여 리스크가 남아 있습니다.`,
        "High / Highest 잔여 이슈와 Blocked 영향 항목은 원인 확인 및 회귀 검증이 필요합니다.",
      ],
    };
  }

  if (state === "caution") {
    return {
      title: STATUS_LABEL.caution,
      lines: [
        `${targetText} 치명도 높은 차단 신호는 확인되지 않았습니다.`,
        "Medium 잔여 이슈와 후속 확인 항목은 재검증 범위로 분리 관리해야 합니다.",
      ],
    };
  }

  return {
    title: STATUS_LABEL.stable,
    lines: [
      `${targetText} 배포 차단 수준의 High / Medium 잔여 이슈가 없습니다.`,
      "남은 Low 이슈와 후속 확인 항목은 운영 모니터링 범위에서 관리 가능합니다.",
    ],
  };
}

export function QaReleaseStatusCard({
  analysisSummary,
  rcLabel,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  rcLabel?: string;
}) {
  const metrics = createOverallDashboardMetrics(analysisSummary);
  const remainingPrioritySummary =
    analysisSummary.qaIssueOverview?.remaining?.prioritySummary;
  const lowRemainingCount =
    (remainingPrioritySummary?.Low ?? 0) +
    (remainingPrioritySummary?.Lowest ?? 0);
  const statusMessage = createQaReleaseStatusMessage({
    state: metrics.status.tone,
    rcLabel,
    highHighestRemainingCount: metrics.highRisk,
    mediumRemainingCount: metrics.mediumRemaining,
    lowRemainingCount,
    blockedCount: metrics.blocked,
    nextEventCount: metrics.nextEvent,
  });

  return (
    <section
      className={`rounded-[1.5rem] border p-4 shadow-sm shadow-indigo-100/40 ${
        STATUS_PANEL_CLASS[metrics.status.tone]
      }`}
    >
      <div className="grid gap-3 md:grid-cols-[160px_64px_minmax(0,1fr)] md:items-center">
        <div className="min-w-0 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            QA Release Status
          </p>
          <h3
            className={`mt-2 text-4xl font-black tracking-tight ${
              STATUS_TEXT_CLASS[metrics.status.tone]
            }`}
          >
            {statusMessage.title}
          </h3>
        </div>

        <div className="justify-self-center">
          <ReportAssetSlot
            type="status"
            className={`size-14 rounded-2xl bg-none shadow-none ring-1 ${
              STATUS_ICON_CLASS[metrics.status.tone]
            }`}
            imageClassName="size-12"
          />
        </div>

        <div className="min-w-0 space-y-1 text-sm font-medium leading-6 text-slate-600">
          {statusMessage.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
