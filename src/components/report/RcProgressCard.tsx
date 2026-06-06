import type { RcProgressSummary } from "@/types/report";

export function RcProgressCard({
  rcProgress,
}: {
  rcProgress: RcProgressSummary;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        RC Progress
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
        RC Progress
      </h2>

      {rcProgress.items.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-500">
              <tr>
                <th className="pb-3 pr-4 font-medium">RC</th>
                <th className="pb-3 pr-4 font-medium">New</th>
                <th className="pb-3 pr-4 font-medium">Resolved</th>
                <th className="pb-3 pr-4 font-medium">Remaining</th>
                <th className="pb-3 font-medium">Reopened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rcProgress.items.map((item) => (
                <tr key={item.rc}>
                  <td className="py-3 pr-4 font-semibold text-slate-950">
                    {item.rc}
                  </td>
                  <td className="py-3 pr-4">{item.newIssues}</td>
                  <td className="py-3 pr-4 text-emerald-700">
                    {item.resolvedIssues}
                  </td>
                  <td className="py-3 pr-4 text-amber-700">
                    {item.remainingIssues}
                  </td>
                  <td className="py-3 text-red-700">{item.reopenedIssues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          표시할 RC Progress 데이터가 없습니다.
        </p>
      )}

      <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        RC별 Remaining은 해당 RC 흐름 기준이며, 전체 Remaining Issue 상태는
        Release Risk Summary 기준으로 확인합니다.
      </p>
    </section>
  );
}
