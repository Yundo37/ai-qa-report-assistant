"use client";

import { useState } from "react";
import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
import { ReportAssetSlot } from "@/components/report/ReportAssetSlot";
import type { AnalysisSummaryState } from "@/types/report";

type AiExecutiveSummaryCardProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  analysisText: string;
  isLoading: boolean;
  onAnalyze: () => void;
};

// TEMP_DESIGN_PREVIEW_ONLY: remove this mock when AI Summary UI review no longer needs a local preview.
const TEMP_DESIGN_PREVIEW_ONLY_AI_ANALYSIS_TEXT = [
  "현재 Overall QA는 High / Highest Remaining과 Blocked 항목 확인이 필요한 상태입니다. 상단 Remaining 이슈와 RC별 잔여 흐름을 함께 검토하면 릴리즈 전 우선 확인 범위를 빠르게 좁힐 수 있습니다.",
  "주요 리스크는 High Priority Remaining, Blocked 항목, 반복 이슈 패턴에서 확인됩니다. 특히 반복 패턴이 여러 데이터 소스에 걸쳐 나타나는 경우 기능 검증 범위와 후속 확인 항목을 분리해 관리하는 것이 좋습니다.",
  "후속 액션은 Top Remaining Issue 재확인, Blocked 항목 재검증, Next Event 항목 별도 추적을 중심으로 정리할 수 있습니다. Next Event는 현재 릴리즈 실패 신호가 아니라 차기 대응 및 모니터링 항목으로 분리해 확인합니다.",
].join("\n\n");

