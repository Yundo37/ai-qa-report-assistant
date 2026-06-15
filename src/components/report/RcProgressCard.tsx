import type { RcProgressSummary } from "@/types/report";

function calculateProgress(resolved: number, remaining: number) {
  const denominator = resolved + remaining;
  return denominator > 0 ? Math.round((resolved / denominator) * 100) : 0;
}

function createRcFlowLabel(rcProgress: RcProgressSummary) {
  const rcLabels = rcProgress.items
    .map((item) => item.rc)
    .filter((rc): rc is string => Boolean(rc && rc.trim()))
    .filter((rc) => rc !== "-");

  if (rcLabels.length >= 2) {
    return `Jira RC Flow: ${rcLabels[0]}~${rcLabels[rcLabels.length - 1]}`;
  }

  if (rcLabels.length === 1) {
    return `분석 ${rcLabels[0]}까지`;
  }

  return rcProgress.rcLabel ? `분석 ${rcProgress.rcLabel}까지` : "분석 RC";
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
    "New는 해당 RC에 생성된 Jira 이슈 수이며, 잔여는 현재 잔여 이슈 기준입니다. 전체 잔여 이슈는 Release Risk Summary에서 확인합니다.";
  const rcFlowLabel = createRcFlowLabel(rcProgress);

  return (
    <section className="flex h-full min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold leading-5 tracking-tight text-slate-950">
          RC Progress
        </h2>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold leading-5 text-indigo-700">
          {rcFlowLabel}
        </span>
      </div>

      {rcProgress.items.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[42px_44px_64px_76px_minmax(92px,0.9fr)] bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold text-slate-500">
            <span>RC</span>
            <span>신규</span>
            <span>해결</span>
            <span>잔여</span>
            <span>진행률</span>
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
