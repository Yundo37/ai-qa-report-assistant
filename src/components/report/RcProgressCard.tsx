import type { RcProgressSummary } from "@/types/report";

export function RcProgressCard({
  rcProgress,
}: {
  rcProgress: RcProgressSummary;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            RC Progress
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            RC Progress
          </h2>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {rcProgress.rcLabel || "-"}
        </span>
      </div>

      {rcProgress.items.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[0.8fr_0.7fr_0.9fr_0.9fr_0.9fr] bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
            <span>RC</span>
            <span>New</span>
            <span>Resolved</span>
            <span>Remaining</span>
            <span>Reopened</span>
          </div>
          {rcProgress.items.map((item) => (
            <div
              key={item.rc}
              className="grid grid-cols-[0.8fr_0.7fr_0.9fr_0.9fr_0.9fr] items-center border-t border-slate-100 px-3 py-2 text-xs"
            >
              <span className="font-bold text-slate-950">{item.rc}</span>
              <span className="font-semibold text-slate-700">
                {item.newIssues}
              </span>
              <span className="font-semibold text-emerald-700">
                {item.resolvedIssues}
              </span>
              <span className="font-semibold text-amber-700">
                {item.remainingIssues}
              </span>
              <span className="font-semibold text-red-700">
                {item.reopenedIssues}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          표시할 RC Progress 데이터가 없습니다.
        </p>
      )}

      <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
        RC별 Remaining은 해당 RC 흐름 기준이며, 전체 Remaining 상태는 Release
        Risk Summary 기준으로 확인합니다.
      </p>
    </section>
  );
}
