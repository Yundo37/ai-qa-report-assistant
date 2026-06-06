"use client";

import { useState } from "react";
import type { RemainingIssue } from "@/types/report";

function getPriorityGroup(issue: RemainingIssue) {
  if (issue.priority === "Highest" || issue.priority === "High") return "high";
  if (issue.priority === "Medium") return "medium";
  return "low";
}

function IssueRows({ issues }: { issues: RemainingIssue[] }) {
  if (issues.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        표시할 Remaining Issue가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue, index) => (
        <article
          key={`${issue.key}-${index}`}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {issue.priority}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {issue.status}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {issue.key}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-950">
                {issue.summary}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              {issue.version || "-"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function RemainingIssuesDashboardCard({
  issues,
}: {
  issues: RemainingIssue[];
}) {
  const [showMedium, setShowMedium] = useState(false);
  const [showLow, setShowLow] = useState(false);
  const highIssues = issues.filter((issue) => getPriorityGroup(issue) === "high");
  const mediumIssues = issues.filter(
    (issue) => getPriorityGroup(issue) === "medium"
  );
  const lowIssues = issues.filter((issue) => getPriorityGroup(issue) === "low");
  const summaryItems = [
    { label: "Total", value: issues.length },
    {
      label: "Highest",
      value: issues.filter((issue) => issue.priority === "Highest").length,
    },
    {
      label: "High",
      value: issues.filter((issue) => issue.priority === "High").length,
    },
    { label: "Medium", value: mediumIssues.length },
    { label: "Low / Lowest", value: lowIssues.length },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
        Remaining Issues
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
        Remaining Issues
      </h2>

      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-950">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-950">
            High Priority Remaining
          </h3>
          <IssueRows issues={highIssues} />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowMedium((value) => !value)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            <span>Medium Remaining ({mediumIssues.length})</span>
            <span>{showMedium ? "접기" : "펼치기"}</span>
          </button>
          {showMedium && (
            <div className="mt-3">
              <IssueRows issues={mediumIssues} />
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowLow((value) => !value)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            <span>Low Remaining ({lowIssues.length})</span>
            <span>{showLow ? "접기" : "펼치기"}</span>
          </button>
          {showLow && (
            <div className="mt-3">
              <IssueRows issues={lowIssues} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
