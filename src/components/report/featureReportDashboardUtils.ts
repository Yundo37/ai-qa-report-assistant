import {
  buildQaReviewItems,
  getDefaultQaReviewItems,
  type QaReviewItem,
  type QaReviewTag,
} from "@/lib/report/qaReviewItemBuilder";
import { getQaReleaseStatusTone } from "@/lib/report/qaReleaseStatus";
import type { AnalysisSummaryState } from "@/types/report";

export type FeatureStatusTone = "stable" | "caution" | "risk";
export type FeatureInsightTone = FeatureStatusTone | "neutral";

export type FeatureMetrics = {
  pass: number;
  fail: number;
  blocked: number;
  nextEvent: number;
  notApplicable: number;
  totalTc: number;
  passRate: number;
  highHighest: number;
  medium: number;
  lowLowest: number;
  jiraMatched: number;
  remaining: number;
  resolved: number;
  reopened: number;
  status: {
    label: string;
    tone: FeatureStatusTone;
    description: string;
  };
};

export type FeatureReviewDisplayItem = QaReviewItem & {
  displayTag: string;
  jiraKey: string;
  sourceHint: string;
};

export type FeatureReviewDisplayModel = {
  allItems: QaReviewItem[];
  visibleItems: FeatureReviewDisplayItem[];
};

export type FeatureSheetProgressItem = {
  title: string;
  rows: number;
  total: number;
  pass: number;
  fail: number;
  blocked: number;
  nextEvent: number;
  notApplicable: number;
  passRate: number;
};

export type FeatureJiraMatrixRow = {
  label: string;
  highest: number;
  high: number;
  medium: number;
  low: number;
  total: number;
};

export type FeatureIssuePatternItem = {
  label: string;
  count: number;
  basis: string;
};

export type FeatureCoreSummaryModel = {
  sheetProgressItems: FeatureSheetProgressItem[];
  hiddenSheetCount: number;
  jiraMatrixRows: FeatureJiraMatrixRow[];
  issuePatterns: FeatureIssuePatternItem[];
};

function getCount(value: number | undefined) {
  return typeof value === "number" ? value : 0;
}

function countRemainingPriorities(
  issues: NonNullable<AnalysisSummaryState>["remainingIssues"]
) {
  return issues.reduce(
    (summary, issue) => {
      if (issue.priority === "Highest") summary.Highest += 1;
      if (issue.priority === "High") summary.High += 1;
      if (issue.priority === "Medium") summary.Medium += 1;
      if (issue.priority === "Low") summary.Low += 1;
      if (issue.priority === "Lowest") summary.Lowest += 1;
      return summary;
    },
    { Highest: 0, High: 0, Medium: 0, Low: 0, Lowest: 0 }
  );
}

function getFeatureStatusTone({
  totalTc,
  passRateBase,
  passRate,
  fail,
  blocked,
  nextEvent,
  remainingPriority,
  reviewItems,
}: {
  totalTc: number;
  passRateBase: number;
  passRate: number;
  fail: number;
  blocked: number;
  nextEvent: number;
  remainingPriority: ReturnType<typeof countRemainingPriorities>;
  reviewItems: QaReviewItem[];
}): FeatureStatusTone {
  const overallTone = getQaReleaseStatusTone({
    totalTc,
    blockedCount: blocked,
    remainingPriority,
  });
  const highHighestRemainingCount =
    getCount(remainingPriority.Highest) + getCount(remainingPriority.High);
  const mediumRemainingCount = getCount(remainingPriority.Medium);
  const effectiveTc = Math.max(passRateBase, 1);
  const blockedRate = blocked / effectiveTc;
  const nonPassCount = fail + blocked + nextEvent;
  const nonPassRate = nonPassCount / effectiveTc;
  const failBlockedCount = fail + blocked;
  const failBlockedRate = failBlockedCount / effectiveTc;
  const nextEventRate = nextEvent / effectiveTc;
  const highOrBlockedReviewCount = reviewItems.filter(
    (item) =>
      item.priority === "Highest" ||
      item.priority === "High" ||
      item.tag === "조건부" ||
      item.sourceLabel === "blocked"
  ).length;
  const cautionReviewCount = reviewItems.filter(
    (item) =>
      item.priority === "Medium" ||
      item.tag === "재검증" ||
      item.tag === "정책" ||
      item.tag === "후속"
  ).length;

  // Feature 리포트는 단일 기능 판정이므로 Jira Remaining이 약해도
  // TC 품질 신호가 충분히 크면 안정이 아닌 주의 필요로 올립니다.
  if (
    overallTone === "risk" ||
    highHighestRemainingCount > 0 ||
    blockedRate >= 0.2 ||
    (passRateBase > 0 && passRate <= 65) ||
    highOrBlockedReviewCount >= 3
  ) {
    return "risk";
  }

  if (
    mediumRemainingCount > 0 ||
    (passRateBase > 0 &&
      passRate < 90 &&
      nonPassRate >= 0.12 &&
      nonPassCount >= 4) ||
    (passRateBase > 0 && passRate < 85 && nonPassCount >= 3) ||
    (nonPassRate >= 0.2 && nonPassCount >= 5) ||
    (failBlockedRate >= 0.1 && failBlockedCount >= 3) ||
    (nextEventRate >= 0.25 && nextEvent >= 5) ||
    (cautionReviewCount >= 4 &&
      (passRate < 90 || nonPassRate >= 0.12 || failBlockedRate >= 0.08))
  ) {
    return "caution";
  }

  return "stable";
}

