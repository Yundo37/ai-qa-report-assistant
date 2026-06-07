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
  const riskItems = [
    {
      label: "High / Highest Remaining",
      value: highRisk,
      tone: "High" as const,
    },
    { label: "Blocked TC", value: blockedCount, tone: "Medium" as const },
    {
      label: patternItems[0]?.name ?? "반복 이슈 패턴",
      value: patternItems[0]?.count ?? 0,
      tone: "Medium" as const,
    },
    {
      label: "RC Remaining",
      value: analysisSummary.rcProgress.remainingIssues,
      tone: "Low" as const,
    },
  ];
  const recommendationItems = [
    highRisk > 0
      ? "High / Highest Remaining 이슈를 우선 확인합니다."
      : "상위 Remaining 이슈 상태를 정기적으로 확인합니다.",
    blockedCount > 0
      ? "Blocked TC 원인과 담당 액션을 재확인합니다."
      : "Blocked TC는 현재 보조 모니터링 항목으로 관리합니다.",
    nextEventCount > 0
      ? "Next Event 항목은 후속 일정과 재확인 기준을 정리합니다."
      : "Next Event 항목이 추가될 경우 후속 확인 대상으로 관리합니다.",
    analysisSummary.qaFollowUps[0] ??
      "QA Comment / Follow-up 항목은 Detailed QA Data에서 함께 확인합니다.",
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
    <section className="min-w-0 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-violet-50/60 to-white p-5 shadow-md shadow-indigo-100/70 sm:p-6">
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
            AI 기반 QA Release 요약
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            QA 데이터와 Jira 이슈를 기반으로 구성한 Dashboard 요약입니다.
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
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {metrics.status.description}
              </p>
              <div className="mt-5 grid place-items-center">
                <div
                  className="grid size-28 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#7c3aed ${metrics.passRate}%, #e2e8f0 0)`,
                  }}
                >
                  <div className="grid size-20 place-items-center rounded-full bg-white text-center">
                    <span className="text-xl font-bold text-slate-950">
                      {metrics.passRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-indigo-100/80 p-5 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                AI Risk Detection
              </p>
              <ul className="mt-4 space-y-3">
                {riskItems.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-slate-700">
                      {item.label}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityBadgeClass(
                        item.tone
                      )}`}
                    >
                      {item.value.toLocaleString()}
                    </span>
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
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-indigo-500" />
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
