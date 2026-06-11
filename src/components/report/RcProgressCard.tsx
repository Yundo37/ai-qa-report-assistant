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
  const totalNewIssues = rcProgress.items.reduce(
    (sum, item) => sum + item.newIssues,
    0
  );
  const totalResolvedIssues = rcProgress.items.reduce(
    (sum, item) => sum + item.resolvedIssues,
    0
  );
  const totalRemainingIssues = rcProgress.items.reduce(
    (sum, item) => sum + item.remainingIssues,
    0
  );
  const totalProgress = calculateProgress(
    totalResolvedIssues,
    totalRemainingIssues
  );
  const rcProgressNote =
    "RC\uBCC4 Remaining\uC740 \uAC01 RC \uD750\uB984 \uAE30\uC900\uC774\uBA70, \uC804\uCCB4 Remaining \uC0C1\uD0DC\uB294 Release Risk Summary\uC5D0\uC11C \uD655\uC778\uD569\uB2C8\uB2E4.";

  return (
    <section className="flex h-full min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold leading-5 tracking-tight text-slate-950">
          RC Progress
        </h2>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold leading-5 text-indigo-700">
          {rcProgress.rcLabel || "-"}
        </span>
      </div>

      {rcProgress.items.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[42px_44px_64px_76px_minmax(92px,0.9fr)] bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold text-slate-500">
            <span>RC</span>
            <span>New</span>
            <span>Resolved</span>
            <span>Remaining</span>
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
                className="grid grid-cols-[42px_44px_64px_76px_minmax(92px,0.9fr)] items-center border-t border-slate-100 px-2 py-2.5 text-center text-xs"
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
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="block h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-indigo-500"
                      style={{ width: `${progress}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-[10px] font-semibold text-slate-400">
                    {progress}%
                  </span>
                </span>
              </div>
            );
          })}
          <div className="grid grid-cols-[42px_44px_64px_76px_minmax(92px,0.9fr)] items-center border-t border-slate-200 bg-white px-2 py-2.5 text-center text-xs">
            <span className="font-bold text-slate-950">Total</span>
            <span className="font-semibold text-slate-700">
              {totalNewIssues}
            </span>
            <span className="font-semibold text-emerald-700">
              {totalResolvedIssues}
            </span>
            <span className="font-semibold text-amber-700">
              {totalRemainingIssues}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="block h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full bg-indigo-500"
                  style={{ width: `${totalProgress}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right text-[10px] font-semibold text-slate-400">
                {totalProgress}%
              </span>
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No RC Progress data to display.
        </p>
      )}

      <p className="pt-3 text-xs leading-5 text-slate-400">
        {rcProgressNote}
      </p>
    </section>
  );
}
