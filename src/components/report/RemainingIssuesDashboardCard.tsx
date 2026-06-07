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
  return "bg-emerald-50 text-emerald-700";
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
  const representativeIssues = [
    ...highIssues,
    ...mediumIssues,
    ...lowIssues,
  ].slice(0, 5);
  const hiddenIssueCount = Math.max(issues.length - representativeIssues.length, 0);

  return (
    <section className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Remaining Issues
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Top Remaining Issues
          </h2>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
          Total {issues.length}
        </span>
      </div>

      {issues.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          No Remaining Issue is currently open.
        </p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-5 gap-1.5">
            <div className="rounded-xl bg-slate-50 px-2 py-2">
              <dt className="truncate text-[11px] font-medium text-slate-500">
                Total
              </dt>
              <dd className="mt-1 text-lg font-bold text-slate-950">
                {issues.length}
              </dd>
            </div>
            <div className="rounded-xl bg-red-50 px-2 py-2 text-red-700">
              <dt className="truncate text-[11px] font-medium">Highest</dt>
              <dd className="mt-1 text-lg font-bold">
                {issues.filter((issue) => issue.priority === "Highest").length}
              </dd>
            </div>
            <div className="rounded-xl bg-red-50 px-2 py-2 text-red-700">
              <dt className="truncate text-[11px] font-medium">High</dt>
              <dd className="mt-1 text-lg font-bold">
                {issues.filter((issue) => issue.priority === "High").length}
              </dd>
            </div>
            <div className="rounded-xl bg-amber-50 px-2 py-2 text-amber-700">
              <dt className="truncate text-[11px] font-medium">Medium</dt>
              <dd className="mt-1 text-lg font-bold">{mediumIssues.length}</dd>
            </div>
            <div className="rounded-xl bg-emerald-50 px-2 py-2 text-emerald-700">
              <dt className="truncate text-[11px] font-medium">Low</dt>
              <dd className="mt-1 text-lg font-bold">{lowIssues.length}</dd>
            </div>
          </dl>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[90px_minmax(0,1fr)_74px_70px_70px] bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
              <span>Key</span>
              <span>Summary</span>
              <span>Priority</span>
              <span>Status</span>
              <span>RC / Ver</span>
            </div>
            {representativeIssues.map((issue, index) => (
              <div
                key={`${issue.key}-${index}`}
                className="grid grid-cols-[90px_minmax(0,1fr)_74px_70px_70px] items-center gap-2 border-t border-slate-100 px-3 py-2 text-xs"
              >
                <span className="truncate font-semibold text-indigo-700">
                  {issue.key}
                </span>
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
                <span className="truncate rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {issue.status}
                </span>
                <span className="truncate text-[11px] font-medium text-slate-500">
                  {issue.version || "-"}
                </span>
              </div>
            ))}
          </div>

          {hiddenIssueCount > 0 && (
            <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
              + {hiddenIssueCount} more Remaining Issue(s) in Detailed QA Data.
            </p>
          )}
        </>
      )}
    </section>
  );
}
