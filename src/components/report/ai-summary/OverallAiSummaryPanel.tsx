import { SummaryMetricStrip } from "@/components/report/ai-summary/SummaryMetricStrip";
import type {
  InsightTone,
  PassRateDonutStyle,
  SummaryInsightCard,
  SummaryMetricStripItem,
  SummaryPatternItem,
  SummaryRiskSignal,
} from "@/components/report/ai-summary/types";

type OverallAiSummaryPanelProps = {
  compactRiskSignals: SummaryRiskSignal[];
  displayPatternItems: SummaryPatternItem[];
  formatSummaryValue: (value: string | number | undefined) => string | number;
  hasStructuredInsightCards: boolean;
  insightToneBadgeClass: (tone: InsightTone | undefined) => string;
  insightToneLabel: (tone: InsightTone | undefined) => string;
  mainInsightCard?: SummaryInsightCard;
  metricStripItems: SummaryMetricStripItem[];
  passRateDonutStyle: PassRateDonutStyle;
  passRatePercent: number;
  patternInsightDescription: string;
  patternInsightTitle: string;
  releaseJudgmentDescription: string;
  releaseJudgmentLabel: string;
  releaseJudgmentTitle: string;
  riskInsightCard?: SummaryInsightCard;
  signalBadgeClass: (tone: SummaryRiskSignal["tone"]) => string;
  softenBlockingTerms: (text: string | undefined) => string;
  topQaDirectionItems: string[];
};

export function OverallAiSummaryPanel({
  compactRiskSignals,
  displayPatternItems,
  formatSummaryValue,
  hasStructuredInsightCards,
  insightToneBadgeClass,
  insightToneLabel,
  mainInsightCard,
  metricStripItems,
  passRateDonutStyle,
  passRatePercent,
  patternInsightDescription,
  patternInsightTitle,
  releaseJudgmentDescription,
  releaseJudgmentLabel,
  releaseJudgmentTitle,
  riskInsightCard,
  signalBadgeClass,
  softenBlockingTerms,
  topQaDirectionItems,
}: OverallAiSummaryPanelProps) {
  return (
    <div className="mt-5 overflow-hidden rounded-[28px] border border-indigo-100 bg-white/90 shadow-sm">
      <div className="grid grid-cols-[0.31fr_0.69fr]">
        <div className="flex min-h-[270px] flex-col border-r border-indigo-100/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              {releaseJudgmentLabel}
            </p>
            {hasStructuredInsightCards && mainInsightCard && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${insightToneBadgeClass(
                  mainInsightCard.tone
                )}`}
              >
                {insightToneLabel(mainInsightCard.tone)}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-3.5 pt-2">
            <p className="max-w-[11rem] break-keep text-center text-xl font-black leading-7 tracking-tight text-indigo-700">
              {releaseJudgmentTitle}
            </p>
            <div className="flex justify-center">
              <div
                className="grid size-28 place-items-center rounded-full shadow-inner shadow-indigo-100"
                style={passRateDonutStyle}
                aria-label={`통과율 ${passRatePercent}%`}
              >
                <div className="flex size-20 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                  <span className="block text-2xl font-black leading-none text-indigo-700">
                    {passRatePercent}%
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold leading-none text-slate-500">
                    통과율
                  </span>
                </div>
              </div>
            </div>
            <p className="max-w-[13.5rem] break-keep text-center text-sm font-semibold leading-6 text-slate-700">
              {releaseJudgmentDescription}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                주요 리스크 신호
              </p>
              {riskInsightCard?.description && (
                <p className="mt-2 break-keep text-xs leading-5 text-slate-500">
                  {softenBlockingTerms(riskInsightCard.description)}
                </p>
              )}
            </div>
          </div>
          <ul className="grid grid-cols-4 gap-2.5">
            {compactRiskSignals.map((item) => (
              <li
                key={item.title}
                className="min-h-[82px] rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 text-xs font-semibold leading-4 text-slate-800">
                    {item.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${signalBadgeClass(
                      item.tone
                    )}`}
                  >
                    {formatSummaryValue(item.value)}
                  </span>
                </div>
                <p className="mt-1.5 break-keep text-xs leading-4 text-slate-500">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>

          <div className="grid items-stretch grid-cols-2 gap-3">
            <div className="flex h-full flex-col rounded-3xl border border-violet-100 bg-violet-50/30 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                반복 패턴 해석
              </p>
              <p className="mt-2 line-clamp-2 break-keep text-sm font-semibold leading-5 text-slate-800">
                {patternInsightTitle}
              </p>
              {displayPatternItems.length > 0 ? (
                <ul className="mt-3 flex-1 space-y-2">
                  {displayPatternItems.map((item) => (
                    <li key={item.label} className="text-sm">
                      <div className="flex min-h-[38px] items-start justify-between gap-3 rounded-2xl border border-violet-100 bg-white/80 px-3 py-2">
                        <span className="flex min-w-0 items-start gap-2 leading-5 text-slate-700">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-500" />
                          <span className="min-w-0">
                            {softenBlockingTerms(item.label)}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100">
                          {formatSummaryValue(item.value)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-2xl border border-slate-100 bg-white/80 px-3 py-3 text-sm leading-6 text-slate-500">
                  {patternInsightDescription}
                </p>
              )}
            </div>

            <div className="flex h-full flex-col rounded-3xl border border-indigo-100 bg-indigo-50/30 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                {hasStructuredInsightCards ? "AI 확인 방향" : "QA 확인 방향"}
              </p>
              <ol className="mt-3 space-y-2">
                {topQaDirectionItems.map((item, index) => (
                  <li
                    key={item}
                    className="flex min-h-[38px] items-start gap-3 rounded-2xl border border-indigo-100 bg-white/80 px-3 py-2 text-sm leading-5"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
                      {index + 1}
                    </span>
                    <span className="min-w-0 font-semibold text-slate-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      <SummaryMetricStrip items={metricStripItems} variant="compact" />
    </div>
  );
}