export function createFeatureMetrics(
  analysisSummary: NonNullable<AnalysisSummaryState>
): FeatureMetrics {
  const pass = getCount(analysisSummary.qaTotal.Pass);
  const fail = getCount(analysisSummary.qaTotal.Fail);
  const blocked = getCount(analysisSummary.qaTotal.Blocked);
  const nextEvent = getCount(analysisSummary.qaTotal.NextEvent);
  const notApplicable = getCount(analysisSummary.qaTotal["N/A"]);
  const totalTc = pass + fail + blocked + nextEvent + notApplicable;
  const passRateBase = pass + fail + blocked + nextEvent;
  const passRate = passRateBase > 0 ? (pass / passRateBase) * 100 : 0;
  const fallbackPriority = countRemainingPriorities(
    analysisSummary.remainingIssues
  );
  const remainingPriority =
    analysisSummary.qaIssueOverview?.remaining?.prioritySummary ??
    fallbackPriority;
  const highHighest =
    getCount(remainingPriority.Highest) + getCount(remainingPriority.High);
  const medium = getCount(remainingPriority.Medium);
  const lowLowest =
    getCount(remainingPriority.Low) + getCount(remainingPriority.Lowest);
  const jiraMatched =
    analysisSummary.jiraMatchedRows ||
    getCount(analysisSummary.jiraFiltered.Total);
  const remaining =
    getCount(analysisSummary.jiraFiltered.Remaining) ||
    analysisSummary.remainingIssues.length;
  const resolved = getCount(analysisSummary.jiraFiltered.Resolved);
  const reopened = getCount(analysisSummary.jiraStatus.Reopened);
  const reviewItems = buildQaReviewItems(analysisSummary);
  const statusTone = getFeatureStatusTone({
    totalTc,
    passRateBase,
    passRate,
    fail,
    blocked,
    nextEvent,
    remainingPriority,
    reviewItems,
  });
  const statusByTone: Record<FeatureStatusTone, FeatureMetrics["status"]> = {
    risk: {
      label: "위험",
      tone: "risk",
      description:
        "High 잔여 이슈 또는 Blocked 영향 항목이 남아 있어 기능 배포 전 우선 확인이 필요합니다.",
    },
    caution: {
      label: "주의 필요",
      tone: "caution",
      description:
        "치명도 높은 차단 신호는 확인되지 않았지만, Medium 잔여 이슈 또는 후속 확인 항목에 대한 재검증이 필요합니다.",
    },
    stable: {
      label: "안정",
      tone: "stable",
      description:
        "배포 차단 수준의 High / Medium 잔여 이슈는 확인되지 않았으며, Low 또는 후속 확인 항목은 운영 모니터링 범위로 관리할 수 있습니다.",
    },
  };

  return {
    pass,
    fail,
    blocked,
    nextEvent,
    notApplicable,
    totalTc,
    passRate,
    highHighest,
    medium,
    lowLowest,
    jiraMatched,
    remaining,
    resolved,
    reopened,
    status: statusByTone[statusTone],
  };
}

