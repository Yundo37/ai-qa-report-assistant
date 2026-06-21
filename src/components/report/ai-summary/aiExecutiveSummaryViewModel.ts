import { formatRate } from "@/components/report/ai-summary/aiExecutiveSummaryDisplayUtils";
import type { AiExecutiveSummaryViewModel } from "@/components/report/ai-summary/types";
import type {
  AiExecutiveSummaryResult,
  AnalysisSummaryState,
} from "@/types/report";

export function createAiExecutiveSummaryViewModelFromAiResult(
  aiExecutiveSummary: AiExecutiveSummaryResult
): AiExecutiveSummaryViewModel {
  return {
    releaseJudgment: aiExecutiveSummary.releaseJudgment,
    riskSignals: aiExecutiveSummary.riskSignals.slice(0, 4).map((item) => ({
      title: item.label,
      value: item.value,
      description: item.description,
      tone: item.tone,
    })),
    patternInsight: {
      title: aiExecutiveSummary.patternInsight.title,
      description: aiExecutiveSummary.patternInsight.description,
      patterns: (aiExecutiveSummary.patternInsight.items ?? [])
        .slice(0, 3)
        .map((item) => ({
          label: item.label,
          value: item.value,
        })),
    },
    qaCheckpoints: aiExecutiveSummary.qaCheckpoints.slice(0, 4),
  };
}

function createReleaseJudgment({
  tone,
  highRisk,
  mediumRisk,
  blockedCount,
  blockedRate,
}: {
  tone: "stable" | "caution" | "risk";
  highRisk: number;
  mediumRisk: number;
  blockedCount: number;
  blockedRate: number;
}) {
  if (tone === "risk") {
    const reason =
      highRisk > 0 && blockedCount > 0
        ? "High / Highest 잔여 이슈와 Blocked 영향 항목이 함께 남아 있어"
        : highRisk > 0
          ? "High / Highest 잔여 이슈가 남아 있어"
          : `Blocked 비율이 ${formatRate(blockedRate)}로 높아`;

    return {
      title: "추가 검증 필요",
      description: `${reason}, 배포 전 우선 확인 범위를 분리해야 합니다.`,
    };
  }

  if (tone === "caution") {
    const reason =
      mediumRisk > 0
        ? "High / Highest 잔여 이슈는 없지만 Medium 잔여 이슈가 남아 있어"
        : `Blocked 비율이 ${formatRate(blockedRate)} 수준이라`;

    return {
      title: "추가 확인 필요",
      description: `${reason}, 운영 정책 확인과 재검증 항목을 분리해 관리해야 합니다.`,
    };
  }

  return {
    title: "운영 모니터링 중심",
    description:
      highRisk === 0 && mediumRisk === 0
        ? "High / Medium 잔여 이슈는 없고, Low Known Issue와 Next Event는 운영 모니터링 항목으로 분리 관리하면 됩니다."
        : "주요 우선순위 잔여 이슈 신호가 낮아 운영 모니터링 중심으로 관리할 수 있습니다.",
  };
}

function createRiskSignals({
  tone,
  highRisk,
  mediumRisk,
  lowRisk,
  blockedCount,
  blockedRate,
  nextEventCount,
  rcRemaining,
}: {
  tone: "stable" | "caution" | "risk";
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  blockedCount: number;
  blockedRate: number;
  nextEventCount: number;
  rcRemaining: number;
}): AiExecutiveSummaryViewModel["riskSignals"] {
  if (tone === "risk") {
    return [
      {
        title: "High / Highest 잔여 이슈",
        value: highRisk,
        description: "배포 전 우선 확인 대상으로 분리해야 합니다.",
        tone: "risk",
      },
      {
        title: "Blocked 영향",
        value: blockedCount,
        description: `Blocked 비율 ${formatRate(blockedRate)} 기준으로 원인 해소 후 회귀 검증이 필요합니다.`,
        tone: blockedRate >= 0.2 ? "risk" : "attention",
      },
      {
        title: "Medium 잔여 이슈",
        value: mediumRisk,
        description: "High 이슈 확인 이후 후속 재검증 대상으로 관리합니다.",
        tone: mediumRisk > 0 ? "attention" : "stable",
      },
      {
        title: "RC 잔여 이슈",
        value: rcRemaining,
        description: "RC별 잔여 흐름은 전체 잔여 이슈와 분리해 해석합니다.",
        tone: rcRemaining > 0 ? "attention" : "stable",
      },
    ];
  }

  if (tone === "caution") {
    return [
      {
        title: "High / Highest 잔여 이슈 없음",
        value: highRisk,
        description: "배포 전 우선 검증 제한 신호는 낮은 상태입니다.",
        tone: "stable",
      },
      {
        title: "Medium 잔여 이슈",
        value: mediumRisk,
        description: "운영 정책 확인 또는 수정 반영 후 재검증이 필요합니다.",
        tone: mediumRisk > 0 ? "attention" : "stable",
      },
      {
        title: "Next Event",
        value: nextEventCount,
        description: "현재 릴리즈 위험과 분리해 후속 일정으로 관리합니다.",
        tone: "attention",
      },
      {
        title: "Blocked 영향",
        value: blockedCount,
        description: `Blocked 비율은 ${formatRate(blockedRate)}이며 상태 판정과 함께 보조 확인합니다.`,
        tone: blockedRate >= 0.1 ? "attention" : "stable",
      },
    ];
  }

  return [
    {
      title: "High / Medium 잔여 이슈 없음",
      value: highRisk + mediumRisk,
      description: "주요 릴리즈 검증 제한 신호는 없습니다.",
      tone: "stable",
    },
    {
      title: "Low Known Issue",
      value: lowRisk,
      description: "운영 영향이 낮은 후속 관리 항목입니다.",
      tone: "stable",
    },
    {
      title: "Next Event",
      value: nextEventCount,
      description: "현재 릴리즈 위험이 아니라 차기 확인 항목입니다.",
      tone: "stable",
    },
    {
      title: "검증 제한 영향",
      value: blockedCount,
      description: `검증 보류 비율 ${formatRate(blockedRate)} 기준으로 안정 범위에서 모니터링합니다.`,
      tone: "stable",
    },
  ];
}

