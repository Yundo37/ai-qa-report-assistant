"use client";

import { useState } from "react";
import { AiAnalysisSections } from "@/components/report/ai-summary/AiAnalysisSections";
import { AiExecutiveSummaryLoading } from "@/components/report/ai-summary/AiExecutiveSummaryLoading";
import { AiPriorityCheckItems } from "@/components/report/ai-summary/AiPriorityCheckItems";
import { DeterministicReleaseSummaryPanel } from "@/components/report/ai-summary/DeterministicReleaseSummaryPanel";
import { OverallAiSummaryPanel } from "@/components/report/ai-summary/OverallAiSummaryPanel";
import type {
  InsightTone,
  SignalTone,
  SummaryMetricStripItem,
} from "@/components/report/ai-summary/types";
import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
import type {
  AiExecutiveSummaryResult,
  AnalysisSummaryState,
} from "@/types/report";

type AiExecutiveSummaryCardProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  analysisText: string;
  aiExecutiveSummary?: AiExecutiveSummaryResult | null;
  isLoading: boolean;
};

/*
  "현재 Overall QA는 High / Highest 잔여 이슈와 Blocked 항목 확인이 필요한 상태입니다. 상단 잔여 이슈와 RC별 잔여 흐름을 함께 검토하면 릴리즈 전 우선 확인 범위를 빠르게 좁힐 수 있습니다.",
  "주요 리스크는 High Priority 잔여 이슈, Blocked 항목, 반복 이슈 패턴에서 확인됩니다. 특히 반복 패턴이 여러 데이터 소스에 걸쳐 나타나는 경우 기능 검증 범위와 후속 확인 항목을 분리해 관리하는 것이 좋습니다.",
  "후속 액션은 주요 잔여 이슈 재확인, Blocked 항목 재검증, Next Event 항목 별도 추적을 중심으로 정리할 수 있습니다. Next Event는 현재 릴리즈 실패 신호가 아니라 차기 대응 및 모니터링 항목으로 분리해 확인합니다.",
*/

type AiExecutiveSummaryViewModel = {
  releaseJudgment: {
    title: string;
    description: string;
  };
  riskSignals: Array<{
    title: string;
    value?: string | number;
    description: string;
    tone: SignalTone;
  }>;
  patternInsight: {
    title: string;
    description: string;
    patterns: Array<{
      label: string;
      value?: string | number;
    }>;
  };
  qaCheckpoints: string[];
};

function signalBadgeClass(tone: SignalTone) {
  if (tone === "risk") return "bg-red-50 text-red-700";
  if (tone === "attention") return "bg-amber-50 text-amber-700";
  if (tone === "neutral") return "bg-slate-100 text-slate-600";
  return "bg-emerald-50 text-emerald-700";
}

function insightToneBadgeClass(tone: InsightTone | undefined) {
  if (tone === "risk") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (tone === "caution") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (tone === "stable") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
  return "bg-indigo-50 text-indigo-700 ring-indigo-100";
}

function insightToneLabel(tone: InsightTone | undefined) {
  if (tone === "risk") return "우선 확인";
  if (tone === "caution") return "추가 확인";
  if (tone === "stable") return "모니터링";
  return "AI Insight";
}