function mapReviewTag(tag: QaReviewTag, priority: string) {
  if (tag === "조건부") return "Blocked";
  if (tag === "우선") return "우선 확인";
  if (tag === "모니터링" && (priority === "Low" || priority === "Lowest")) {
    return "Low Known Issue";
  }
  return tag;
}

function getReviewSourceHint(sourceLabel: string) {
  if (sourceLabel === "remaining") return "잔여 이슈";
  if (sourceLabel === "blocked") return "Blocked 영향";
  if (sourceLabel === "pattern") return "이슈 패턴";
  return "QA Comment / Follow-up";
}

function extractJiraKeyFromReviewItem(item: QaReviewItem) {
  return item.id.match(/\b[A-Z][A-Z0-9]+-\d+\b/)?.[0] ?? "";
}

export function createFeatureReviewDisplayModel(
  analysisSummary: NonNullable<AnalysisSummaryState>
): FeatureReviewDisplayModel {
  const reviewItems = buildQaReviewItems(analysisSummary);
  const defaultItems = getDefaultQaReviewItems({
    analysisSummary,
    items: reviewItems,
  });

  return {
    allItems: reviewItems,
    visibleItems: defaultItems.slice(0, 8).map((item) => ({
      ...item,
      displayTag: mapReviewTag(item.tag, item.priority),
      jiraKey: extractJiraKeyFromReviewItem(item),
      sourceHint: getReviewSourceHint(item.sourceLabel),
    })),
  };
}

function isJiraDataSheet(title: string) {
  const normalizedTitle = title.replace(/\s/g, "").toLowerCase();
  return (
    normalizedTitle.includes("jira") ||
    normalizedTitle.includes("지라데이터") ||
    normalizedTitle.includes("jira데이터")
  );
}

function calculateSheetPassRate({
  pass,
  fail,
  blocked,
  nextEvent,
}: {
  pass: number;
  fail: number;
  blocked: number;
  nextEvent: number;
}) {
  const denominator = pass + fail + blocked + nextEvent;
  return denominator > 0 ? (pass / denominator) * 100 : 0;
}

function createSheetProgressItems(
  analysisSummary: NonNullable<AnalysisSummaryState>
) {
  return analysisSummary.testSheets
    .filter((sheet) => !isJiraDataSheet(sheet.title))
    .map((sheet): FeatureSheetProgressItem => {
      const pass = getCount(sheet.summary.Pass);
      const fail = getCount(sheet.summary.Fail);
      const blocked = getCount(sheet.summary.Blocked);
      const nextEvent = getCount(sheet.summary.NextEvent);
      const notApplicable = getCount(sheet.summary["N/A"]);
      const total = pass + fail + blocked + nextEvent + notApplicable;

      return {
        title: sheet.title,
        rows: sheet.rows,
        total: total || sheet.rows,
        pass,
        fail,
        blocked,
        nextEvent,
        notApplicable,
        passRate: calculateSheetPassRate({
          pass,
          fail,
          blocked,
          nextEvent,
        }),
      };
    });
}

function normalizePrioritySummary(
  summary?: Partial<ReturnType<typeof countRemainingPriorities>>
) {
  return {
    Highest: getCount(summary?.Highest),
    High: getCount(summary?.High),
    Medium: getCount(summary?.Medium),
    Low: getCount(summary?.Low),
    Lowest: getCount(summary?.Lowest),
  };
}

function sumPrioritySummary(summary: ReturnType<typeof normalizePrioritySummary>) {
  return (
    summary.Highest +
    summary.High +
    summary.Medium +
    summary.Low +
    summary.Lowest
  );
}

function selectPrioritySummary({
  primary,
  fallback,
}: {
  primary?: Partial<ReturnType<typeof countRemainingPriorities>>;
  fallback?: Partial<ReturnType<typeof countRemainingPriorities>>;
}) {
  const normalizedPrimary = normalizePrioritySummary(primary);
  if (sumPrioritySummary(normalizedPrimary) > 0) {
    return normalizedPrimary;
  }

  return normalizePrioritySummary(fallback);
}