function createPatternInsight({
  tone,
  patternItems,
}: {
  tone: "stable" | "caution" | "risk";
  patternItems: NonNullable<AnalysisSummaryState>["issuePatternAnalysis"];
}): AiExecutiveSummaryViewModel["patternInsight"] {
  const patterns = (patternItems ?? []).slice(0, 3).map((item) => ({
    label: item.name,
    value: item.count,
  }));
  const patternSummary = patterns
    .map((item) => `${item.label} ${item.value.toLocaleString()}건`)
    .join(", ");

  if (patterns.length === 0) {
    return {
      title: "반복 패턴 데이터 제한",
      description:
        "반복 패턴을 해석할 만큼의 신호가 충분하지 않아 잔여 이슈 우선순위와 QA 코멘트 중심으로 확인합니다.",
      patterns: [],
    };
  }

  if (tone === "risk") {
    return {
      title: "흐름 단위 회귀 검증 신호",
      description: `상위 반복 패턴(${patternSummary})이 함께 나타나므로 단일 이슈보다 기능 흐름 단위로 재검증해야 합니다.`,
      patterns,
    };
  }

  if (tone === "caution") {
    return {
      title: "재검증과 정책 확인 신호",
      description: `상위 반복 패턴(${patternSummary})은 치명 신호보다 Medium 재검증과 운영 정책 확인 범위로 분리하는 것이 적절합니다.`,
      patterns,
    };
  }

  return {
    title: "반복 패턴 신호 낮음",
    description: `상위 반복 패턴(${patternSummary})은 Low Known Issue와 차기 확인 항목 중심으로 모니터링 가능합니다.`,
    patterns,
  };
}

function createQaCheckpoints({
  tone,
  hasPatterns,
}: {
  tone: "stable" | "caution" | "risk";
  hasPatterns: boolean;
}) {
  if (tone === "risk") {
    return [
      "High / Highest 잔여 이슈를 우선 확인합니다.",
      "Blocked 항목은 원인 해소 후 회귀 검증으로 분리합니다.",
      hasPatterns
        ? "상위 반복 패턴은 묶음 단위로 재검증합니다."
        : "반복 패턴 데이터는 보조 근거로만 확인합니다.",
    ];
  }

  if (tone === "caution") {
    return [
      "Medium 잔여 이슈는 수정 반영 후 재검증합니다.",
      "Next Event는 후속 일정 항목으로 분리합니다.",
      "운영 정책 확인 항목은 QA 코멘트 기준으로 추적합니다.",
    ];
  }

  return [
    "Low Known Issue는 배포 후 모니터링 항목으로 관리합니다.",
    "차기 이벤트 확인 항목은 현재 릴리즈 위험과 분리합니다.",
    "High / Medium 잔여 이슈 신규 발생 여부만 확인합니다.",
  ];
}

