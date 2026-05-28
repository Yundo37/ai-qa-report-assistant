import type { RemainingIssue } from "@/types/report";

export function RemainingIssueList({ issues }: { issues: RemainingIssue[] }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-6">
      <h2 className="text-base font-semibold text-zinc-100">
        잔여 이슈 목록 (Remaining Issue List)
      </h2>

      {issues.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-28" />
              <col className="w-28" />
              <col />
              <col className="w-[140px]" />
              <col className="w-[160px]" />
            </colgroup>
            <thead className="border-b border-zinc-800 text-xs text-zinc-500">
              <tr>
                <th className="w-28 pb-3 pr-4 font-medium">Priority</th>
                <th className="w-28 pb-3 pr-4 font-medium">Key</th>
                <th className="pb-3 pr-6 font-medium">Summary</th>
                <th className="min-w-[140px] pb-3 pl-6 pr-4 font-medium">
                  Status
                </th>
                <th className="min-w-[160px] pb-3 font-medium">Version</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {issues.map((issue, index) => (
                <tr key={`${issue.key}-${index}`}>
                  <td className="w-28 py-3 pr-4 text-zinc-100">
                    {issue.priority}
                  </td>
                  <td className="w-28 py-3 pr-4 text-blue-300">{issue.key}</td>
                  <td className="py-3 pr-6">
                    <div
                      className="line-clamp-2 max-w-[30rem] break-words text-left leading-6"
                      title={issue.summary}
                    >
                      {issue.summary}
                    </div>
                  </td>
                  <td className="min-w-[140px] whitespace-nowrap py-3 pl-6 pr-4">
                    {issue.status}
                  </td>
                  <td className="min-w-[160px] whitespace-nowrap py-3">
                    {issue.version}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">잔여 이슈가 없습니다.</p>
      )}
    </section>
  );
}