function createJiraMatrixRows(
  analysisSummary: NonNullable<AnalysisSummaryState>
) {
  const created = selectPrioritySummary({
    primary: analysisSummary.qaIssueOverview?.created?.prioritySummary,
    fallback: analysisSummary.jiraPriority as Partial<
      ReturnType<typeof countRemainingPriorities>
    >,
  });
  const resolved = selectPrioritySummary({
    primary: analysisSummary.qaIssueOverview?.resolved?.prioritySummary,
  });
  const remaining = selectPrioritySummary({
    primary: analysisSummary.qaIssueOverview?.remaining?.prioritySummary,
    fallback: countRemainingPriorities(analysisSummary.remainingIssues),
  });

  return [
    { label: "발생 이슈 현황", summary: created },
    { label: "수정 완료 현황", summary: resolved },
    { label: "잔여 이슈 현황", summary: remaining },
  ].map(({ label, summary }): FeatureJiraMatrixRow => {
    const low = summary.Low + summary.Lowest;

    return {
      label,
      highest: summary.Highest,
      high: summary.High,
      medium: summary.Medium,
      low,
      total: summary.Highest + summary.High + summary.Medium + low,
    };
  });
}

function normalizePatternText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function classifyPatternLabel(text: string) {
  const normalized = text.toLowerCase();
  const patternGroups = [
    {
      label: "상태 변경 / 상태 반영",
      keywords: ["상태", "반영", "변경", "갱신"],
    },
    {
      label: "CTA / 버튼 노출",
      keywords: ["cta", "버튼", "노출", "미노출"],
    },
    {
      label: "알림 / 발송",
      keywords: ["알림", "발송", "중복", "푸시"],
    },
    {
      label: "정책 / 운영 조건",
      keywords: ["정책", "운영", "조건", "권한", "기준"],
    },
    {
      label: "데이터 / 결과 갱신",
      keywords: ["데이터", "집계", "카운트", "결과", "저장"],
    },
    {
      label: "화면 표시 / UI",
      keywords: ["화면", "표시", "ui", "문구", "레이아웃"],
    },
  ];

  return (
    patternGroups.find((group) =>
      group.keywords.some((keyword) => normalized.includes(keyword))
    )?.label ?? null
  );
}

function isGenericPatternLabel(label: string) {
  const normalized = label.replace(/\s+/g, "").toLowerCase();
  return [
    "원문확인필요",
    "원문확인",
    "상세확인",
    "확인필요",
    "추가확인",
    "미분류",
    "분류불가",
    "기타",
    "qacomment",
    "follow-up",
    "followup",
  ].some((keyword) => normalized.includes(keyword));
}

function formatPatternBasis(sourceTypes: string[]) {
  const basis = new Set<string>();

  sourceTypes.forEach((sourceType) => {
    const normalized = sourceType.toLowerCase();
    if (normalized.includes("jira") || normalized.includes("remaining")) {
      basis.add("Jira summary");
      return;
    }
    if (normalized.includes("qa") || normalized.includes("comment")) {
      basis.add("QA Comment");
      return;
    }
    if (normalized.includes("blocked")) {
      basis.add("Blocked pattern");
      return;
    }
    if (normalized.includes("fail")) {
      basis.add("Fail pattern");
    }
  });

  return Array.from(basis).join(" / ");
}

