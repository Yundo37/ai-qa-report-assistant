import { getQaReleaseStatusTone } from "@/lib/report/qaReleaseStatus";
import type {
  AiExecutiveSummaryResult,
  AnalysisSummaryState,
  RcPrioritySummary,
  RemainingIssue,
} from "@/types/report";

type SanitizerParams = {
  executiveSummary: AiExecutiveSummaryResult;
  analysisSummary: NonNullable<AnalysisSummaryState>;
};

type StatusTone = "stable" | "caution" | "risk";
type RiskSignal = AiExecutiveSummaryResult["riskSignals"][number];

const STABLE_FORBIDDEN_PATTERNS = [
  /위험/,
  /차단/,
  /배포 전 우선 확인/,
  /추가 검증 필요/,
  /심각한 리스크/,
  /중대 리스크/,
];

const ATTENTION_FORBIDDEN_PATTERNS = [
  /위험 징후/,
  /중대 리스크/,
  /배포 전 차단/,
  /심각한 위험/,
];

const MEDIUM_CONTRADICTION_PATTERNS = [
  /High\s*\/\s*Medium\s*잔여 이슈\s*없음/,
  /High\s*또는\s*Medium\s*잔여 이슈\s*없음/,
  /Medium\s*잔여 이슈\s*없음/,
];

const HIGH_CONTRADICTION_PATTERNS = [
  /High\s*\/\s*Highest\s*잔여 이슈\s*없음/,
  /High\s*잔여 이슈\s*없음/,
  /Highest\s*잔여 이슈\s*없음/,
];

function getCount(value: number | undefined) {
  return typeof value === "number" ? value : 0;
}

function createEmptyPrioritySummary(): RcPrioritySummary {
  return {
    Highest: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Lowest: 0,
  };
}

function countRemainingPriority(issues: RemainingIssue[]) {
  return issues.reduce((summary, issue) => {
    if (issue.priority === "Highest") summary.Highest += 1;
    if (issue.priority === "High") summary.High += 1;
    if (issue.priority === "Medium") summary.Medium += 1;
    if (issue.priority === "Low") summary.Low += 1;
    if (issue.priority === "Lowest") summary.Lowest += 1;
    return summary;
  }, createEmptyPrioritySummary());
}

function getRemainingPrioritySummary(
  analysisSummary: NonNullable<AnalysisSummaryState>
) {
  return (
    analysisSummary.qaIssueOverview?.remaining.prioritySummary ??
    countRemainingPriority(analysisSummary.remainingIssues)
  );
}

function getActualMetrics(analysisSummary: NonNullable<AnalysisSummaryState>) {
  const remainingPriority = getRemainingPrioritySummary(analysisSummary);
  const highHighest =
    getCount(remainingPriority.Highest) + getCount(remainingPriority.High);
  const medium = getCount(remainingPriority.Medium);
  const lowLowest =
    getCount(remainingPriority.Low) + getCount(remainingPriority.Lowest);
  const blockedCount =
    analysisSummary.overallQaSummary?.Blocked ??
    getCount(analysisSummary.qaTotal.Blocked);
  const nextEventCount =
    analysisSummary.overallQaSummary?.NextEvent ??
    getCount(analysisSummary.qaTotal.NextEvent);
  const totalTc =
    analysisSummary.overallQaSummary?.Total ??
    getCount(analysisSummary.qaTotal.Total);
  const statusTone = getQaReleaseStatusTone({
    totalTc,
    blockedCount,
    remainingPriority,
  });
  const primaryBlockedLabel =
    analysisSummary.blockedImpact?.topBlockedIssues[0]?.displayLabel;

  return {
    statusTone,
    highHighest,
    medium,
    lowLowest,
    blockedCount,
    nextEventCount,
    primaryBlockedLabel,
  };
}

function collectSummaryText(summary: AiExecutiveSummaryResult) {
  return [
    summary.releaseJudgment.title,
    summary.releaseJudgment.description,
    ...summary.riskSignals.flatMap((signal) => [
      signal.label,
      signal.description,
    ]),
    summary.patternInsight.title,
    summary.patternInsight.description,
    ...(summary.patternInsight.items ?? []).map((item) => item.label),
    ...summary.qaCheckpoints,
  ].join("\n");
}

