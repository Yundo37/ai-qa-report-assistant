import type { AiExecutiveSummaryResult } from "@/types/report";

const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/RC별\s*Issue\s*흐름/g, "RC별 이슈 흐름"],
  [/Issue\s*흐름/g, "이슈 흐름"],
  [/Version\s*차원/g, "버전 관점"],
  [/Version\s*기준/g, "버전 기준"],
  [/Care가\s*요구됩니다/g, "주의 깊은 관리가 필요합니다"],
  [/Care\s*필요/g, "주의 깊은 관리 필요"],
  [/Blocked\s*Impact/g, "Blocked 영향"],
  [/Remaining\s*Issue/g, "잔여 이슈"],
  [/Remaining\s*이슈/g, "잔여 이슈"],
  [/\bRemaining\b/g, "잔여 이슈"],
  [/QA\s*Comment/g, "QA 코멘트"],
  [/High\+\s*이슈/g, "High / Highest 이슈"],
  [/High\+\s*신호/g, "High / Highest 신호"],
  [/RC-local/g, "RC 단위"],
  [/local\s*결과/g, "RC 단위 결과"],
  [/Version\s*Trend/g, "버전 이슈 추세"],
  [/Issue\s*Pattern/g, "이슈 패턴"],
  [/차기\s*이벤트\s*흐름/g, "상태 전환 → CTA → 결과 상태 → 알림 처리 흐름"],
];

function sanitizeNextEventSentence(text: string) {
  return text
    .replace(/Next\s*Event는/g, "후속 일정은")
    .replace(/Next\s*Event를/g, "후속 일정을")
    .replace(/Next\s*Event가/g, "후속 일정이")
    .replace(/Next\s*Event\s*항목/g, "차기 확인 항목");
}

export function sanitizeReportTone(text: string) {
  return TEXT_REPLACEMENTS.reduce(
    (nextText, [pattern, replacement]) => nextText.replace(pattern, replacement),
    sanitizeNextEventSentence(text)
  );
}

function sanitizeSignal(
  signal: AiExecutiveSummaryResult["riskSignals"][number]
) {
  return {
    ...signal,
    label: sanitizeReportTone(signal.label),
    description: sanitizeReportTone(signal.description),
  };
}

export function sanitizeExecutiveSummaryTone(
  executiveSummary: AiExecutiveSummaryResult
): AiExecutiveSummaryResult {
  return {
    releaseJudgment: {
      title: sanitizeReportTone(executiveSummary.releaseJudgment.title),
      description: sanitizeReportTone(
        executiveSummary.releaseJudgment.description
      ),
    },
    riskSignals: executiveSummary.riskSignals.map(sanitizeSignal),
    patternInsight: {
      title: sanitizeReportTone(executiveSummary.patternInsight.title),
      description: sanitizeReportTone(
        executiveSummary.patternInsight.description
      ),
      items: executiveSummary.patternInsight.items?.map((item) => ({
        ...item,
        label: sanitizeReportTone(item.label),
      })),
    },
    qaCheckpoints: executiveSummary.qaCheckpoints.map(sanitizeReportTone),
  };
}
