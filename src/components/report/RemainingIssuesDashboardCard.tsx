"use client";

import { useState } from "react";
import type { RemainingIssue } from "@/types/report";

const HIGH_PRIORITY_ORDER: Record<string, number> = {
  Highest: 0,
  High: 1,
};

function isHighPriority(issue: RemainingIssue) {
  return issue.priority === "Highest" || issue.priority === "High";
}

function priorityClassName(priority: string) {
  if (priority === "Highest" || priority === "High") {
    return "bg-red-50 text-red-700";
  }
  if (priority === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
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
      className="grid grid-cols-[82px_minmax(0,1fr)_72px_68px_68px] items-center gap-2 border-t border-slate-100 px-2.5 py-2 text-xs first:border-t-0"
    >
      <span className="truncate font-semibold text-indigo-700">{issue.key}</span>
      <span className="truncate font-medium text-slate-950">
        {issue.summary}
      </span>
      <span
        className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityClassName(
          issue.priority
        )}`}
      >
        {issue.priority}
      </span>
      <span className="truncate rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
        {issue.status}
      </span>
      <span className="truncate text-[11px] font-medium text-slate-500">
        {issue.version || "-"}
      </span>
    </div>
  );
}

export function RemainingIssuesDashboardCard({
  issues,
}: {
  issues: RemainingIssue[];
}) {
  const [showLowerPriority, setShowLowerPriority] = useState(false);
  const highIssues = issues
    .map((issue, index) => ({ issue, index }))
    .filter(({ issue }) => isHighPriority(issue))
    .sort((left, right) => {
      const priorityDiff =
        HIGH_PRIORITY_ORDER[left.issue.priority] -
        HIGH_PRIORITY_ORDER[right.issue.priority];
      return priorityDiff || left.index - right.index;
    });
  const lowerIssues = issues
    .map((issue, index) => ({ issue, index }))
    .filter(({ issue }) => !isHighPriority(issue));
  const visibleIssues = showLowerPriority
    ? [...highIssues, ...lowerIssues]
    : highIssues;

  return (
    <section className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-950">
          주요 잔여 이슈
        </h2>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
          Total {issues.length}
        </span>
      </div>

      {issues.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          현재 열려 있는 잔여 이슈가 없습니다.
        </p>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-2xl border border-indigo-100 bg-white">
            <div className="grid grid-cols-[82px_minmax(0,1fr)_72px_68px_68px] px-2.5 py-2 text-[11px] font-semibold text-slate-400">
              <span>Key</span>
              <span>Summary</span>
              <span>Priority</span>
              <span>Status</span>
              <span>RC / Ver</span>
            </div>
            {visibleIssues.length > 0 ? (
              visibleIssues.map(({ issue, index }) => (
                <RemainingIssueRow
                  key={`${issue.key}-${index}`}
                  issue={issue}
                  index={index}
                />
              ))
            ) : (
              <p className="border-t border-slate-100 px-3 py-4 text-sm text-slate-500">
                High / Highest 잔여 이슈는 현재 없습니다.
              </p>
            )}
          </div>

          {lowerIssues.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLowerPriority((value) => !value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-700"
            >
              {showLowerPriority
                ? "Medium / Low 잔여 이슈 접기"
                : `Medium / Low 잔여 이슈 더 보기 (${lowerIssues.length})`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