function priorityBadgeClass(priority: "high" | "medium" | "low" | undefined) {
  if (priority === "high") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (priority === "medium") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

function priorityLabel(priority: "high" | "medium" | "low" | undefined) {
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  if (priority === "low") return "Low";
  return "Check";
}

function getDisplayEvidence(evidence: string | undefined) {
  const trimmedEvidence = evidence?.trim();
  if (!trimmedEvidence) return null;

  const internalEvidencePatterns = [
    /analysisSummary/i,
    /blockedImpact/i,
    /issuePatternAnalysis/i,
    /overallAnalysisEvidence/i,
    /priorityCheckItems/i,
    /qaIssueOverview/i,
    /rcProgress/i,
    /remainingIssues\./i,
    /topBlockedIssues/i,
  ];

  if (
    internalEvidencePatterns.some((pattern) => pattern.test(trimmedEvidence))
  ) {
    return null;
  }

  return softenBlockingTerms(trimmedEvidence);
}

function softenBlockingTerms(text: string | undefined) {
  if (!text) return "";

  return text
    .replaceAll("Blocked 낮은 영향", "검증 제한 영향")
    .replaceAll("Blocked 영향 항목", "검증 제한 항목")
    .replaceAll("Blocked 항목", "검증 보류 항목")
    .replaceAll("Blocked 영향", "검증 제한 영향")
    .replaceAll("Blocked 비율", "검증 보류 비율")
    .replaceAll("차단 이슈", "검증 제한 항목")
    .replaceAll("차단 영향", "검증 제한 영향")
    .replaceAll("QA 차단", "QA 진행 제한")
    .replaceAll("차단 원인", "검증 제한 원인")
    .replaceAll("차단 케이스", "검증 보류 케이스")
    .replaceAll("차단 요소", "검증 제한 요소")
    .replaceAll("차단 신호", "검증 제한 신호")
    .replaceAll("차단", "검증 제한");
}

function createCompactJudgmentTitle(tone: "stable" | "caution" | "risk") {
  if (tone === "risk") return "추가 검증 필요";
  if (tone === "caution") return "후속 확인 필요";
  return "운영 모니터링 가능";
}

function createCompactJudgmentDescription({
  tone,
  highRisk,
  mediumRisk,
  blockedCount,
  lowRisk,
  nextEventCount,
}: {
  tone: "stable" | "caution" | "risk";
  highRisk: number;
  mediumRisk: number;
  blockedCount: number;
  lowRisk: number;
  nextEventCount: number;
}) {
  if (tone === "risk") {
    if (highRisk > 0 && blockedCount > 0) {
      return "고우선순위 잔여 이슈와 검증 제한 영향이 있어 배포 전 우선 확인이 필요합니다.";
    }

    if (highRisk > 0) {
      return "고우선순위 잔여 이슈가 남아 있어 배포 전 우선 확인이 필요합니다.";
    }

    return "검증 제한 영향이 남아 있어 배포 전 우선 확인 범위 분리가 필요합니다.";
  }

  if (tone === "caution") {
    if (mediumRisk > 0) {
      return "중간 수준 잔여 이슈는 정책 확인 항목과 후속 재검증 범위로 관리합니다.";
    }

    return "후속 확인 항목은 정책 검토와 운영 모니터링 범위로 관리합니다.";
  }

  if (lowRisk > 0 || nextEventCount > 0) {
    return "Low/Next 항목은 운영 모니터링과 차기 확인 범위로 관리 가능합니다.";
  }

  return "주요 제한 신호는 낮고, 남은 항목은 운영 모니터링 중심으로 관리 가능합니다.";
}

function compactRiskSignal(
  signal: AiExecutiveSummaryViewModel["riskSignals"][number]
) {
  const title = softenBlockingTerms(signal.title);
  let description = softenBlockingTerms(signal.description);

  if (title.includes("High / Highest") && title.includes("없음")) {
    description = "주요 고위험 신호 없음";
  } else if (title.includes("High / Medium") && title.includes("없음")) {
    description = "주요 제한 신호 없음";
  } else if (title.includes("High / Highest")) {
    description = "배포 전 우선 확인 대상";
  } else if (title.includes("Blocked") || title.includes("검증 제한")) {
    description =
      signal.tone === "stable" ? "운영 영향 낮음" : "검증 제한 영향 확인 필요";
  } else if (title.includes("Medium")) {
    description =
      signal.tone === "stable" ? "운영 정책 확인 필요" : "후속 재검증 대상";
  } else if (title.includes("Next Event")) {
    description = "차기 확인 항목";
  } else if (title.includes("Low Known")) {
    description = "운영 모니터링 대상";
  } else if (title.includes("RC")) {
    description = "전체 잔여와 분리 해석";
  }

  return {
    ...signal,
    title,
    description,
  };
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function appendUnique(items: string[], item: string) {
  if (!items.includes(item)) items.push(item);
}

function createQaFlowActionItems({
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

function formatSummaryValue(value: string | number | undefined) {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string" && value.trim()) return value;
  return "-";
}

function formatRate(rate: number) {
  return `${Math.round(rate * 1000) / 10}%`;
}

function createAiExecutiveSummaryViewModelFromAiResult(
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

function createAiExecutiveSummaryViewModel({
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

export function AiExecutiveSummaryCard({
  analysisSummary,
  analysisText,
  aiExecutiveSummary,
  isLoading,
}: AiExecutiveSummaryCardProps) {
  const analysisDetailKey = analysisText.trim();
  const [collapsedAnalysisDetailKey, setCollapsedAnalysisDetailKey] = useState<
    string | null
  >(null);
  const hasRealAnalysisText = Boolean(analysisDetailKey);
  const paragraphsByBlock = analysisText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const paragraphs =
    paragraphsByBlock.length > 1
      ? paragraphsByBlock
      : analysisText
          .split(/\n+/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean);
  const hasAnalysis = hasRealAnalysisText && paragraphs.length > 0;
  const metrics = createOverallDashboardMetrics(analysisSummary);
  const remainingPriority =
    analysisSummary.qaIssueOverview?.remaining?.prioritySummary;
  const highRisk =
    (remainingPriority?.Highest ?? 0) + (remainingPriority?.High ?? 0);
  const mediumRisk = remainingPriority?.Medium ?? 0;
  const lowRisk = (remainingPriority?.Low ?? 0) + (remainingPriority?.Lowest ?? 0);
  const blockedCount =
    analysisSummary.overallQaSummary?.Blocked ??
    analysisSummary.qaTotal.Blocked ??
    0;
  const nextEventCount =
    analysisSummary.overallQaSummary?.NextEvent ??
    analysisSummary.qaTotal.NextEvent ??
    0;
  const patternItems = (analysisSummary.issuePatternAnalysis ?? []).slice(0, 3);
  const ruleBasedExecutiveSummaryViewModel = createAiExecutiveSummaryViewModel({
    tone: metrics.status.tone,
    highRisk,
    mediumRisk,
    lowRisk,
    blockedCount,
    blockedRate: metrics.blockedRate,
    nextEventCount,
    rcRemaining: analysisSummary.rcProgress.remainingIssues,
    patternItems,
  });
  const executiveSummaryViewModel = aiExecutiveSummary
    ? createAiExecutiveSummaryViewModelFromAiResult(aiExecutiveSummary)
    : ruleBasedExecutiveSummaryViewModel;
  const hasAiExecutiveSummary = Boolean(aiExecutiveSummary);
  const hasCompletedAiAnalysis = hasRealAnalysisText && !isLoading;
  const isDetailOpen = collapsedAnalysisDetailKey !== analysisDetailKey;

  const insightCards = (aiExecutiveSummary?.overallInsightCards ?? []).slice(
    0,
    4
  );
  const hasStructuredInsightCards = hasAiExecutiveSummary && insightCards.length > 0;
  const mainInsightCard = insightCards[0];
  const riskInsightCard = insightCards[1];
  const patternInsightCard = insightCards[2] ?? insightCards[1];
  const structuredAnalysisSections = (
    aiExecutiveSummary?.analysisSections ?? []
  ).slice(0, 4);
  const fallbackAnalysisSections =
    structuredAnalysisSections.length > 0
      ? structuredAnalysisSections
      : paragraphs.length > 1
        ? paragraphs.map((paragraph, index) => ({
            title:
              index === 0
                ? "종합 판단"
                : index === 1
                  ? "핵심 리스크 해석"
                  : "후속 확인 방향",
            body: paragraph,
          }))
        : [];
  const priorityCheckItems = (
    aiExecutiveSummary?.priorityCheckItems ?? []
  ).slice(0, 4);
  const hasAiBranding = isLoading || hasCompletedAiAnalysis;
  const cardTitle = hasAiBranding
    ? "AI 릴리즈 분석 요약"
    : "릴리즈 분석 요약";
  const cardDescription = hasAiBranding
    ? "AI가 잔여 리스크 구조와 후속 확인 범위를 릴리즈 회의 관점으로 정리합니다."
    : "현재 QA 및 Jira 데이터를 기반으로 릴리즈 판단과 리스크 신호를 정리합니다.";
  const totalTestCases =
    analysisSummary.overallQaSummary?.Total ??
    analysisSummary.qaTotal.Total ??
    0;
  const metricStripItems: SummaryMetricStripItem[] = [
    {
      label: "전체 TC",
      value: totalTestCases,
      slotType: "metric-test-cases" as const,
    },
    {
      label: "발견 이슈",
      value: analysisSummary.jiraMatchedRows,
      slotType: "metric-jira-issues" as const,
    },
    {
      label: "잔여 이슈",
      value: metrics.remaining,
      slotType: "risk" as const,
    },
    {
      label: "분석 RC",
      value: analysisSummary.rcProgress.items.length,
      slotType: "metric-rc-versions" as const,
    },
    {
      label: "QA 코멘트",
      value: analysisSummary.qaFollowUps.length,
      slotType: "follow-up" as const,
    },
  ];
  const passRatePercent = Math.max(0, Math.min(metrics.passRate, 100));
  const passRateDonutStyle = {
    background: `conic-gradient(#6d5dfc ${passRatePercent}%, #ece9ff ${passRatePercent}% 100%)`,
  };
  const releaseJudgmentLabel = hasStructuredInsightCards
    ? "AI 종합 판단"
    : "릴리즈 판단";
  const releaseJudgmentTitle = createCompactJudgmentTitle(metrics.status.tone);
  const releaseJudgmentDescription = softenBlockingTerms(
    createCompactJudgmentDescription({
      tone: metrics.status.tone,
      highRisk,
      mediumRisk,
      blockedCount,
      lowRisk,
      nextEventCount,
    })
  );
  const patternInsightTitle =
    softenBlockingTerms(
      patternInsightCard?.headline ??
        executiveSummaryViewModel.patternInsight.title
    );
  const patternInsightDescription =
    softenBlockingTerms(
      patternInsightCard?.description ??
        executiveSummaryViewModel.patternInsight.description
    );
  const fallbackQaDirectionItems = ruleBasedExecutiveSummaryViewModel.qaCheckpoints.map(
    (item) => softenBlockingTerms(item)
  );
  const topQaDirectionItems = createQaFlowActionItems({
    tone: metrics.status.tone,
    patternLabels: patternItems.map((item) => item.name),
    priorityTitles: priorityCheckItems.map((item) => item.title),
    highRisk,
    mediumRisk,
    lowRisk,
    nextEventCount,
  }).map((item) => softenBlockingTerms(item));
  const displayRiskSignals =
    executiveSummaryViewModel.riskSignals.length >= 4
      ? executiveSummaryViewModel.riskSignals.slice(0, 4)
      : ruleBasedExecutiveSummaryViewModel.riskSignals.slice(0, 4);
  const compactRiskSignals = displayRiskSignals.map(compactRiskSignal);
  const displayPatternItems =
    ruleBasedExecutiveSummaryViewModel.patternInsight.patterns.length > 0
      ? ruleBasedExecutiveSummaryViewModel.patternInsight.patterns.slice(0, 3)
      : executiveSummaryViewModel.patternInsight.patterns.slice(0, 3);
  return (
    <section
      className={`min-w-0 rounded-[2rem] p-5 sm:p-6 ${
        hasAiBranding
          ? "border border-indigo-200 bg-gradient-to-br from-indigo-100/90 via-violet-50 to-white shadow-xl shadow-indigo-100/80"
          : "border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 shadow-sm"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {hasAiBranding && (
              <span className="grid size-8 place-items-center rounded-full bg-indigo-600 text-sm font-black text-white">
                ai
              </span>
            )}
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              {cardTitle}
            </h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {cardDescription}
          </p>
        </div>
        {hasAnalysis && (
          <button
            type="button"
            onClick={() =>
              setCollapsedAnalysisDetailKey((currentKey) =>
                currentKey === analysisDetailKey ? null : analysisDetailKey
              )
            }
            className="shrink-0 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
          >
            {isDetailOpen ? "전체 AI 요약 접기" : "전체 AI 요약 보기"}
          </button>
        )}
      </div>

      {isLoading ? (
        <AiExecutiveSummaryLoading />
      ) : !hasRealAnalysisText ? (
        <DeterministicReleaseSummaryPanel
          fallbackQaDirectionItems={fallbackQaDirectionItems}
          formatSummaryValue={formatSummaryValue}
          metricStripItems={metricStripItems}
          passRateDonutStyle={passRateDonutStyle}
          passRatePercent={passRatePercent}
          ruleBasedExecutiveSummaryViewModel={ruleBasedExecutiveSummaryViewModel}
          signalBadgeClass={signalBadgeClass}
          softenBlockingTerms={softenBlockingTerms}
        />
      ) : (
        <>
          <OverallAiSummaryPanel
            compactRiskSignals={compactRiskSignals}
            displayPatternItems={displayPatternItems}
            formatSummaryValue={formatSummaryValue}
            hasStructuredInsightCards={hasStructuredInsightCards}
            insightToneBadgeClass={insightToneBadgeClass}
            insightToneLabel={insightToneLabel}
            mainInsightCard={mainInsightCard}
            metricStripItems={metricStripItems}
            passRateDonutStyle={passRateDonutStyle}
            passRatePercent={passRatePercent}
            patternInsightDescription={patternInsightDescription}
            patternInsightTitle={patternInsightTitle}
            releaseJudgmentDescription={releaseJudgmentDescription}
            releaseJudgmentLabel={releaseJudgmentLabel}
            releaseJudgmentTitle={releaseJudgmentTitle}
            riskInsightCard={riskInsightCard}
            signalBadgeClass={signalBadgeClass}
            softenBlockingTerms={softenBlockingTerms}
            topQaDirectionItems={topQaDirectionItems}
          />

          {hasAnalysis && isDetailOpen && (
            <div className="mt-4 space-y-4 rounded-2xl border border-indigo-100 bg-white p-4 text-[15px] leading-8 text-slate-700">
              <AiPriorityCheckItems
                getDisplayEvidence={getDisplayEvidence}
                items={priorityCheckItems}
                priorityBadgeClass={priorityBadgeClass}
                priorityLabel={priorityLabel}
                softenBlockingTerms={softenBlockingTerms}
              />
              <AiAnalysisSections
                fallbackAnalysisSections={fallbackAnalysisSections}
                paragraphs={paragraphs}
                softenBlockingTerms={softenBlockingTerms}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
