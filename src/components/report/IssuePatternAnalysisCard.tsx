import type {
  AnalysisSummaryState,
  VersionIssueSummaryItem,
} from "@/types/report";

const TOTAL_ISSUE_COLOR = "#6d5ef6";
const HIGH_ISSUE_COLOR = "#e11d48";
const CHART_WIDTH = 720;
const CHART_HEIGHT = 360;
const CHART_PADDING = {
  top: 62,
  right: 62,
  bottom: 58,
  left: 66,
};

function createTrendPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function clampChartLabelY(value: number) {
  return Math.max(CHART_PADDING.top - 22, Math.min(CHART_HEIGHT - 34, value));
}

function getVersionSortScore(version: string) {
  return (
    version
      .match(/\d+(?:\.\d+)*/)?.[0]
      ?.split(".")
      .map(Number)
      .reduce((score, number) => score * 100 + number, 0) ?? 0
  );
}

function extractBaseVersion(value: string) {
  return value.match(/\d+(?:\.\d+)+/)?.[0] ?? "";
}

function createVersionTrendItems({
  versionSummary,
  currentVersion,
}: {
  versionSummary: VersionIssueSummaryItem[];
  currentVersion: string;
}) {
  const grouped = new Map<string, VersionIssueSummaryItem>();

  versionSummary.forEach((item) => {
    const baseVersion = extractBaseVersion(item.version);

    if (!baseVersion) return;

    const current =
      grouped.get(baseVersion) ??
      ({
        version: baseVersion,
        highHighest: 0,
        medium: 0,
        low: 0,
        total: 0,
      } satisfies VersionIssueSummaryItem);

    current.highHighest += item.highHighest;
    current.medium += item.medium;
    current.low += item.low;
    current.total += item.total;
    grouped.set(baseVersion, current);
  });

  const sortedItems = Array.from(grouped.values()).sort(
    (first, second) =>
      getVersionSortScore(first.version) - getVersionSortScore(second.version) ||
      first.version.localeCompare(second.version)
  );
  const currentVersionIndex = sortedItems.findIndex(
    (item) => item.version === currentVersion
  );

  if (currentVersionIndex >= 0) {
    return sortedItems.slice(
      Math.max(0, currentVersionIndex - 4),
      currentVersionIndex + 1
    );
  }

  return sortedItems.slice(-5);
}