function createFallbackIssuePatterns(
  analysisSummary: NonNullable<AnalysisSummaryState>
) {
  const patternCounts = new Map<
    string,
    { count: number; sources: Set<string> }
  >();
  const addPattern = (value: string, source: string) => {
    const text = normalizePatternText(value);
    if (!text) return;
    const label = classifyPatternLabel(text);
    if (!label || isGenericPatternLabel(label)) return;

    const current = patternCounts.get(label) ?? {
      count: 0,
      sources: new Set<string>(),
    };
    current.count += 1;
    current.sources.add(source);
    patternCounts.set(label, current);
  };

  analysisSummary.remainingIssues.forEach((issue) =>
    addPattern(issue.summary, "Jira summary")
  );
  analysisSummary.qaAnalysisContext.failPatterns.forEach((pattern) =>
    addPattern(pattern, "Fail pattern")
  );
  analysisSummary.qaAnalysisContext.blockedPatterns.forEach((pattern) =>
    addPattern(pattern, "Blocked pattern")
  );
  analysisSummary.qaFollowUps.forEach((followUp) =>
    addPattern(followUp, "QA Comment")
  );

  return Array.from(patternCounts.entries())
    .map(([label, item]) => ({
      label,
      count: item.count,
      basis: Array.from(item.sources).join(" / "),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function createIssuePatternItems(
  analysisSummary: NonNullable<AnalysisSummaryState>
) {
  const explicitPatterns = (analysisSummary.issuePatternAnalysis ?? [])
    .slice()
    .sort((a, b) => b.count - a.count)
    .filter((item) => !isGenericPatternLabel(item.name))
    .map((item) => ({
      label: item.name,
      count: item.count,
      basis: formatPatternBasis(item.sourceTypes),
    }))
    .filter((item) => item.count > 0)
    .slice(0, 5);

  if (explicitPatterns.length > 0) {
    return explicitPatterns;
  }

  return createFallbackIssuePatterns(analysisSummary);
}

export function createFeatureCoreSummaryModel(
  analysisSummary: NonNullable<AnalysisSummaryState>
): FeatureCoreSummaryModel {
  const sheetProgressItems = createSheetProgressItems(analysisSummary);

  return {
    sheetProgressItems: sheetProgressItems.slice(0, 6),
    hiddenSheetCount: Math.max(sheetProgressItems.length - 6, 0),
    jiraMatrixRows: createJiraMatrixRows(analysisSummary),
    issuePatterns: createIssuePatternItems(analysisSummary),
  };
}

export function createFeatureAiInsights({
  metrics,
  reviewItems,
}: {
  metrics: FeatureMetrics;
  reviewItems: FeatureReviewDisplayItem[];
}) {
  const uniqueTags = Array.from(
    new Set(reviewItems.map((item) => item.displayTag))
  ).slice(0, 4);
  const hasReviewItems = reviewItems.length > 0;
  const riskSignal =
    metrics.highHighest > 0
      ? `High / Highest 잔여 이슈 ${metrics.highHighest}건을 우선 확인해야 합니다.`
      : metrics.fail > 0 || metrics.blocked > 0
        ? `Fail ${metrics.fail}건, Blocked ${metrics.blocked}건 기준으로 재검증 범위를 분리합니다.`
        : metrics.nextEvent > 0
          ? `Next Event ${metrics.nextEvent}건은 후속 확인 항목으로 관리합니다.`
          : "주요 차단 신호는 낮으며 운영 모니터링 중심으로 확인합니다.";
  const checkpoint =
    uniqueTags.length > 0
      ? uniqueTags.join(" / ")
      : "정책, 데이터 갱신, 상태 반영, 운영 영향 항목";

  return [
    {
      title: "기능 검증 상태",
      value: metrics.status.label,
      description: metrics.status.description,
      tone: metrics.status.tone,
    },
    {
      title: "주요 리스크 신호",
      value: `Fail ${metrics.fail} · Blocked ${metrics.blocked}`,
      description: riskSignal,
      tone:
        metrics.highHighest > 0 || metrics.blocked > 0
          ? "risk"
          : metrics.fail > 0
            ? "caution"
            : "stable",
    },
    {
      title: "추가 검증 포인트",
      value: checkpoint,
      description:
        "QA Comment / Follow-up에서 반복적으로 드러나는 확인 범위를 기준으로 정리했습니다.",
      tone: hasReviewItems ? "caution" : "neutral",
    },
    {
      title: "QA 확인 방향",
      value: hasReviewItems
        ? `${reviewItems.length}개 우선 확인 항목`
        : "추가 항목 없음",
      description: hasReviewItems
        ? `QA 협의/확인 항목 ${reviewItems.length}개를 기준으로 ${checkpoint}을 확인합니다.`
        : "추가 Follow-up 항목은 없으며 테스트 결과와 Jira 조건을 함께 확인합니다.",
      tone: hasReviewItems ? "caution" : "stable",
    },
  ] satisfies Array<{
    title: string;
    value: string;
    description: string;
    tone: FeatureInsightTone;
  }>;
}
