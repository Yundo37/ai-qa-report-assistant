type AiExecutiveSummaryCardProps = {
  analysisText: string;
  isLoading: boolean;
  onAnalyze: () => void;
};

export function AiExecutiveSummaryCard({
  analysisText,
  isLoading,
  onAnalyze,
}: AiExecutiveSummaryCardProps) {
  const paragraphs = analysisText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            AI 기반 QA 요약
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            AI Executive Summary
          </h2>
          {!analysisText && !isLoading && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              QA Summary와 Jira Issue 데이터를 기반으로 AI 분석을 생성할 수
              있습니다.
            </p>
          )}
          {isLoading && (
            <p className="mt-3 text-sm leading-6 text-slate-500">
              AI Analysis 생성 중...
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="min-w-40 whitespace-nowrap rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 md:shrink-0"
        >
          {isLoading ? "Analyzing..." : "AI Analysis 생성"}
        </button>
      </div>

      {paragraphs.length > 0 && (
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
    </section>
  );
}
