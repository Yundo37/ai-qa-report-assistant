"use client";

import { useState } from "react";
import {
  getQaReleaseStatusTone,
  type QaReleaseStatusTone,
} from "@/lib/report/qaReleaseStatus";
import type { AnalysisSummaryState, RemainingIssue } from "@/types/report";

const PRIORITY_ORDER: Record<string, number> = {
  Highest: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Lowest: 4,
};

type IndexedIssue = {
  issue: RemainingIssue;
  index: number;
};

type DisplayModel = {
  badge: string;
  description: string;
  rows: IndexedIssue[];
  emptyMessage: string;
  auxiliaryButtonLabel: string;
  auxiliaryRows: IndexedIssue[];
};

function countByPriority(issues: RemainingIssue[]) {
  return issues.reduce(
    (summary, issue) => {
      if (issue.priority === "Highest") summary.Highest += 1;
      if (issue.priority === "High") summary.High += 1;
      if (issue.priority === "Medium") summary.Medium += 1;
      if (issue.priority === "Low") summary.Low += 1;
      if (issue.priority === "Lowest") summary.Lowest += 1;
      return summary;
    },
    { Highest: 0, High: 0, Medium: 0, Low: 0, Lowest: 0 }
  );
}

function sortByPriority(items: IndexedIssue[]) {
  return [...items].sort((left, right) => {
    const priorityDiff =
      (PRIORITY_ORDER[left.issue.priority] ?? 99) -
      (PRIORITY_ORDER[right.issue.priority] ?? 99);

    return priorityDiff || left.index - right.index;
  });
}