function countPatternMatches(text: string, patterns: RegExp[]) {
  return patterns.reduce((count, pattern) => {
    const matches = text.match(new RegExp(pattern.source, "g"));
    return count + (matches?.length ?? 0);
  }, 0);
}

function hasSevereMismatch({
  originalText,
  statusTone,
  highHighest,
  medium,
}: {
  originalText: string;
  statusTone: StatusTone;
  highHighest: number;
  medium: number;
}) {
  const mediumContradictions =
    medium > 0
      ? countPatternMatches(originalText, MEDIUM_CONTRADICTION_PATTERNS)
      : 0;
  const highContradictions =
    highHighest > 0
      ? countPatternMatches(originalText, HIGH_CONTRADICTION_PATTERNS)
      : 0;

  if (mediumContradictions >= 2 || highContradictions > 0) return true;

  if (
    statusTone === "stable" &&
    countPatternMatches(originalText, STABLE_FORBIDDEN_PATTERNS) >= 3
  ) {
    return true;
  }

  if (
    statusTone === "caution" &&
    countPatternMatches(originalText, ATTENTION_FORBIDDEN_PATTERNS) >= 3
  ) {
    return true;
  }

  return false;
}

function createRiskSignals({
  statusTone,
  highHighest,
  medium,
  lowLowest,
  blockedCount,
  nextEventCount,
}: {
  statusTone: StatusTone;
  highHighest: number;
  medium: number;
  lowLowest: number;
  blockedCount: number;
  nextEventCount: number;
}): RiskSignal[] {
  if (statusTone === "stable") {
    return [
      {
        label: "High / Medium 잔여 이슈 없음",
        value: highHighest + medium,
        description: "릴리즈 판단에 영향을 줄 주요 잔여 이슈는 없습니다.",
        tone: "stable",
      },
      {
        label: "Low / Lowest 잔여 이슈",
        value: lowLowest,
        description: "운영 모니터링 중심의 후속 관리 항목입니다.",
        tone: "stable",
      },
      {
        label: "Blocked 영향 낮음",
        value: blockedCount,
        description: "제한된 조건의 확인 항목으로 관리합니다.",
        tone: "stable",
      },
      {
        label: "Next Event 확인 항목",
        value: nextEventCount,
        description: "현재 릴리즈 판단과 분리해 후속 일정으로 관리합니다.",
        tone: "stable",
      },
    ];
  }

  if (statusTone === "caution") {
    return [
      {
        label: "High / Highest 잔여 이슈 없음",
        value: highHighest,
        description: "배포 전 우선 차단 신호는 낮은 상태입니다.",
        tone: "stable",
      },
      {
        label: "Medium 잔여 이슈",
        value: medium,
        description: "수정 반영 후 재검증과 정책 조건 확인이 필요합니다.",
        tone: "attention",
      },
      {
        label: "Blocked Impact",
        value: blockedCount,
        description: "원인 이슈 해소 후 조건부 재확인이 필요합니다.",
        tone: blockedCount > 0 ? "attention" : "stable",
      },
      {
        label: "Next Event",
        value: nextEventCount,
        description: "현재 릴리즈와 분리해 후속 일정으로 관리합니다.",
        tone: "attention",
      },
    ];
  }

  return [
    {
      label: "High / Highest 잔여 이슈",
      value: highHighest,
      description: "배포 전 우선 확인 대상으로 분리해야 합니다.",
      tone: "risk",
    },
    {
      label: "Blocked Impact",
      value: blockedCount,
      description: "원인 이슈 해소 후 흐름 단위 회귀 검증이 필요합니다.",
      tone: "risk",
    },
    {
      label: "Medium 잔여 이슈",
      value: medium,
      description: "High 이슈 확인 후 후속 재검증 대상으로 관리합니다.",
      tone: "attention",
    },
    {
      label: "Low / Lowest 잔여 이슈",
      value: lowLowest,
      description: "우선 확인 이후 후속 관리 항목으로 분리합니다.",
      tone: "neutral",
    },
  ];
}

