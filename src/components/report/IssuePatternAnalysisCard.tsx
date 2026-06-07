import type { AnalysisSummaryState } from "@/types/report";

function createDistributionRows(
  entries: [string, number][],
  maxCount: number,
  colorClass: string
) {
  return entries.map(([label, count]) => {
    const ratio = maxCount > 0 ? (count / maxCount) * 100 : 0;

    return (
      <div key={label}>
        <div className="flex justify-between gap-3 text-xs">
          <span className="truncate font-medium text-slate-600">{label}</span>
          <span className="font-bold text-slate-900">{count}</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${ratio}%` }} />
        </div>
      </div>
    );
  });
}

export function IssuePatternAnalysisCard({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const patterns = (analysisSummary.issuePatternAnalysis ?? []).slice(0, 5);
  const totalPatterns = patterns.reduce((total, pattern) => total + pattern.count, 0);
  const maxCount = Math.max(...patterns.map((pattern) => pattern.count), 0);
  const sourceTypeCounts = patterns.reduce<Record<string, number>>(
    (summary, pattern) => {
      pattern.sourceTypes.forEach((sourceType) => {
        summary[sourceType] = (summary[sourceType] ?? 0) + pattern.count;
      });
      return summary;
    },
    {}
  );
  const versionCounts = patterns.reduce<Record<string, number>>(
    (summary, pattern) => {
      pattern.versions.forEach((version) => {
        summary[version] = (summary[version] ?? 0) + pattern.count;
      });
      return summary;
    },
    {}
  );
  const sourceRows = Object.entries(sourceTypeCounts)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 4);
  const versionRows = Object.entries(versionCounts)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 4);
  const maxSourceCount = Math.max(...sourceRows.map(([, count]) => count), 0);
  const maxVersionCount = Math.max(...versionRows.map(([, count]) => count), 0);

  return (
    <section className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Issue Pattern
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Issue Pattern Analysis
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Jira 이슈에서 반복적으로 관찰된 패턴과 데이터 출처 분포를
            요약합니다.
          </p>
        </div>
        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Total {totalPatterns.toLocaleString()} Patterns
        </span>
      </div>

      {patterns.length > 0 ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">
              주요 반복 패턴 TOP 5
            </p>
            <div className="mt-4 space-y-3">
              {patterns.map((pattern, index) => {
                const ratio = maxCount > 0 ? (pattern.count / maxCount) * 100 : 0;
                const keywordText =
                  pattern.keywords.slice(0, 2).join(", ") || "keyword 없음";
                const sourceText =
                  pattern.sourceTypes.slice(0, 2).join(", ") || "source 없음";

                return (
                  <article
                    key={pattern.name}
                    className="grid grid-cols-[24px_minmax(0,1fr)_64px] items-center gap-3 rounded-2xl bg-white px-3 py-3"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {pattern.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {keywordText} · {sourceText}
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-right text-sm font-bold text-slate-700">
                      {pattern.count}
                    </span>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Pattern Evidence View
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  실제 sourceTypes / versions 데이터를 기준으로 한 분포입니다.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                No fake trend
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Source Type
                </p>
                <div className="mt-3 space-y-3">
                  {sourceRows.length > 0 ? (
                    createDistributionRows(sourceRows, maxSourceCount, "bg-indigo-500")
                  ) : (
                    <p className="text-xs leading-5 text-slate-500">
                      Source Type 데이터가 없습니다.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Version Coverage
                </p>
                <div className="mt-3 space-y-3">
                  {versionRows.length > 0 ? (
                    createDistributionRows(versionRows, maxVersionCount, "bg-violet-500")
                  ) : (
                    <p className="text-xs leading-5 text-slate-500">
                      Version 데이터가 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          표시할 반복 이슈 패턴 데이터가 없습니다.
        </p>
      )}
    </section>
  );
}