function priorityClassName(priority: string) {
  if (priority === "Highest" || priority === "High") {
    return "bg-red-50 text-red-700";
  }
  if (priority === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

function getRemainingPrioritySummary(
  analysisSummary: NonNullable<AnalysisSummaryState>
) {
  const fallbackPriority = countByPriority(analysisSummary.remainingIssues);
  const remainingPriority =
    analysisSummary.qaIssueOverview?.remaining?.prioritySummary;

  return {
    Highest: remainingPriority?.Highest ?? fallbackPriority.Highest,
    High: remainingPriority?.High ?? fallbackPriority.High,
    Medium: remainingPriority?.Medium ?? fallbackPriority.Medium,
    Low: remainingPriority?.Low ?? fallbackPriority.Low,
    Lowest: remainingPriority?.Lowest ?? fallbackPriority.Lowest,
  };
}

function createDisplayModel({
  analysisSummary,
  tone,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  tone: QaReleaseStatusTone;
}): DisplayModel {
  const indexedIssues = analysisSummary.remainingIssues.map((issue, index) => ({
    issue,
    index,
  }));
  const highIssues = sortByPriority(
    indexedIssues.filter(
      ({ issue }) => issue.priority === "Highest" || issue.priority === "High"
    )
  );
  const mediumIssues = sortByPriority(
    indexedIssues.filter(({ issue }) => issue.priority === "Medium")
  );
  const lowIssues = sortByPriority(
    indexedIssues.filter(
      ({ issue }) => issue.priority === "Low" || issue.priority === "Lowest"
    )
  );

  if (tone === "risk") {
    if (highIssues.length > 0) {
      return {
        badge: `High+ ${highIssues.length}`,
        description: "전체 잔여 이슈 중 High / Highest 항목을 우선 표시합니다.",
        rows: highIssues.slice(0, 10),
        emptyMessage:
          "High / Highest 잔여 이슈는 없습니다. Medium 잔여 이슈를 우선 확인하세요.",
        auxiliaryButtonLabel: "Medium / Low 잔여 이슈",
        auxiliaryRows: [...mediumIssues, ...lowIssues],
      };
    }

    return {
      badge: `Medium ${mediumIssues.length}`,
      description:
        "High / Highest 잔여 이슈는 없으며 Medium 잔여 이슈를 우선 표시합니다.",
      rows: mediumIssues.slice(0, 10),
      emptyMessage: "현재 우선 표시할 잔여 이슈는 없습니다.",
      auxiliaryButtonLabel: "Low / Lowest 잔여 이슈",
      auxiliaryRows: lowIssues,
    };
  }

  if (tone === "caution") {
    return {
      badge: `Medium ${mediumIssues.length}`,
      description:
        "High / Highest 잔여 이슈는 없으며, Medium 잔여 이슈를 중심으로 표시합니다.",
      rows: mediumIssues.slice(0, 7),
      emptyMessage:
        "현재 우선 표시할 Medium 잔여 이슈는 없습니다. Low / Next Event 항목은 후속 확인 영역에서 관리합니다.",
      auxiliaryButtonLabel: "Low / Lowest 잔여 이슈",
      auxiliaryRows: lowIssues,
    };
  }

  return {
    badge: `Low ${lowIssues.length}`,
    description: "High / Medium 잔여 이슈는 없습니다.",
    rows: [],
    emptyMessage: `Low / Lowest 잔여 이슈 ${lowIssues.length}건은 운영 모니터링 항목으로 관리합니다.`,
    auxiliaryButtonLabel: "Low / Lowest 잔여 이슈",
    auxiliaryRows: lowIssues,
  };
}

function RemainingIssueRow({
  issue,
  index,
}: {
  issue: RemainingIssue;
  index: number;
}) {
  return (
    <div
      key={`${issue.key}-${index}`}
      className="grid grid-cols-[minmax(0,1fr)_82px_82px] items-center gap-3 border-t border-slate-100 px-3 py-2.5 text-xs first:border-t-0"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-indigo-700">{issue.key}</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
          {issue.summary}
        </p>
      </div>
      <span
        className={`w-fit justify-self-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityClassName(
          issue.priority
        )}`}
      >
        {issue.priority}
      </span>
      <span className="max-w-full truncate justify-self-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
        {issue.status}
      </span>
    </div>
  );
}

function RemainingIssueTable({
  rows,
  auxiliaryRows = [],
  auxiliaryLabel = "",
  className = "",
}: {
  rows: IndexedIssue[];
  auxiliaryRows?: IndexedIssue[];
  auxiliaryLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-indigo-100 bg-white ${className}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_82px_82px] px-3 py-2 text-[11px] font-semibold text-slate-400">
        <span>Issue</span>
        <span className="text-center">Priority</span>
        <span className="text-center">Status</span>
      </div>
      {rows.map(({ issue, index }) => (
        <RemainingIssueRow
          key={`${issue.key}-${index}`}
          issue={issue}
          index={index}
        />
      ))}
      {auxiliaryRows.length > 0 && (
        <>
          <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
            {auxiliaryLabel}
          </div>
          {auxiliaryRows.map(({ issue, index }) => (
            <RemainingIssueRow
              key={`${issue.key}-${index}-auxiliary`}
              issue={issue}
              index={index}
            />
          ))}
        </>
      )}
    </div>
  );
}

export function RemainingIssuesDashboardCard({
  analysisSummary,
  toneOverride,
  className = "",
  onExpandedChange,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  toneOverride?: QaReleaseStatusTone;
  className?: string;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const [isAuxiliaryExpanded, setIsAuxiliaryExpanded] = useState(false);
  const remainingPriority = getRemainingPrioritySummary(analysisSummary);
  const totalTestCases =
    analysisSummary.overallQaSummary?.Total ?? analysisSummary.qaTotal.Total ?? 0;
  const blockedCount =
    analysisSummary.overallQaSummary?.Blocked ??
    analysisSummary.qaTotal.Blocked ??
    0;
  const tone =
    toneOverride ??
    getQaReleaseStatusTone({
      totalTc: totalTestCases,
      blockedCount,
      remainingPriority,
    });
  const displayModel = createDisplayModel({ analysisSummary, tone });
  const hasRows = displayModel.rows.length > 0;
  const isStable = tone === "stable";
  const hasAuxiliaryRows = !isStable && displayModel.auxiliaryRows.length > 0;

  return (
    <section
      className={`flex min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[1.35rem] font-extrabold tracking-tight text-slate-950">
            주요 잔여 이슈
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {displayModel.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {displayModel.badge}
          </span>
          {hasAuxiliaryRows && (
            <button
              type="button"
              onClick={() =>
                setIsAuxiliaryExpanded((value) => {
                  const nextValue = !value;
                  onExpandedChange?.(nextValue);
                  return nextValue;
                })
              }
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
              aria-label={`${displayModel.auxiliaryButtonLabel} ${
                isAuxiliaryExpanded ? "접기" : "전체 보기"
              }`}
            >
              {isAuxiliaryExpanded
                ? "접기"
                : `전체 보기 (${displayModel.auxiliaryRows.length})`}
            </button>
          )}
        </div>
      </div>

      {analysisSummary.remainingIssues.length === 0 ? (
        <p className="mt-4 flex min-h-[180px] flex-1 items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          현재 남아 있는 잔여 이슈가 없습니다.
        </p>
      ) : isStable ? (
        <>
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              High / Medium 잔여 이슈는 없습니다.
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-700">
              {displayModel.emptyMessage}
            </p>
          </div>
          {displayModel.auxiliaryRows.length > 0 && (
            <div className="mt-3">
              <RemainingIssueTable rows={displayModel.auxiliaryRows} />
            </div>
          )}
        </>
      ) : (
        <>
          {hasRows ? (
            <div className="mt-4">
              <RemainingIssueTable
                rows={displayModel.rows}
                auxiliaryRows={
                  isAuxiliaryExpanded ? displayModel.auxiliaryRows : []
                }
                auxiliaryLabel={displayModel.auxiliaryButtonLabel}
              />
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-indigo-100 bg-white">
              <p className="flex min-h-[180px] items-center border-t border-slate-100 px-3 py-4 text-sm text-slate-500">
                {displayModel.emptyMessage}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
