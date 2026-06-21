export function AiExecutiveSummaryLoading() {
  return (
    <div className="mt-5 rounded-2xl border border-indigo-100 bg-white/85 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-indigo-700">
            AI 분석 결과를 준비 중입니다...
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            전체 QA 결과와 Jira 잔여 이슈를 기반으로 릴리즈 리스크 구조를
            분석하고 있습니다.
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2" aria-hidden="true">
        <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-indigo-100" />
        <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-indigo-100" />
        <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-indigo-100" />
      </div>
    </div>
  );
}
