import type { RcProgressSummary } from "@/types/report";

export function RcProgressCard({
  rcProgress,
}: {
  rcProgress: RcProgressSummary;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            RC Progress
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            RC Progress
          </h2>
        </div>
        <p className="text-sm font-medium text-slate-500">
          Current RC: {rcProgress.rcLabel || "-"}
        </p>
      </div>

      {rcProgress.items.length > 0 ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {rcProgress.items.map((item) => (
            <article
              key={item.rc}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-950">
                  {item.rc}
                </h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                  Remaining {item.remainingIssues}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-4 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">New</dt>
                  <dd className="mt-1 font-semibold text-slate-950">
                    {item.newIssues}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Resolved</dt>
                  <dd className="mt-1 font-semibold text-emerald-700">
                    {item.resolvedIssues}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Remaining</dt>
                  <dd className="mt-1 font-semibold text-amber-700">
                    {item.remainingIssues}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Reopened</dt>
                  <dd className="mt-1 font-semibold text-red-700">
                    {item.reopenedIssues}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          표시할 RC Progress 데이터가 없습니다.
        </p>
      )}

      <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        RC별 Remaining은 해당 RC 흐름 기준이며, 전체 Remaining 상태는 Release
        Risk Summary 기준으로 확인합니다.
      </p>
    </section>
  );
}
