import type {
  AiExecutiveSummaryViewModel,
  InsightTone,
  SignalTone,
  SummaryRiskSignal,
} from "@/components/report/ai-summary/types";

export function signalBadgeClass(tone: SignalTone) {
  if (tone === "risk") return "bg-red-50 text-red-700";
  if (tone === "attention") return "bg-amber-50 text-amber-700";
  if (tone === "neutral") return "bg-slate-100 text-slate-600";
  return "bg-emerald-50 text-emerald-700";
}

export function insightToneBadgeClass(tone: InsightTone | undefined) {
  if (tone === "risk") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (tone === "caution") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (tone === "stable") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
  return "bg-indigo-50 text-indigo-700 ring-indigo-100";
}

export function insightToneLabel(tone: InsightTone | undefined) {
  if (tone === "risk") return "우선 확인";
  if (tone === "caution") return "추가 확인";
  if (tone === "stable") return "모니터링";
  return "AI Insight";
}

export function priorityBadgeClass(
  priority: "high" | "medium" | "low" | undefined
) {
  if (priority === "high") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (priority === "medium") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

export function priorityLabel(
  priority: "high" | "medium" | "low" | undefined
) {
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  if (priority === "low") return "Low";
  return "Check";
}

export function getDisplayEvidence(evidence: string | undefined) {
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

export function softenBlockingTerms(text: string | undefined) {
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

export function createCompactJudgmentTitle(
  tone: "stable" | "caution" | "risk"
) {
  if (tone === "risk") return "추가 검증 필요";
  if (tone === "caution") return "후속 확인 필요";
  return "운영 모니터링 가능";
}

export function createCompactJudgmentDescription({
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

export function compactRiskSignal(
  signal: AiExecutiveSummaryViewModel["riskSignals"][number]
): SummaryRiskSignal {
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

export function formatSummaryValue(value: string | number | undefined) {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string" && value.trim()) return value;
  return "-";
}

export function formatRate(rate: number) {
  return `${Math.round(rate * 1000) / 10}%`;
}
