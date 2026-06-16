import type {
  AnalysisSummaryState,
  VersionIssueSummaryItem,
} from "@/types/report";

const TOTAL_ISSUE_COLOR = "#6d5ef6";
const HIGH_ISSUE_COLOR = "#e11d48";
const CHART_WIDTH = 720;
const CHART_HEIGHT = 320;
const CHART_PADDING = {
  top: 54,
  right: 62,
  bottom: 54,
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
  currentVersion,
}: {
  items: VersionIssueSummaryItem[];
  currentVersion: string;
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
      <div className="relative mt-3 h-56 w-full overflow-hidden rounded-3xl bg-white/65">
        <div className="absolute inset-0 bg-[url('/assets/report/pattern-chart-bg-v2.svg')] bg-cover bg-center bg-no-repeat" />
        <div className="relative z-10 grid h-full place-items-center px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              버전별 이슈 추세 데이터가 부족합니다.
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
          <span>전체 이슈</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: HIGH_ISSUE_COLOR }}
          />
          <span>High / Highest 이슈</span>
        </span>
      </div>

      <div className="relative mt-2 h-64 w-full overflow-hidden rounded-2xl bg-white/55">
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
                  className={
                    item.version === currentVersion
                      ? "fill-indigo-700 text-[11px] font-black"
                      : "fill-slate-500 text-[10px] font-bold"
                  }
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
                    {point.version === currentVersion && (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="10"
                        fill={TOTAL_ISSUE_COLOR}
                        opacity="0.14"
                      />
                    )}
                    <text
                      x={point.x}
                      y={clampChartLabelY(point.y - 12)}
                      textAnchor="middle"
                      className={
                        point.version === currentVersion
                          ? "fill-indigo-800 text-[11px] font-black"
                          : "fill-indigo-700 text-[10px] font-black"
                      }
                    >
                      {point.total.toLocaleString()}
                    </text>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={point.version === currentVersion ? "5" : "4"}
                      fill="white"
                      stroke={TOTAL_ISSUE_COLOR}
                      strokeWidth={point.version === currentVersion ? "2.6" : "2"}
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
    <div className="grid grid-cols-2 items-stretch gap-5">
      <section className="flex h-full min-h-[420px] min-w-0 flex-col rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="flex min-h-[82px] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              이슈 패턴 분석
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              반복적으로 확인된 이슈 유형을 기준으로 주요 리스크 패턴을 확인합니다.
            </p>
          </div>
          <span className="h-7 w-fit shrink-0 whitespace-nowrap rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold leading-5 text-indigo-700">
            총 {totalPatterns.toLocaleString()}건
          </span>
        </div>

        <div className="mt-2 flex flex-1 flex-col rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
          <p className="text-sm font-semibold text-slate-950">
            주요 이슈 패턴 TOP 5
          </p>
          {patterns.length > 0 ? (
            <div className="mt-4 flex-1 divide-y divide-slate-200/80">
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
                    <span className="flex translate-y-2 items-baseline justify-end gap-1.5 text-right text-xs font-semibold text-slate-500">
                      <span className="text-sm font-bold text-slate-900">
                        {pattern.count.toLocaleString()}
                      </span>
                      <span>{percent.toFixed(1)}%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              반복 이슈 패턴 데이터가 없습니다.
            </p>
          )}
        </div>
      </section>

      <section className="flex h-full min-h-[420px] min-w-0 flex-col rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="flex min-h-[82px] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              버전별 이슈 추세
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              릴리즈 버전별 Jira 이슈 규모와 High / Highest 이슈 추이를 확인합니다.
            </p>
          </div>
          {currentBaseVersion && (
            <span className="h-7 w-fit shrink-0 whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-bold leading-5 text-indigo-800 shadow-sm shadow-indigo-100">
              현재 버전 {currentBaseVersion}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-1 flex-col rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 px-4 py-3 shadow-sm shadow-indigo-50">
          <VersionIssueTrendChart
            items={versionTrendItems}
            currentVersion={currentBaseVersion}
          />
        </div>
      </section>
    </div>
  );
}
