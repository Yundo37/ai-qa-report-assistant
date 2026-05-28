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
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-100">
            AI Analysis
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            AI Analysis를 실행하면 현재 QA Summary와 Jira 결과를 기반으로
            추가 분석 문장을 생성합니다. 실행하지 않아도 기본 QA Summary
            기반 리포트는 생성할 수 있습니다.
          </p>
          {!analysisText && (
            <p className="mt-3 text-sm text-zinc-500">
              아직 AI 분석 결과가 없습니다.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading}
          className="min-w-36 whitespace-nowrap rounded-xl border border-fuchsia-400/60 bg-gradient-to-r from-purple-500/15 via-fuchsia-500/15 to-pink-500/15 px-5 py-2.5 text-sm font-semibold text-fuchsia-100 shadow-[0_0_24px_rgba(217,70,239,0.12)] transition hover:border-pink-300 hover:text-white hover:shadow-[0_0_28px_rgba(236,72,153,0.2)] disabled:cursor-not-allowed disabled:opacity-60 md:shrink-0"
        >
          {isLoading ? "Analyzing..." : "AI Analysis"}
        </button>
      </div>

      {analysisText && (
        <div className="mt-5 whitespace-pre-line text-sm leading-7 text-zinc-300">
          {analysisText}
        </div>
      )}
    </section>
  );
}
