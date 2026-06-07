import type { RemainingIssue } from "@/types/report";

function getPriorityGroup(issue: RemainingIssue) {
  if (issue.priority === "Highest" || issue.priority === "High") return "high";
  if (issue.priority === "Medium") return "medium";
  return "low";
}

function priorityClassName(priority: string) {
  if (priority === "Highest" || priority === "High") {
    return "bg-red-50 text-red-700";
  }
  if (priority === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function RepresentativeIssueRows({ issues }: { issues: RemainingIssue[] }) {
  if (issues.length === 0) {
    return (
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
        High / Highest Remaining Issue가 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      {issues.map((issue, index) => (
        <article
          key={`${issue.key}-${index}`}
          className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 first:border-t-0"
        >
          <div className="grid min-w-0 gap-1.5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityClassName(
                  issue.priority
                )}`}
              >
                {issue.priority}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {issue.status}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {issue.key}
              </span>
            </div>
            <p className="min-w-0 truncate text-xs font-medium leading-5 text-slate-950">
              {issue.summary}
            </p>
            <span className="justify-self-start rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-500 md:justify-self-end">
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
  const highIssues = issues.filter((issue) => getPriorityGroup(issue) === "high");
  const mediumIssues = issues.filter(
    (issue) => getPriorityGroup(issue) === "medium"
  );
  const lowIssues = issues.filter((issue) => getPriorityGroup(issue) === "low");
  const representativeHighIssues = highIssues.slice(0, 8);
  const hiddenHighIssueCount = Math.max(
    highIssues.length - representativeHighIssues.length,
    0
  );
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
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Remaining Issues
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Remaining Summary
          </h2>
        </div>
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          {issues.length} issues
        </span>
      </div>

      {issues.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          현재 남아있는 Remaining Issue가 없습니다.
        </p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-5 gap-1.5">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2"
              >
                <dt className="truncate text-[11px] font-medium text-slate-500">
                  {item.label}
                </dt>
                <dd className="mt-1 text-lg font-bold text-slate-950">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-950">
              High Priority Remaining · {highIssues.length} issues
            </h3>
            <RepresentativeIssueRows issues={representativeHighIssues} />
            {hiddenHighIssueCount > 0 && (
              <p className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
                추가 High Priority 이슈 {hiddenHighIssueCount}개와 Medium / Low
                상세 목록은 Detailed QA Data에서 확인할 수 있습니다.
              </p>
            )}
            {highIssues.length === 0 &&
              (mediumIssues.length > 0 || lowIssues.length > 0) && (
                <p className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  Medium / Low Remaining 상세는 Detailed QA Data에서 확인할 수
                  있습니다.
                </p>
              )}
          </div>
        </>
      )}
    </section>
  );
}