function priorityBadgeClass(tone: "High" | "Medium" | "Low") {
  if (tone === "High") return "bg-red-50 text-red-700";
  if (tone === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

function createConclusionText(
  tone: "stable" | "caution" | "risk",
  highRisk: number,
  blocked: number,
  remaining: number
) {
  if (tone === "risk") {
    return `High / Highest Remaining ${highRisk.toLocaleString()}건과 Blocked ${blocked.toLocaleString()}건이 주요 확인 신호입니다.`;
  }

  if (tone === "caution") {
    return `Remaining Issue ${remaining.toLocaleString()}건을 중심으로 후속 추이를 확인합니다.`;
  }

  return "주요 대시보드 지표에서 즉시 확인이 필요한 큰 리스크 신호는 보이지 않습니다.";
}

function createReleaseJudgmentLabel({
  highRisk,
  blocked,
  remaining,
  nextEvent,
}: {
  highRisk: number;
  blocked: number;
  remaining: number;
  nextEvent: number;
}) {
  if (highRisk > 0 || blocked > 0) return "추가 검증 필요";
  if (remaining > 0 || nextEvent > 0) return "모니터링 필요";
  return "안정권";
}

export function AiExecutiveSummaryCard({
  analysisSummary,
  analysisText,
  isLoading,
  onAnalyze,
}: AiExecutiveSummaryCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const hasRealAnalysisText = Boolean(analysisText.trim());
  const effectiveAnalysisText =
    (hasRealAnalysisText ? analysisText.trim() : "") ||
    (analysisSummary.reportType === "OVERALL"
      ? TEMP_DESIGN_PREVIEW_ONLY_AI_ANALYSIS_TEXT
      : "");
  const paragraphs = effectiveAnalysisText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const hasAnalysis = paragraphs.length > 0;
  const metrics = createOverallDashboardMetrics(analysisSummary);
  const remainingPriority =
    analysisSummary.qaIssueOverview?.remaining?.prioritySummary;
  const highRisk =
    (remainingPriority?.Highest ?? 0) + (remainingPriority?.High ?? 0);
  const mediumRisk = remainingPriority?.Medium ?? 0;
  const lowRisk = (remainingPriority?.Low ?? 0) + (remainingPriority?.Lowest ?? 0);
  const blockedCount =
    analysisSummary.overallQaSummary?.Blocked ??
    analysisSummary.qaTotal.Blocked ??
    0;
  const nextEventCount =
    analysisSummary.overallQaSummary?.NextEvent ??
    analysisSummary.qaTotal.NextEvent ??
    0;
  const patternItems = (analysisSummary.issuePatternAnalysis ?? []).slice(0, 3);
  const conclusionText = createConclusionText(
    metrics.status.tone,
    highRisk,
    blockedCount,
    metrics.remaining
  );
  const riskItems = [
    {
      label:
        highRisk > 0
          ? "High / Highest Remaining is the primary release risk."
          : "High / Highest Remaining is not a top risk signal.",
      value: highRisk,
      tone: highRisk > 0 ? ("High" as const) : ("Low" as const),
    },
    {
      label:
        blockedCount > 0
          ? "Blocked items may affect feature validation scope."
          : "Blocked items are currently low.",
      value: blockedCount,
      tone: blockedCount > 0 ? ("Medium" as const) : ("Low" as const),
    },
    {
      label: patternItems[0]
        ? `${patternItems[0].name} appears as a repeated pattern.`
        : "Repeated patterns need more issue data.",
      value: patternItems[0]?.count ?? 0,
      tone: patternItems[0] ? ("Medium" as const) : ("Low" as const),
    },
    {
      label: "RC remaining flow is tracked in RC Progress.",
      value: analysisSummary.rcProgress.remainingIssues,
      tone:
        analysisSummary.rcProgress.remainingIssues > 0
          ? ("Medium" as const)
          : ("Low" as const),
    },
  ];
  const recommendationItems = [
    highRisk > 0
      ? "Re-check top Remaining issues before release closure."
      : "Keep monitoring top Remaining issues on a regular cadence.",
    blockedCount > 0
      ? "Re-test Blocked items after upstream issues are resolved."
      : "Keep Blocked items as a monitoring bucket.",
    nextEventCount > 0
      ? "Track Next Event items separately as follow-up work."
      : "Separate any new Next Event items as follow-up work.",
  ].slice(0, 3);
  const patternInsightItems = patternItems.map((item) => ({
    label: item.name,
    value: item.count,
    trendLabel: item.trend[0]?.label,
  }));
  const totalTestCases =
    analysisSummary.overallQaSummary?.Total ??
    analysisSummary.qaTotal.Total ??
    0;
  const metricStripItems = [
    {
      label: "Total Test Cases",
      value: totalTestCases,
      slotType: "metric-test-cases" as const,
    },
    {
      label: "Jira Issues",
      value: analysisSummary.jiraMatchedRows,
      slotType: "metric-jira-issues" as const,
    },
    {
      label: "Remaining Issues",
      value: metrics.remaining,
      slotType: "risk" as const,
    },
    {
      label: "RC Versions",
      value: analysisSummary.rcProgress.items.length,
      slotType: "metric-rc-versions" as const,
    },
    {
      label: "QA Comments",
      value: analysisSummary.qaFollowUps.length,
      slotType: "follow-up" as const,
    },
  ];
  const passRatePercent = Math.max(0, Math.min(metrics.passRate, 100));
  const passRateDonutStyle = {
    background: `conic-gradient(#6d5dfc ${passRatePercent}%, #ece9ff ${passRatePercent}% 100%)`,
  };
  const releaseJudgmentLabel = createReleaseJudgmentLabel({
    highRisk,
    blocked: blockedCount,
    remaining: metrics.remaining,
    nextEvent: nextEventCount,
  });

  if (!hasAnalysis && !isLoading) {
    return (
      <section className="min-w-0 rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              AI Executive Summary
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
              AI QA Summary
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Generate AI Analysis to view a QA data based release summary.
            </p>
          </div>
          <button
            type="button"
            onClick={onAnalyze}
            className="w-fit rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Generate AI Analysis
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 rounded-[2rem] border border-indigo-200 bg-gradient-to-br from-indigo-100/90 via-violet-50 to-white p-5 shadow-xl shadow-indigo-100/80 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-indigo-600 text-sm font-black text-white">
              ai
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              AI Executive Summary
            </p>
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
            AI Generated Release Analysis
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            현재 QA 및 Jira 데이터를 기반으로 릴리즈 판단, 리스크 신호,
            반복 패턴, QA 확인 항목을 정리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-fit rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? "Analyzing..."
            : hasRealAnalysisText
              ? "Regenerate AI Analysis"
              : "Generate AI Analysis"}
        </button>
      </div>

      {isLoading ? (
        <p className="mt-5 rounded-2xl border border-indigo-100 bg-white/85 p-4 text-sm leading-6 text-slate-500">
          Generating AI Analysis...
        </p>
      ) : (
        <>
          <div className="mt-5 grid overflow-hidden rounded-t-3xl border-x border-t border-indigo-100 bg-white/95 shadow-sm lg:grid-cols-[1.15fr_1fr_1fr_0.9fr]">
            <div className="border-b border-indigo-100/80 p-5 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Release Judgment
              </p>
              <p className="mt-4 text-center text-xl font-black tracking-tight text-indigo-700">
                {releaseJudgmentLabel}
              </p>
              <p className="mt-3 text-center text-sm font-semibold leading-6 text-slate-800">
                {conclusionText}
              </p>
              <div className="mt-5 flex justify-center">
                <div
                  className="grid size-36 place-items-center rounded-full shadow-inner shadow-indigo-100"
                  style={passRateDonutStyle}
                  aria-label={`Pass Rate ${passRatePercent}%`}
                >
                  <div className="flex size-28 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                    <span className="block text-3xl font-black leading-none text-indigo-700">
                      {passRatePercent}%
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold leading-none text-slate-500">
                      Pass Rate
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-indigo-100/80 p-5 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Risk Signals
              </p>
              <ul className="mt-4 space-y-3">
                {riskItems.map((item) => (
                  <li key={item.label} className="text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 leading-5 text-slate-700">
                        {item.label}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityBadgeClass(
                          item.tone
                        )}`}
                      >
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-b border-indigo-100/80 p-5 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Pattern Insight
              </p>
              {patternInsightItems.length > 0 ? (
                <>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Repeated issue patterns detected from existing issue data.
                  </p>
                  <ul className="mt-4 space-y-3">
                    {patternInsightItems.map((item) => (
                      <li key={item.label} className="text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0 leading-5 text-slate-700">
                            {item.label}
                            {item.trendLabel ? (
                              <span className="mt-1 block text-xs text-slate-400">
                                Trend basis: {item.trendLabel}
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                            {item.value.toLocaleString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-500">
                  Pattern data is limited.
                </p>
              )}
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                QA Checkpoints
              </p>
              <ul className="mt-4 space-y-3">
                {recommendationItems.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-700">
                Medium {mediumRisk.toLocaleString()} / Low{" "}
                {lowRisk.toLocaleString()} / Next Event{" "}
                {nextEventCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid gap-2 rounded-b-3xl border-x border-b border-indigo-100 bg-white/85 p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
            {metricStripItems.map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 items-center gap-3 rounded-2xl bg-indigo-50/45 px-3 py-2"
              >
                <ReportAssetSlot
                  type={item.slotType}
                  className="size-9 rounded-xl bg-white/85 bg-none shadow-sm ring-1 ring-indigo-100"
                  imageClassName="size-7"
                />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-base font-bold text-slate-950">
                    {item.value.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {hasAnalysis && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsDetailOpen((value) => !value)}
                className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300"
              >
                {isDetailOpen ? "Hide full AI summary" : "View full AI summary"}
              </button>
              {isDetailOpen && (
                <div className="mt-4 space-y-4 rounded-2xl border border-indigo-100 bg-white p-4 text-[15px] leading-8 text-slate-700">
                  {paragraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className="border-l-4 border-indigo-200 pl-4"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
