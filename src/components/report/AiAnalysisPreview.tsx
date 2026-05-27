export function AiAnalysisPreview({
  analysisText,
  isLoading,
  onAnalyze,
}: {
  analysisText: string;
  isLoading: boolean;
  onAnalyze: () => void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-zinc-100">
          AI Analysis Preview
        </h2>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Analyzing..." : "AI Analysis Test"}
        </button>
      </div>

      {analysisText ? (
        <div className="mt-5 whitespace-pre-line text-sm leading-7 text-zinc-300">
          {analysisText}
        </div>
      ) : (
        <p className="mt-5 text-sm text-zinc-500">
          Summary 결과를 기반으로 짧은 QA 분석 문장을 테스트합니다.
        </p>
      )}
    </section>
  );
}