function VersionIssueTrendChart({
  items,
}: {
  items: VersionIssueSummaryItem[];
}) {
  const plotWidth =
    CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight =
    CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const maxIssueCount = Math.max(
    ...items.flatMap((item) => [item.total, item.highHighest]),
    0
  );
  const hasTrendData = items.length >= 2 && items.some((item) => item.total > 0);
  const yAxisTicks = Array.from(
    new Set(
      [1, 0.66, 0.33, 0].map((ratio) =>
        Math.round(Math.max(maxIssueCount, 1) * ratio)
      )
    )
  ).sort((first, second) => second - first);

  if (!hasTrendData) {
    return (
      <div className="relative mt-3 aspect-[2/1] w-full overflow-hidden rounded-3xl bg-white/65">
        <div className="absolute inset-0 bg-[url('/assets/report/pattern-chart-bg-v2.svg')] bg-cover bg-center bg-no-repeat" />
        <div className="relative z-10 grid h-full place-items-center px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Version Trend 데이터가 부족합니다.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              버전별 이슈 추이를 표시할 데이터가 충분하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-3xl bg-white/10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-1 text-[10px] font-medium text-slate-500">
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: TOTAL_ISSUE_COLOR }}
          />
          <span>Total Issues</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: HIGH_ISSUE_COLOR }}
          />
          <span>High+ Issues</span>
        </span>
      </div>

      <div className="relative mt-2 aspect-[2/1] w-full overflow-hidden rounded-2xl bg-white/55">
        <div className="absolute inset-0 bg-[url('/assets/report/pattern-chart-bg-v2.svg')] bg-cover bg-center bg-no-repeat" />
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 z-10 h-full w-full"
          role="img"
          aria-label="Version issue trend chart"
        >
          {yAxisTicks.map((tick) => {
            const y =
              CHART_PADDING.top +
              plotHeight -
              (tick / Math.max(maxIssueCount, 1)) * plotHeight;

            return (
              <g key={tick}>
                <line
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y2={y}
                  stroke="#c7d2fe"
                  opacity="0.22"
                  strokeWidth="1"
                />
                <text
                  x={CHART_PADDING.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-semibold opacity-55"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {items.map((item, index) => {
            const x =
              items.length > 1
                ? CHART_PADDING.left +
                  (plotWidth / (items.length - 1)) * index
                : CHART_PADDING.left + plotWidth / 2;

            return (
              <g key={item.version}>
                <line
                  x1={x}
                  y1={CHART_PADDING.top}
                  x2={x}
                  y2={CHART_PADDING.top + plotHeight}
                  stroke="#e0e7ff"
                  opacity="0.2"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={CHART_HEIGHT - 18}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-bold"
                >
                  {item.version}
                </text>
              </g>
            );
          })}

          {(() => {
            const totalPoints = items.map((item, index) => {
              const x =
                items.length > 1
                  ? CHART_PADDING.left +
                    (plotWidth / (items.length - 1)) * index
                  : CHART_PADDING.left + plotWidth / 2;
              const y =
                CHART_PADDING.top +
                plotHeight -
                (item.total / Math.max(maxIssueCount, 1)) * plotHeight;

              return { ...item, x, y };
            });
            const highPoints = items.map((item, index) => {
              const x =
                items.length > 1
                  ? CHART_PADDING.left +
                    (plotWidth / (items.length - 1)) * index
                  : CHART_PADDING.left + plotWidth / 2;
              const y =
                CHART_PADDING.top +
                plotHeight -
                (item.highHighest / Math.max(maxIssueCount, 1)) * plotHeight;

              return { ...item, x, y };
            });

            return (
              <g>
                <path
                  d={createTrendPath(totalPoints)}
                  fill="none"
                  stroke={TOTAL_ISSUE_COLOR}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  opacity="0.84"
                />
                <path
                  d={createTrendPath(highPoints)}
                  fill="none"
                  stroke={HIGH_ISSUE_COLOR}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  opacity="0.78"
                />
                {totalPoints.map((point) => (
                  <g key={`total-${point.version}`}>
                    <text
                      x={point.x}
                      y={clampChartLabelY(point.y - 12)}
                      textAnchor="middle"
                      className="fill-indigo-700 text-[10px] font-black"
                    >
                      {point.total.toLocaleString()}
                    </text>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="white"
                      stroke={TOTAL_ISSUE_COLOR}
                      strokeWidth="2"
                    >
                      <title>
                        {point.version}: {point.total.toLocaleString()} total issues
                      </title>
                    </circle>
                  </g>
                ))}
                {highPoints.map((point) => (
                  <g key={`high-${point.version}`}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="3.5"
                      fill="white"
                      stroke={HIGH_ISSUE_COLOR}
                      strokeWidth="1.8"
                    >
                      <title>
                        {point.version}: {point.highHighest.toLocaleString()} High+ issues
                      </title>
                    </circle>
                    <text
                      x={point.x}
                      y={clampChartLabelY(point.y + 20)}
                      textAnchor="middle"
                      className="fill-rose-600 text-[10px] font-black"
                    >
                      {point.highHighest.toLocaleString()}
                    </text>
                  </g>
                ))}
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

export function IssuePatternAnalysisCard({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const patterns = (analysisSummary.issuePatternAnalysis ?? []).slice(0, 5);
  const totalPatterns = patterns.reduce(
    (total, pattern) => total + pattern.count,
    0
  );
  const maxCount = Math.max(...patterns.map((pattern) => pattern.count), 0);
  const currentBaseVersion =
    extractBaseVersion(analysisSummary.inferredTargetVersion) ||
    extractBaseVersion(analysisSummary.versionSummary?.at(-1)?.version ?? "");
  const versionTrendItems = createVersionTrendItems({
    versionSummary: analysisSummary.versionSummary ?? [],
    currentVersion: currentBaseVersion,
  });

  return (
    <section className="rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Issue Pattern
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Issue Pattern & Version Risk
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            반복 이슈 패턴과 릴리즈 버전별 이슈 규모를 함께 확인합니다.
          </p>
        </div>
        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Total {totalPatterns.toLocaleString()} Patterns
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
        <div className="h-fit rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
          <p className="text-sm font-semibold text-slate-950">
            Top 5 Pattern Signals
          </p>
          {patterns.length > 0 ? (
            <div className="mt-4 divide-y divide-slate-200/80">
              {patterns.map((pattern, index) => {
                const ratio = maxCount > 0 ? (pattern.count / maxCount) * 100 : 0;
                const percent =
                  totalPatterns > 0 ? (pattern.count / totalPatterns) * 100 : 0;

                return (
                  <div
                    key={pattern.name}
                    className="grid grid-cols-[24px_minmax(0,1fr)_86px] items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="grid size-6 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm shadow-indigo-200">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {pattern.name}
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/80">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-right text-xs font-semibold text-slate-500">
                      <span className="block text-sm font-bold text-slate-900">
                        {pattern.count.toLocaleString()}
                      </span>
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              No repeated issue pattern data to display.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 p-5 shadow-sm shadow-indigo-50">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">
              Version Issue Trend
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              이전 릴리즈와 현재 버전의 전체 Jira 이슈 수 추이를 비교합니다.
            </p>
          </div>

          <VersionIssueTrendChart items={versionTrendItems} />

          <div className="mt-3 rounded-2xl border border-indigo-100 bg-white/70 px-3 py-2 text-[11px] leading-5 text-slate-500">
            Version Trend는 업데이트 버전 비교이며, RC Progress는 현재{" "}
            {currentBaseVersion || "릴리즈"} RC 흐름 기준입니다.
          </div>
        </div>
      </div>
    </section>
  );
}
