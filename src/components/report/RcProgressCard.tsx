import type { RcProgressSummary } from "@/types/report";

function calculateProgress(resolved: number, remaining: number) {
  const denominator = resolved + remaining;
  return denominator > 0 ? Math.round((resolved / denominator) * 100) : 0;
}

export function RcProgressCard({
  rcProgress,
}: {
  rcProgress: RcProgressSummary;
}) {
  return (
    <section className="flex h-full min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
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
          <div className="grid grid-cols-[0.7fr_0.7fr_0.9fr_0.9fr_1fr] bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
            <span>RC</span>
            <span>New</span>
            <span>Resolved</span>
            <span>Remain</span>
            <span>Progress</span>
          </div>
          {rcProgress.items.map((item) => {
            const progress = calculateProgress(
              item.resolvedIssues,
              item.remainingIssues
            );

            return (
              <div
                key={item.rc}
                className="grid grid-cols-[0.7fr_0.7fr_0.9fr_0.9fr_1fr] items-center border-t border-slate-100 px-3 py-2 text-xs"
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
                <span className="min-w-0">
                  <span className="block h-2 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-indigo-500"
                      style={{ width: `${progress}%` }}
                    />
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                    {progress}%
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No RC Progress data to display.
        </p>
      )}

      <p className="mt-auto pt-4 text-xs leading-5 text-slate-400">
        RC-level Remaining follows each RC flow. Overall Remaining status is
        checked in Release Risk Summary.
      </p>
    </section>
  );
}
