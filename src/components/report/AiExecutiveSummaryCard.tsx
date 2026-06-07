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

function getPriorityTone(priority: "High" | "Medium" | "Low") {
  if (priority === "High") return "border-red-100 bg-red-50 text-red-700";
  if (priority === "Medium") return "border-amber-100 bg-amber-50 text-amber-700";
  return "border-emerald-100 bg-emerald-50 text-emerald-700";
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
  const lowRisk =
    (remainingPriority?.Low ?? 0) + (remainingPriority?.Lowest ?? 0);
  const failCount =
    analysisSummary.overallQaSummary?.Fail ?? analysisSummary.qaTotal.Fail ?? 0;
  const blockedCount =
    analysisSummary.overallQaSummary?.Blocked ??
    analysisSummary.qaTotal.Blocked ??
    0;
  const nextEventCount =
    analysisSummary.overallQaSummary?.NextEvent ??
    analysisSummary.qaTotal.NextEvent ??
    0;
  const followUps = analysisSummary.qaFollowUps.slice(0, 3);
  const insightItems = [
    `Pass Rate ${metrics.passRate}% 기준으로 전체 TC 흐름을 확인합니다.`,
    `Fail ${failCount.toLocaleString()}건, Blocked ${blockedCount.toLocaleString()}건이 집계되었습니다.`,
    `Remaining ${metrics.remaining.toLocaleString()}건 중 High / Highest ${metrics.highRisk.toLocaleString()}건을 우선 확인합니다.`,
  ];
  const riskItems = [
    { label: "High / Highest", value: highRisk, tone: "High" as const },
    { label: "Medium", value: mediumRisk, tone: "Medium" as const },
    { label: "Low / Lowest", value: lowRisk, tone: "Low" as const },
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
    <section className="min-w-0 rounded-3xl border border-indigo-200 bg-gradient-to-br from-white via-white to-violet-50/80 p-5 shadow-sm sm:p-6">
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
          <div className="mt-5 grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Overall QA 상태
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="grid size-24 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#4f46e5 ${metrics.passRate}%, #e2e8f0 0)`,
                  }}
                >
                  <div className="grid size-16 place-items-center rounded-full bg-white text-center">
                    <span className="text-lg font-bold text-slate-950">
                      {metrics.passRate}%
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1 ${
                      STATUS_BADGE_CLASS[metrics.status.tone]
                    }`}
                  >
                    {metrics.status.label}
                  </span>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {metrics.status.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-indigo-50 px-3 py-2">
                  <p className="text-[11px] font-semibold text-indigo-600">
                    Remaining
                  </p>
                  <p className="mt-1 text-lg font-bold text-indigo-900">
                    {metrics.remaining.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-red-50 px-3 py-2">
                  <p className="text-[11px] font-semibold text-red-600">
                    High Risk
                  </p>
                  <p className="mt-1 text-lg font-bold text-red-700">
                    {metrics.highRisk.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Key QA Insight
                  </p>
                  <ul className="mt-3 space-y-2">
                    {insightItems.map((item) => (
                      <li
                        key={item}
                        className="rounded-xl bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Remaining Risk Summary
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {riskItems.map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-xl border px-3 py-2 ${getPriorityTone(
                          item.tone
                        )}`}
                      >
                        <p className="truncate text-[11px] font-semibold">
                          {item.label}
                        </p>
                        <p className="mt-1 text-lg font-bold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-orange-50 px-3 py-2 text-orange-700">
                      <p className="text-[11px] font-semibold">Blocked</p>
                      <p className="mt-1 text-base font-bold">{blockedCount}</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50 px-3 py-2 text-indigo-700">
                      <p className="text-[11px] font-semibold">Next Event</p>
                      <p className="mt-1 text-base font-bold">
                        {nextEventCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Follow-up / Monitoring
                </p>
                {followUps.length > 0 ? (
                  <ul className="mt-3 grid gap-2 md:grid-cols-3">
                    {followUps.map((followUp) => (
                      <li
                        key={followUp}
                        className="min-w-0 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700"
                      >
                        <span className="line-clamp-2">{followUp}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    후속 확인 항목이 없습니다.
                  </p>
                )}
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
