"use client";

import { useState } from "react";
import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
import type { AnalysisSummaryState } from "@/types/report";

type AiExecutiveSummaryCardProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  analysisText: string;
  isLoading: boolean;
  onAnalyze: () => void;
};

const STATUS_BADGE_CLASS = {
  stable: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  caution: "bg-amber-50 text-amber-700 ring-amber-100",
  risk: "bg-red-50 text-red-700 ring-red-100",
};

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
    return `현재 Overall QA는 High Risk Remaining ${highRisk.toLocaleString()}건과 Blocked ${blocked.toLocaleString()}건의 영향이 남아 있어 배포 전 추가 확인이 필요한 상태입니다.`;
  }

  if (tone === "caution") {
    return `현재 Overall QA는 Remaining ${remaining.toLocaleString()}건을 중심으로 후속 확인이 필요한 상태입니다.`;
  }

  return "현재 Overall QA는 상단 지표 기준 안정적인 흐름이며, 주요 위험 신호는 크지 않습니다.";
}

export function AiExecutiveSummaryCard({
  analysisSummary,
  analysisText,
  isLoading,
  onAnalyze,
}: AiExecutiveSummaryCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const paragraphs = analysisText
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
  const features =
    analysisSummary.overallTestSheets?.length || analysisSummary.testSheets.length;
  const patternItems = (analysisSummary.issuePatternAnalysis ?? []).slice(0, 2);
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
          ? "High / Highest Remaining 이슈가 주요 리스크로 확인됩니다."
          : "High / Highest Remaining 이슈는 현재 상단 리스크로 크지 않습니다.",
      value: highRisk,
      tone: highRisk > 0 ? ("High" as const) : ("Low" as const),
    },
    {
      label:
        blockedCount > 0
          ? "Blocked 항목이 기능 검증 범위에 영향을 줄 수 있습니다."
          : "Blocked 항목은 현재 낮은 수준입니다.",
      value: blockedCount,
      tone: blockedCount > 0 ? ("Medium" as const) : ("Low" as const),
    },
    {
      label: patternItems[0]
        ? `${patternItems[0].name} 패턴이 반복 관찰됩니다.`
        : "반복 이슈 패턴은 추가 데이터에서 확인합니다.",
      value: patternItems[0]?.count ?? 0,
      tone: patternItems[0] ? ("Medium" as const) : ("Low" as const),
    },
    {
      label: "RC 잔여 흐름은 RC Progress에서 함께 확인합니다.",
      value: analysisSummary.rcProgress.remainingIssues,
      tone:
        analysisSummary.rcProgress.remainingIssues > 0
          ? ("Medium" as const)
          : ("Low" as const),
    },
  ];
  const recommendationItems = [
    highRisk > 0
      ? "상위 Remaining 이슈는 배포 전 재확인이 필요합니다."
      : "상위 Remaining 이슈는 정기적으로 상태를 확인합니다.",
    blockedCount > 0
      ? "Blocked 항목은 선행 이슈 해결 후 재검증이 필요합니다."
      : "Blocked 항목은 보조 모니터링 대상으로 유지합니다.",
    nextEventCount > 0
      ? "Next Event 항목은 후속 일정에서 별도 관리하는 것이 좋습니다."
      : "Next Event가 추가되면 후속 확인 대상으로 분리합니다.",
    analysisSummary.qaFollowUps[0] ??
      "QA Comment / Follow-up 원문은 Detailed QA Data에서 확인합니다.",
  ];
  const evidenceItems = [
    {
      label: "Test Cases",
      value:
        analysisSummary.overallQaSummary?.Total ??
        analysisSummary.qaTotal.Total ??
        0,
    },
    { label: "Jira Issues", value: analysisSummary.jiraMatchedRows },
    { label: "Features", value: features },
    { label: "RC Versions", value: analysisSummary.rcProgress.items.length },
    { label: "Data Sources", value: analysisSummary.testSheets.length + 1 },
  ];

  if (!hasAnalysis && !isLoading) {
    return (
      <section className="min-w-0 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              AI Executive Summary
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
              AI 기반 QA 요약
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              AI Analysis를 생성하면 QA 데이터 기반 요약을 확인할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onAnalyze}
            className="w-fit rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            AI Analysis 생성
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-violet-50/70 to-white p-5 shadow-lg shadow-indigo-100/70 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white">
              AI
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              AI Executive Summary
            </p>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            결론 중심 QA Release 요약
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            QA 데이터와 Jira 이슈를 기반으로 결론, 리스크, 후속 확인,
            근거 데이터를 순서대로 정리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-fit rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Analyzing..." : "AI Analysis 다시 생성"}
        </button>
      </div>

      {isLoading ? (
        <p className="mt-5 rounded-2xl border border-indigo-100 bg-white/80 p-4 text-sm leading-6 text-slate-500">
          AI Analysis 생성 중...
        </p>
      ) : (
        <>
          <div className="mt-5 grid overflow-hidden rounded-3xl border border-indigo-100 bg-white/95 shadow-sm lg:grid-cols-4">
            <div className="border-b border-indigo-100/80 p-5 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                AI 종합 진단
              </p>
              <span
                className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1 ${
                  STATUS_BADGE_CLASS[metrics.status.tone]
                }`}
              >
                {metrics.status.label}
              </span>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">
                {conclusionText}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-slate-500">Pass Rate</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {metrics.passRate}%
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-slate-500">Remaining</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {metrics.remaining.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-indigo-100/80 p-5 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                AI Risk Detection
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
                AI Recommendation
              </p>
              <ul className="mt-4 space-y-3">
                {recommendationItems.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span className="line-clamp-2 text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Evidence Sources
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                이번 리포트에 사용된 QA / Jira 데이터 기준입니다.
              </p>
              <dl className="mt-4 space-y-3">
                {evidenceItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <dt className="text-sm text-slate-500">{item.label}</dt>
                    <dd className="text-sm font-bold text-slate-950">
                      {item.value.toLocaleString()}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-700">
                Medium {mediumRisk.toLocaleString()} · Low{" "}
                {lowRisk.toLocaleString()} · Next Event{" "}
                {nextEventCount.toLocaleString()}
              </div>
            </div>
          </div>

          {hasAnalysis && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsDetailOpen((value) => !value)}
                className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300"
              >
                {isDetailOpen ? "AI 요약 접기" : "AI 요약 상세보기"}
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
