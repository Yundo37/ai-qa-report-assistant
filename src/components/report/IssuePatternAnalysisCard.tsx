import type { AnalysisSummaryState, IssuePatternAnalysisItem } from "@/types/report";

const TREND_COLORS = ["#6d5ef6", "#f97316", "#06b6d4", "#ec4899", "#64748b"];
const CHART_WIDTH = 720;
const CHART_HEIGHT = 360;
const CHART_PADDING = {
  top: 62,
  right: 62,
  bottom: 58,
  left: 66,
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  jiraSummary: "Jira Summary",
  remainingIssue: "Remaining",
  qaComment: "QA Comment",
};

function truncatePatternName(name: string, maxLength = 24) {
  return name.length > maxLength ? `${name.slice(0, maxLength - 1)}...` : name;
}

function createTrendPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function PatternTrendChart({
  patterns,
}: {
  patterns: IssuePatternAnalysisItem[];
}) {
  const trendBuckets =
    patterns.find((pattern) => (pattern.trend ?? []).length > 0)?.trend ?? [];
  const trendBasis =
    patterns.find((pattern) => pattern.trend?.length > 0)?.trendBasis ??
    "period";
  const plotWidth =
    CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight =
    CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const trendSeries = patterns.map((pattern, patternIndex) => ({
    pattern,
    color: TREND_COLORS[patternIndex % TREND_COLORS.length],
    points: trendBuckets.map((bucket, bucketIndex) => ({
      label: bucket.label,
      title: bucket.title,
      count: pattern.trend?.[bucketIndex]?.count ?? 0,
    })),
  }));
  const maxTrendCount = Math.max(
    ...trendSeries.flatMap((series) =>
      series.points.map((point) => point.count)
    ),
    0
  );
  const hasTrendData =
    trendBuckets.length >= 1 &&
    trendSeries.some((series) =>
      series.points.some((point) => point.count > 0)
    );
  const yAxisTicks = Array.from(
    new Set(
      [1, 0.66, 0.33, 0].map((ratio) =>
        Math.round(Math.max(maxTrendCount, 1) * ratio)
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
              Trend data is limited for the selected period.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Pattern counts are summarized from Jira and QA evidence.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-3xl bg-white/10">
      <div className="grid gap-x-3 gap-y-1 px-2 py-1 sm:grid-cols-2">
        {trendSeries.map((series) => (
          <div
            key={series.pattern.name}
            className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-slate-500"
            title={series.pattern.name}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            <span className="truncate">
              {truncatePatternName(series.pattern.name)}
            </span>
          </div>
        ))}
      </div>

      <div className="relative mt-2 aspect-[2/1] w-full overflow-hidden rounded-2xl bg-white/55">
        <div className="absolute inset-0 bg-[url('/assets/report/pattern-chart-bg-v2.svg')] bg-cover bg-center bg-no-repeat" />
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 z-10 h-full w-full"
          role="img"
          aria-label={`Pattern trend chart by ${trendBasis}`}
        >
          {yAxisTicks.map((tick) => {
            const y =
              CHART_PADDING.top +
              plotHeight -
              (tick / Math.max(maxTrendCount, 1)) * plotHeight;

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

          {trendBuckets.map((bucket, index) => {
            const x =
              trendBuckets.length > 1
                ? CHART_PADDING.left +
                  (plotWidth / (trendBuckets.length - 1)) * index
                : CHART_PADDING.left + plotWidth / 2;

            return (
              <g key={`${bucket.label}-${bucket.title}`}>
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
                  <title>{bucket.title}</title>
                  {bucket.label}
                </text>
              </g>
            );
          })}

          {trendSeries.map((series) => {
            const points = series.points.map((point, index) => {
              const x =
                series.points.length > 1
                  ? CHART_PADDING.left +
                    (plotWidth / (series.points.length - 1)) * index
                  : CHART_PADDING.left + plotWidth / 2;
              const y =
                CHART_PADDING.top +
                plotHeight -
                (point.count / Math.max(maxTrendCount, 1)) * plotHeight;

              return { ...point, x, y };
            });

            return (
              <g key={series.pattern.name}>
                <path
                  d={createTrendPath(points)}
                  fill="none"
                  stroke={series.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  opacity="0.84"
                />
                {points.map((point) => (
                  <circle
                    key={`${series.pattern.name}-${point.label}`}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="white"
                    stroke={series.color}
                    strokeWidth="1.6"
                  >
                    <title>
                      {series.pattern.name} / {point.title}: {point.count}
                    </title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function getPatternTrendSubtitle(
  trendBasis: IssuePatternAnalysisItem["trendBasis"]
) {
  if (trendBasis === "rc") return "Repeated pattern signals by RC flow.";
  if (trendBasis === "version") {
    return "Repeated pattern signals by version flow.";
  }

  return "Repeated pattern signals by selected period.";
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
    .slice(0, 3);
  const versionRows = Object.entries(versionCounts)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 3);
  const trendBasis =
    patterns.find((pattern) => pattern.trend?.length > 0)?.trendBasis ??
    "period";
  const sourceSummary = sourceRows
    .map(
      ([label, count]) =>
        `${SOURCE_TYPE_LABELS[label] ?? label} ${count.toLocaleString()}`
    )
    .join(" / ");
  const versionSummary = versionRows.map(([label]) => label).join(", ");

  return (
    <section className="rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Issue Pattern
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Issue Pattern Analysis
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Repeated issue patterns detected from Jira and QA evidence.
          </p>
        </div>
        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Total {totalPatterns.toLocaleString()} Patterns
        </span>
      </div>

      {patterns.length > 0 ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
          <div className="h-fit rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
            <p className="text-sm font-semibold text-slate-950">
              Top 5 Pattern Signals
            </p>
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
          </div>

          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 p-5 shadow-sm shadow-indigo-50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">
                  Pattern Trend
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {getPatternTrendSubtitle(trendBasis)}
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-indigo-700">
                Evidence based
              </span>
            </div>

            <PatternTrendChart patterns={patterns} />

            <div className="mt-2 px-1 text-[11px] leading-5 text-slate-400">
              {(sourceSummary || versionSummary) && (
                <p className="truncate">
                  Evidence: {sourceSummary || "Source unavailable"}
                  {versionSummary ? ` / Version ${versionSummary}` : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No repeated issue pattern data to display.
        </p>
      )}
    </section>
  );
}
