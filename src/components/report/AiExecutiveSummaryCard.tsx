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
    return `Overall QA still has ${highRisk.toLocaleString()} high-risk Remaining issue(s) and ${blocked.toLocaleString()} Blocked item(s), so release follow-up is needed before closure.`;
  }

  if (tone === "caution") {
    return `Overall QA has ${remaining.toLocaleString()} Remaining issue(s) that should be reviewed as follow-up items.`;
  }

  return "Overall QA is stable in the top dashboard metrics, with no major risk signal visible.";
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
    analysisSummary.qaFollowUps[0] ??
      "Review raw QA comments in Detailed QA Data when needed.",
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
  const metricStripItems = [
    {
      label: "Total Test Cases",
      value: evidenceItems[0].value,
      slotType: "metric-test-cases" as const,
    },
    {
      label: "Jira Issues",
      value: evidenceItems[1].value,
      slotType: "metric-jira-issues" as const,
    },
    {
      label: "Features",
      value: evidenceItems[2].value,
      slotType: "metric-features" as const,
    },
    {
      label: "RC Versions",
      value: evidenceItems[3].value,
      slotType: "metric-rc-versions" as const,
    },
    {
      label: "Data Sources",
      value: evidenceItems[4].value,
      slotType: "metric-data-sources" as const,
    },
  ];

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
    <section className="min-w-0 rounded-[2rem] border border-indigo-200 bg-gradient-to-br from-indigo-100/80 via-violet-50 to-white p-5 shadow-xl shadow-indigo-100/70 sm:p-6">
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
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            AI Generated Release Analysis
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Conclusion, risk signals, follow-up direction, and evidence sources
            are organized from the current QA and Jira data.
          </p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-fit rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Analyzing..." : "Regenerate AI Analysis"}
        </button>
      </div>

      {isLoading ? (
        <p className="mt-5 rounded-2xl border border-indigo-100 bg-white/85 p-4 text-sm leading-6 text-slate-500">
          Generating AI Analysis...
        </p>
      ) : (
        <>
          <div className="mt-5 grid overflow-hidden rounded-3xl border border-indigo-100 bg-white/95 shadow-sm lg:grid-cols-[1.15fr_1fr_1fr_0.9fr]">
            <div className="border-b border-indigo-100/80 p-5 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <ReportAssetSlot
                  type="ai-summary"
                  className="size-8 rounded-xl bg-white/80 bg-none shadow-sm ring-1 ring-indigo-100"
                  imageClassName="size-5"
                />
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  AI Overall Diagnosis
                </p>
              </div>
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
                <div className="rounded-2xl bg-indigo-50 px-3 py-2">
                  <p className="text-indigo-500">Pass Rate</p>
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
              <div className="flex items-center gap-3">
                <ReportAssetSlot
                  type="risk"
                  className="size-8 rounded-xl bg-white/80 bg-none shadow-sm ring-1 ring-red-100"
                  imageClassName="size-5"
                />
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  AI Risk Detection
                </p>
              </div>
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
              <div className="flex items-center gap-3">
                <ReportAssetSlot
                  type="recommendation"
                  className="size-8 rounded-xl bg-white/80 bg-none shadow-sm ring-1 ring-indigo-100"
                  imageClassName="size-5"
                />
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  AI Recommendation
                </p>
              </div>
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
              <div className="flex items-center gap-3">
                <ReportAssetSlot
                  type="evidence"
                  className="size-8 rounded-xl bg-white/80 bg-none shadow-sm ring-1 ring-violet-100"
                  imageClassName="size-5"
                />
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Evidence Sources
                </p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Data used for this QA / Jira report.
              </p>
              <dl className="mt-4 space-y-3">
                {evidenceItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <dt className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
                      <span className="size-1.5 shrink-0 rounded-full bg-violet-300" />
                      <span className="truncate">{item.label}</span>
                    </dt>
                    <dd className="text-sm font-bold text-slate-950">
                      {item.value.toLocaleString()}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-700">
                Medium {mediumRisk.toLocaleString()} / Low{" "}
                {lowRisk.toLocaleString()} / Next Event{" "}
                {nextEventCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 rounded-3xl border border-indigo-100 bg-white/80 p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
            {metricStripItems.map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 items-center gap-3 rounded-2xl bg-indigo-50/50 px-3 py-2"
              >
                <ReportAssetSlot
                  type={item.slotType}
                  className="size-8 rounded-xl bg-white/85 bg-none shadow-sm ring-1 ring-indigo-100"
                  imageClassName="size-5"
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
