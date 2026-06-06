import type { VersionIssueSummaryItem } from "@/types/report";

export function VersionIssueSummaryCard({
  items,
  title = "Version / RC Issue Summary",
  description = "Jira Analysis Period 내 이슈를 Version / RC 기준으로 묶어 우선순위 분포를 표시합니다.",
}: {
  items: VersionIssueSummaryItem[];
  title?: string;
  description?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

      {items.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-left text-sm">
            <thead className="border-b border-slate-200 text-xs text-slate-500">
              <tr>
                <th className="w-64 pb-3 pr-4 font-medium">Version / RC</th>
                <th className="w-32 pb-3 pr-4 font-medium">High/Highest</th>
                <th className="w-28 pb-3 pr-4 font-medium">Medium</th>
                <th className="w-28 pb-3 pr-4 font-medium">Low</th>
                <th className="w-24 pb-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item) => (
                <tr key={item.version}>
                  <td className="py-3 pr-4 font-medium text-slate-950">
                    {item.version}
                  </td>
                  <td className="py-3 pr-4 text-red-700">
                    {item.highHighest}
                  </td>
                  <td className="py-3 pr-4 text-amber-700">{item.medium}</td>
                  <td className="py-3 pr-4 text-slate-600">{item.low}</td>
                  <td className="py-3 font-semibold text-slate-950">
                    {item.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          기간 내 집계할 Jira 이슈가 없습니다.
        </p>
      )}
    </section>
  );
}
