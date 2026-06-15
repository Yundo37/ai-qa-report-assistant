import type { RcProgressItem, RcProgressSummary } from "@/types/report";

function calculateProcessedIssues(item: RcProgressItem) {
  return Math.max(item.newIssues - item.remainingIssues, 0);
}

function calculateCumulativeProgress(
  cumulativeNewIssues: number,
  cumulativeProcessedIssues: number
) {
  if (cumulativeNewIssues <= 0) {
    return null;
  }

  return Math.round((cumulativeProcessedIssues / cumulativeNewIssues) * 100);
}

function formatProgress(progress: number | null) {
  return progress === null ? "-" : `${progress}%`;
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

function createCumulativeRows(items: RcProgressItem[]) {
  let cumulativeNewIssues = 0;
  let cumulativeProcessedIssues = 0;
  let cumulativeRemainingIssues = 0;

  return items.map((item) => {
    const processedIssues = calculateProcessedIssues(item);

    cumulativeNewIssues += item.newIssues;
    cumulativeProcessedIssues += processedIssues;
    cumulativeRemainingIssues += item.remainingIssues;

    return {
      item,
      processedIssues,
      cumulativeRemainingIssues,
      progress: calculateCumulativeProgress(
        cumulativeNewIssues,
        cumulativeProcessedIssues
      ),
    };
  });
}

export function RcProgressCard({
  rcProgress,
}: {
  rcProgress: RcProgressSummary;
}) {
  const cumulativeRows = createCumulativeRows(rcProgress.items);
  const rcProgressNote =
    "RC별 신규 이슈와 누적 잔여 흐름을 기준으로 릴리즈 진행 상태를 확인합니다.";
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

      {cumulativeRows.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[42px_44px_64px_76px_minmax(92px,0.9fr)] bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold text-slate-500">
            <span>RC</span>
            <span>신규</span>
            <span>처리</span>
            <span>누적 잔여</span>
            <span>진행률</span>
          </div>
          {cumulativeRows.map(
            ({
              item,
              processedIssues,
              cumulativeRemainingIssues,
              progress,
            }) => (
              <div
                key={item.rc}
                className="grid grid-cols-[42px_44px_64px_76px_minmax(92px,0.9fr)] items-center border-t border-slate-100 px-2 py-2.5 text-center text-xs"
              >
                <span className="font-bold text-slate-950">{item.rc}</span>
                <span className="font-semibold text-slate-700">
                  {item.newIssues}
                </span>
                <span className="font-semibold text-emerald-700">
                  {processedIssues}
                </span>
                <span className="font-semibold text-amber-700">
                  {cumulativeRemainingIssues}
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="block h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-indigo-500"
                      style={{ width: `${progress ?? 0}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-[10px] font-semibold text-slate-400">
                    {formatProgress(progress)}
                  </span>
                </span>
              </div>
            )
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          표시할 RC Progress 데이터가 없습니다.
        </p>
      )}

      <p className="pt-3 text-xs leading-5 text-slate-400">
        {rcProgressNote}
      </p>
    </section>
  );
}