export function createAiExecutiveSummaryViewModel({
  tone,
  highRisk,
  mediumRisk,
  lowRisk,
  blockedCount,
  blockedRate,
  nextEventCount,
  rcRemaining,
  patternItems,
}: {
  tone: "stable" | "caution" | "risk";
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  blockedCount: number;
  blockedRate: number;
  nextEventCount: number;
  rcRemaining: number;
  patternItems: NonNullable<AnalysisSummaryState>["issuePatternAnalysis"];
}): AiExecutiveSummaryViewModel {
  const patternInsight = createPatternInsight({ tone, patternItems });

  return {
    releaseJudgment: createReleaseJudgment({
      tone,
      highRisk,
      mediumRisk,
      blockedCount,
      blockedRate,
    }),
    riskSignals: createRiskSignals({
      tone,
      highRisk,
      mediumRisk,
      lowRisk,
      blockedCount,
      blockedRate,
      nextEventCount,
      rcRemaining,
    }),
    patternInsight,
    qaCheckpoints: createQaCheckpoints({
      tone,
      hasPatterns: patternInsight.patterns.length > 0,
    }),
  };
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function appendUnique(items: string[], item: string) {
  if (!items.includes(item)) items.push(item);
}

export function createQaFlowActionItems({
  tone,
  patternLabels,
  priorityTitles,
  highRisk,
  mediumRisk,
  lowRisk,
  nextEventCount,
}: {
  tone: "stable" | "caution" | "risk";
  patternLabels: string[];
  priorityTitles: string[];
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  nextEventCount: number;
}) {
  const sourceText = [...patternLabels, ...priorityTitles].join(" ");
  const actionItems: string[] = [];

  if (
    includesAny(sourceText, ["종료", "상태 전환", "상태 변경"]) ||
    (includesAny(sourceText, ["상태", "결과"]) &&
      includesAny(sourceText, ["CTA", "노출", "반영"]))
  ) {
    appendUnique(actionItems, "종료 상태 전환 후 CTA 노출 조건 재검증");
  }

  if (
    includesAny(sourceText, [
      "알림",
      "푸시",
      "발송",
      "우선순위",
      "중복",
      "메시지",
    ])
  ) {
    appendUnique(actionItems, "알림 우선순위·중복 발송 흐름 재검증");
  }

  if (
    includesAny(sourceText, [
      "운영",
      "관리자",
      "백오피스",
      "대응값",
      "반영 지연",
      "정책",
    ])
  ) {
    appendUnique(actionItems, "운영 대응값 반영 지연 모니터링");
  }

  if (includesAny(sourceText, ["데이터", "갱신", "동기화", "캐시"])) {
    appendUnique(actionItems, "데이터 갱신 후 화면 반영 흐름 확인");
  }

  if (
    includesAny(sourceText, ["결과", "토스트", "완료", "CTA"]) &&
    !actionItems.some((item) => item.includes("CTA"))
  ) {
    appendUnique(actionItems, "결과 알림·CTA 노출 흐름 재검증");
  }

  if (tone === "risk") {
    if (highRisk > 0 && actionItems.length === 0) {
      appendUnique(actionItems, "고우선순위 잔여 이슈 영향 범위 재검증");
    }
    appendUnique(actionItems, "반복 패턴 묶음 단위 회귀 검증");
    appendUnique(actionItems, "운영 대응값 반영 지연 모니터링");
  } else if (tone === "caution") {
    if (mediumRisk > 0) {
      appendUnique(actionItems, "Medium 잔여 이슈 수정 반영 후 재검증");
    }
    appendUnique(actionItems, "운영 정책 확정 항목 별도 추적");
    if (nextEventCount > 0) {
      appendUnique(actionItems, "Next Event 항목 차기 확인 범위 분리");
    }
  } else {
    if (lowRisk > 0) {
      appendUnique(actionItems, "Low Known Issue 운영 영향 모니터링");
    }
    if (nextEventCount > 0) {
      appendUnique(actionItems, "Next Event 항목 차기 확인 범위 관리");
    }
    appendUnique(actionItems, "주요 상태 반영 흐름 재발 여부 관찰");
  }

  const toneFallbacks =
    tone === "risk"
      ? [
          "종료 상태 전환 후 CTA 노출 조건 재검증",
          "알림 우선순위·중복 발송 흐름 재검증",
          "운영 대응값 반영 지연 모니터링",
        ]
      : tone === "caution"
        ? [
            "Medium 잔여 이슈 수정 반영 후 재검증",
            "운영 정책 확정 항목 별도 추적",
            "Next Event 항목 차기 확인 범위 분리",
          ]
        : [
            "Low Known Issue 운영 영향 모니터링",
            "Next Event 항목 차기 확인 범위 관리",
            "주요 상태 반영 흐름 재발 여부 관찰",
          ];

  toneFallbacks.forEach((item) => appendUnique(actionItems, item));

  return actionItems.slice(0, 3);
}
