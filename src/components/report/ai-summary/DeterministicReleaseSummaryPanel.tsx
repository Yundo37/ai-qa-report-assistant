import { SummaryMetricStrip } from "@/components/report/ai-summary/SummaryMetricStrip";
import type {
  PassRateDonutStyle,
  SummaryMetricStripItem,
  SummaryViewModel,
} from "@/components/report/ai-summary/types";

type DeterministicReleaseSummaryPanelProps = {
  fallbackQaDirectionItems: string[];
  formatSummaryValue: (value: string | number | undefined) => string | number;
  metricStripItems: SummaryMetricStripItem[];
  passRateDonutStyle: PassRateDonutStyle;
  passRatePercent: number;
  ruleBasedExecutiveSummaryViewModel: SummaryViewModel;
  signalBadgeClass: (tone: SummaryViewModel["riskSignals"][number]["tone"]) => string;
  softenBlockingTerms: (text: string | undefined) => string;
};

export function DeterministicReleaseSummaryPanel({
  fallbackQaDirectionItems,
  formatSummaryValue,
  metricStripItems,
  passRateDonutStyle,
  passRatePercent,
  ruleBasedExecutiveSummaryViewModel,
  signalBadgeClass,
  softenBlockingTerms,
}: DeterministicReleaseSummaryPanelProps) {
  return (
    <>
      <div className="mt-5 grid grid-cols-[1.15fr_1fr_1fr_0.9fr] overflow-hidden rounded-t-3xl border-x border-t border-indigo-100 bg-white/95 shadow-sm">
        <div className="border-r border-indigo-100/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            릴리즈 판단
          </p>
          <p className="mt-4 text-center text-xl font-black tracking-tight text-indigo-700">
            {softenBlockingTerms(
              ruleBasedExecutiveSummaryViewModel.releaseJudgment.title
            )}
          </p>
          <p className="mt-3 text-center text-sm font-semibold leading-6 text-slate-800">
            {softenBlockingTerms(
              ruleBasedExecutiveSummaryViewModel.releaseJudgment.description
            )}
          </p>
          <div className="mt-5 flex justify-center">
            <div
              className="grid size-36 place-items-center rounded-full shadow-inner shadow-indigo-100"
              style={passRateDonutStyle}
              aria-label={`통과율 ${passRatePercent}%`}
            >
              <div className="flex size-28 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                <span className="block text-3xl font-black leading-none text-indigo-700">
                  {passRatePercent}%
                </span>
                <span className="mt-1 block text-[11px] font-semibold leading-none text-slate-500">
                  통과율
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-r border-indigo-100/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            주요 리스크 신호
          </p>
          <ul className="mt-4 space-y-3">
            {ruleBasedExecutiveSummaryViewModel.riskSignals.map((item) => (
              <li key={item.title} className="text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-semibold leading-5 text-slate-800">
                      {softenBlockingTerms(item.title)}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {softenBlockingTerms(item.description)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${signalBadgeClass(
                      item.tone
                    )}`}
                  >
                    {formatSummaryValue(item.value)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-r border-indigo-100/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            반복 패턴 해석
          </p>
          {ruleBasedExecutiveSummaryViewModel.patternInsight.patterns.length >
          0 ? (
            <>
              <p className="mt-3 text-sm font-semibold leading-5 text-slate-800">
                {softenBlockingTerms(
                  ruleBasedExecutiveSummaryViewModel.patternInsight.title
                )}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {softenBlockingTerms(
                  ruleBasedExecutiveSummaryViewModel.patternInsight.description
                )}
              </p>
              <ul className="mt-4 space-y-3">
                {ruleBasedExecutiveSummaryViewModel.patternInsight.patterns.map(
                  (item) => (
                    <li key={item.label} className="text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex min-w-0 items-start gap-2 leading-5 text-slate-700">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-500" />
                          <span className="min-w-0">
                            {softenBlockingTerms(item.label)}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                          {formatSummaryValue(item.value)}
                        </span>
                      </div>
                    </li>
                  )
                )}
              </ul>
            </>
          ) : (
            <p className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-500">
              {softenBlockingTerms(
                ruleBasedExecutiveSummaryViewModel.patternInsight.description
              )}
            </p>
          )}
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            QA 확인 방향
          </p>
          <ul className="mt-4 space-y-3">
            {fallbackQaDirectionItems.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                <span className="text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <SummaryMetricStrip items={metricStripItems} variant="deterministic" />
    </>
  );
}