function createReleaseJudgment({
  statusTone,
}: {
  statusTone: StatusTone;
}): AiExecutiveSummaryResult["releaseJudgment"] {
  if (statusTone === "stable") {
    return {
      title: "운영 모니터링 중심",
      description:
        "High / Medium 잔여 이슈 없이 Low Known Issue 중심으로 남아 있어 운영 모니터링 범위입니다.",
    };
  }

  if (statusTone === "caution") {
    return {
      title: "추가 확인 필요",
      description:
        "High / Highest 잔여 이슈는 없지만 Medium 잔여 이슈가 남아 있어 재검증과 정책 조건 확인이 필요합니다.",
    };
  }

  return {
    title: "추가 검증 필요",
    description:
      "High / Highest 잔여 이슈와 Blocked Impact가 함께 남아 있어 배포 전 우선 확인 범위를 분리해야 합니다.",
  };
}

function createPatternInsight({
  executiveSummary,
  statusTone,
}: {
  executiveSummary: AiExecutiveSummaryResult;
  statusTone: StatusTone;
}): AiExecutiveSummaryResult["patternInsight"] {
  const items = (executiveSummary.patternInsight.items ?? []).slice(0, 3);

  if (statusTone === "stable") {
    return {
      title: "운영 모니터링 신호",
      description:
        "반복 패턴은 일부 관찰되지만 운영 모니터링과 차기 확인 범위로 관리합니다.",
      items,
    };
  }

  if (statusTone === "caution") {
    return {
      title: "재검증과 정책 확인 신호",
      description:
        "반복 패턴은 Medium 재검증과 정책 조건 확인 범위로 관리합니다.",
      items,
    };
  }

  return {
    title: "흐름 단위 회귀 검증 신호",
    description:
      "반복 패턴은 개별 TC보다 상태 변경과 알림 흐름 단위로 확인해야 합니다.",
    items,
  };
}

function createQaCheckpoints({
  statusTone,
  primaryBlockedLabel,
}: {
  statusTone: StatusTone;
  primaryBlockedLabel?: string;
}) {
  if (statusTone === "stable") {
    return [
      "Low Known Issue는 운영 모니터링 항목으로 관리합니다.",
      "Next Event는 후속 일정으로 분리합니다.",
      primaryBlockedLabel
        ? `${primaryBlockedLabel} 관련 조건부 재확인 범위만 추적합니다.`
        : "제한적 Blocked 항목만 조건부 재확인합니다.",
    ];
  }

  if (statusTone === "caution") {
    return [
      "Medium 잔여 이슈는 수정 반영 후 재검증합니다.",
      "Blocked 항목은 원인 이슈 해소 후 조건부 재확인합니다.",
      "Next Event는 후속 일정으로 분리합니다.",
      "운영 정책 조건은 QA 코멘트 기준으로 추적합니다.",
    ];
  }

  return [
    "High / Highest 잔여 이슈를 우선 확인합니다.",
    "Blocked 원인 이슈 해소 후 회귀 검증합니다.",
    "상태 변경 → CTA 노출 → 결과 상태 반영 → 알림 수신 흐름을 확인합니다.",
    "Medium 잔여 이슈는 High 이슈 확인 후 후속 재검증합니다.",
  ];
}

export function sanitizeAiExecutiveSummary({
  executiveSummary,
  analysisSummary,
}: SanitizerParams): AiExecutiveSummaryResult | null {
  const metrics = getActualMetrics(analysisSummary);
  const originalText = collectSummaryText(executiveSummary);

  if (hasSevereMismatch({ originalText, ...metrics })) {
    return null;
  }

  return {
    releaseJudgment: createReleaseJudgment({
      statusTone: metrics.statusTone,
    }),
    riskSignals: createRiskSignals(metrics),
    patternInsight: createPatternInsight({
      executiveSummary,
      statusTone: metrics.statusTone,
    }),
    qaCheckpoints: createQaCheckpoints({
      statusTone: metrics.statusTone,
      primaryBlockedLabel: metrics.primaryBlockedLabel,
    }),
  };
}
