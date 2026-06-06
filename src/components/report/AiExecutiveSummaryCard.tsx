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
  const hasAnalysis = paragraphs.length > 0;

  return (
    <section
      className={`rounded-3xl border shadow-sm ${
        hasAnalysis
          ? "border-indigo-200 bg-gradient-to-br from-white to-indigo-50/70 p-6 sm:p-8"
          : "border-slate-200 bg-white p-5 sm:p-6"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            AI 기반 QA 요약
          </p>
          <h2
            className={`mt-2 font-bold tracking-tight text-slate-950 ${
              hasAnalysis ? "text-2xl" : "text-xl"
            }`}
          >
            AI Executive Summary
          </h2>
          {!hasAnalysis && !isLoading && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              AI Analysis를 생성하면 QA 데이터 기반 요약을 확인할 수 있습니다.
            </p>
          )}
          {isLoading && (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              AI Analysis 생성 중...
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className={`min-w-40 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 md:shrink-0 ${
            hasAnalysis
              ? "border border-indigo-200 bg-white text-indigo-700 hover:border-indigo-300"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isLoading
            ? "Analyzing..."
            : hasAnalysis
              ? "AI Analysis 다시 생성"
              : "AI Analysis 생성"}
        </button>
      </div>

      {hasAnalysis && (
        <div className="mt-7 space-y-5 text-[15px] leading-8 text-slate-700">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="border-l-4 border-indigo-200 pl-4 text-slate-700"
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
