import type {
  AnalysisSummaryState,
  BlockedImpactItem,
  IssuePatternSource,
  RemainingIssue,
} from "@/types/report";

export type QaReviewTag =
  | "우선"
  | "재검증"
  | "정책"
  | "모니터링"
  | "조건부"
  | "후속";

type IssueEvidence = {
  key: string;
  summary: string;
  displayLabel: string;
  priority: string;
  status: string;
  source: "remaining" | "blocked" | "pattern";
  blockedCaseCount?: number;
  affectedScopes?: string[];
};

export type QaReviewItem = {
  id: string;
  title: string;
  description: string;
  tag: QaReviewTag;
  priority: string;
  status: string;
  sourceLabel: string;
  sortScore: number;
  sourceCount: number;
  hasLinkedIssue: boolean;
};

export type QaReviewMetadata = {
  tag: QaReviewTag;
  linkedIssueLabel: string;
  priority: string;
  status: string;
};

const HIGH_PRIORITIES = new Set(["Highest", "High"]);
const LOW_PRIORITIES = new Set(["Low", "Lowest"]);
const JIRA_KEY_REGEX = /[A-Z]+-\d+/g;
const NEXT_EVENT_PATTERN =
  /차기|다음\s*이벤트|차기\s*이벤트|다음\s*업데이트|차기\s*업데이트|다음\s*버전|후속|추후|next\s*event/i;
const POLICY_PATTERN =
  /정책|조건|확정|운영\s*정책|운영툴|알림\s*설정|노출\s*조건|cta\s*조건|cta\s*예약|예약\s*상태|결과\s*공개|공개\s*정책|우선순위\s*정책|다국어|문구|발송|리스트|갱신\s*기준|policy/i;
const MONITORING_PATTERN = /모니터링|운영\s*모니터링|배포\s*후\s*확인|known\s*issue/i;
const RETEST_PATTERN = /재검증|재확인|수정\s*반영|qa대기|qa\s*확인|확인\s*필요|retest/i;
const BLOCKED_PATTERN = /blocked|qa\s*불가|qa\s*진행\s*불가|검증\s*불가|확인\s*불가/i;

function extractJiraKeys(text: string) {
  return Array.from(new Set(text.match(JIRA_KEY_REGEX) ?? []));
}

function normalizePriority(priority: string) {
  return priority || "미분류";
}

function createDisplayLabel(key: string, summary: string) {
  return summary ? `${key}(${summary})` : key;
}

function createBlockedScopeSummary(issue: BlockedImpactItem) {
  return Array.from(
    new Set([...issue.affectedCategories, ...issue.affectedSheets].filter(Boolean))
  ).slice(0, 2);
}

function buildIssueEvidenceMap(
  analysisSummary: NonNullable<AnalysisSummaryState>
) {
  const evidenceMap = new Map<string, IssueEvidence>();

  (analysisSummary.issuePatternSources ?? []).forEach((source: IssuePatternSource) => {
    if (!source.key || evidenceMap.has(source.key)) return;
    evidenceMap.set(source.key, {
      key: source.key,
      summary: source.summary,
      displayLabel: createDisplayLabel(source.key, source.summary),
      priority: normalizePriority(source.priority),
      status: source.status || "-",
      source: "pattern",
    });
  });

  analysisSummary.remainingIssues.forEach((issue: RemainingIssue) => {
    evidenceMap.set(issue.key, {
      key: issue.key,
      summary: issue.summary,
      displayLabel: createDisplayLabel(issue.key, issue.summary),
      priority: normalizePriority(issue.priority),
      status: issue.status || "-",
      source: "remaining",
    });
  });

  (analysisSummary.blockedImpact?.topBlockedIssues ?? []).forEach((issue) => {
    evidenceMap.set(issue.jiraKey, {
      key: issue.jiraKey,
      summary: issue.jiraSummary,
      displayLabel:
        issue.displayLabel || createDisplayLabel(issue.jiraKey, issue.jiraSummary),
      priority: normalizePriority(issue.priority),
      status: issue.status || "-",
      source: "blocked",
      blockedCaseCount: issue.blockedCaseCount,
      affectedScopes: createBlockedScopeSummary(issue),
    });
  });

  return evidenceMap;
}

function inferTag(comment: string, evidence?: IssueEvidence): QaReviewTag {
  if (evidence && (evidence.source === "blocked" || BLOCKED_PATTERN.test(comment))) {
    return "조건부";
  }
  if (evidence && HIGH_PRIORITIES.has(evidence.priority)) {
    return "우선";
  }
  if (evidence?.priority === "Medium") {
    return "재검증";
  }
  if (evidence && LOW_PRIORITIES.has(evidence.priority)) {
    return "모니터링";
  }

  if (POLICY_PATTERN.test(comment)) {
    return "정책";
  }
  if (NEXT_EVENT_PATTERN.test(comment)) {
    return "후속";
  }
  if (MONITORING_PATTERN.test(comment)) {
    return "모니터링";
  }
  if (RETEST_PATTERN.test(comment)) {
    return "재검증";
  }

  return "재검증";
}

function getGenericIntent(comment: string, tag: QaReviewTag) {
  if (tag === "정책" || POLICY_PATTERN.test(comment)) return "policy";
  if (tag === "후속" || NEXT_EVENT_PATTERN.test(comment)) return "follow-up";
  if (tag === "모니터링" || MONITORING_PATTERN.test(comment)) return "monitoring";
  return "unclassified";
}

function getSortScore(tag: QaReviewTag, evidence?: IssueEvidence) {
  const priority = evidence?.priority ?? "";
  const isBlocked = evidence?.source === "blocked" || tag === "조건부";

  if (HIGH_PRIORITIES.has(priority)) return isBlocked ? 0 : 1;
  if (priority === "Medium") return isBlocked ? 3 : 2;
  if (LOW_PRIORITIES.has(priority)) return 4;
  if (tag === "정책") return 5;
  if (tag === "후속") return 6;
  if (tag === "모니터링") return 7;
  return 8;
}

function createGenericGroupTitle(item: QaReviewItem) {
  if (item.id.startsWith("generic:policy:")) {
    return `운영 정책 확정 이후 확인 항목 ${item.sourceCount}건`;
  }
  if (item.id.startsWith("generic:follow-up:")) {
    return `차기 이벤트 / 다음 업데이트 확인 항목 ${item.sourceCount}건`;
  }
  if (item.id.startsWith("generic:monitoring:")) {
    return `운영 모니터링 확인 항목 ${item.sourceCount}건`;
  }
  return `미분류 QA 코멘트 확인 항목 ${item.sourceCount}건`;
}

function createDisplayGenericGroupTitle(item: QaReviewItem) {
  if (item.id.startsWith("generic:policy:")) return createGenericGroupTitle(item);
  if (item.id.startsWith("generic:follow-up:")) return createGenericGroupTitle(item);
  if (item.id.startsWith("generic:monitoring:")) return createGenericGroupTitle(item);
  return `원문 확인 필요 QA 코멘트 ${item.sourceCount}건`;
}

// Legacy long descriptions are kept temporarily for comparison while the UI uses compact text.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createGenericGroupDescription(item: QaReviewItem) {
  if (item.id.startsWith("generic:policy:")) {
    return "정책 · 다국어 노출, 알림 발송, CTA 예약 상태, 운영툴 결과 공개 조건은 정책 확정 이후 또는 차기 일정에서 확인 대상으로 분리되었습니다.";
  }
  if (item.id.startsWith("generic:follow-up:")) {
    return "후속 · 차기 이벤트 또는 다음 업데이트 시점의 노출/알림 조건 확인 예정 항목입니다.";
  }
  if (item.id.startsWith("generic:monitoring:")) {
    return "모니터링 · Low Known Issue 성격의 운영 관찰 항목입니다.";
  }
  return "재검증 · 연결 이슈나 정책/후속 분류가 확인되지 않은 코멘트입니다. 상세 QA 데이터에서 원문 기준으로 확인이 필요합니다.";
}

function createActionTitle({
  tag,
  evidence,
  comment,
}: {
  tag: QaReviewTag;
  evidence?: IssueEvidence;
  comment: string;
}) {
  if (!evidence) return "";

  const label = evidence.displayLabel;
  const signalText = `${evidence.summary} ${comment}`.toLowerCase();

  if (tag === "조건부") {
    if (signalText.includes("알림") || signalText.includes("우선순위")) {
      return `${label} 영향으로 알림 우선순위/정렬 검증이 보류된 상태입니다.`;
    }
    if (signalText.includes("sync") || signalText.includes("동기화") || signalText.includes("읽음")) {
      return `${label} 해소 후 상태 동기화 검증 재개 예정입니다.`;
    }
    if (signalText.includes("cta") || signalText.includes("이벤트") || signalText.includes("노출")) {
      return `${label} 영향으로 관련 CTA 검증이 보류된 상태입니다.`;
    }
    return `${label} 해소 후 관련 검증 재개 예정입니다.`;
  }

  if (tag === "모니터링") {
    return `${label}는 운영 모니터링 항목으로 관리됩니다.`;
  }
  if (tag === "정책") {
    return `${label} 관련 운영 정책 조건 확인 대상으로 분리되었습니다.`;
  }
  if (tag === "후속") {
    return `${label}는 후속 일정 확인 예정 항목입니다.`;
  }

  if (signalText.includes("sync") || signalText.includes("동기화") || signalText.includes("읽음")) {
    return `${label}는 수정 반영 후 상태 동기화 재검증 예정입니다.`;
  }
  if (signalText.includes("기기") || signalText.includes("알림 설정")) {
    return `${label}는 수정 반영 후 기기별 알림 설정 반영 재검증 예정입니다.`;
  }
  if (signalText.includes("운영툴") || signalText.includes("반영")) {
    return `${label}는 수정 반영 후 운영툴 반영 흐름 재검증 예정입니다.`;
  }
  if (signalText.includes("알림")) {
    return `${label}는 수정 반영 후 알림 처리 흐름 재검증 예정입니다.`;
  }
  if (signalText.includes("cta") || signalText.includes("이벤트")) {
    return `${label}는 수정 반영 후 이벤트/CTA 흐름 재검증 예정입니다.`;
  }

  return `${label}는 수정 반영 후 관련 검증 재개 예정입니다.`;
}

function createDescription({
  tag,
  evidence,
  sourceCount,
}: {
  tag: QaReviewTag;
  evidence?: IssueEvidence;
  sourceCount: number;
}) {
  if (!evidence) {
    return `${tag} · QA 코멘트 ${sourceCount}건`;
  }

  if (evidence.source === "blocked") {
    const blockedText = evidence.blockedCaseCount
      ? `Blocked TC ${evidence.blockedCaseCount}건`
      : `QA 코멘트 ${sourceCount}건`;
    const scopeText =
      evidence.affectedScopes && evidence.affectedScopes.length > 0
        ? ` · ${evidence.affectedScopes.join(" / ")}`
        : "";
    return `${evidence.priority} · ${evidence.status} · ${blockedText}${scopeText}`;
  }

  return `${evidence.priority} · ${evidence.status} · QA 코멘트 ${sourceCount}건`;
}

function createCompactGenericGroupDescription(item: QaReviewItem) {
  if (item.id.startsWith("generic:policy:")) {
    return `정책 확정 후 확인 대상으로 분리된 다국어, 알림, CTA, 운영툴 조건입니다. QA 코멘트 ${item.sourceCount}건 기준`;
  }
  if (item.id.startsWith("generic:follow-up:")) {
    return `후속 일정에서 확인 예정인 노출/알림 조건입니다. QA 코멘트 ${item.sourceCount}건 기준`;
  }
  if (item.id.startsWith("generic:monitoring:")) {
    return `운영 관찰 범위로 분리된 Low Known Issue 성격의 항목입니다. QA 코멘트 ${item.sourceCount}건 기준`;
  }
  return `상세 QA 데이터의 원문 기준으로 후속 확인 범위를 검토해야 하는 항목입니다. QA 코멘트 ${item.sourceCount}건 기준`;
}

function createReviewItem({
  id,
  comment,
  evidence,
  preferredTag,
}: {
  id: string;
  comment: string;
  evidence?: IssueEvidence;
  preferredTag?: QaReviewTag;
}): QaReviewItem & { evidence?: IssueEvidence } {
  const tag = preferredTag ?? inferTag(comment, evidence);

  return {
    id,
    title: createActionTitle({ tag, evidence, comment }),
    description: "",
    tag,
    priority: evidence?.priority ?? "",
    status: evidence?.status ?? "",
    sourceLabel: evidence?.source ?? "comment",
    sortScore: getSortScore(tag, evidence),
    sourceCount: 1,
    hasLinkedIssue: Boolean(evidence),
    evidence,
  };
}

function mergeReviewItem(
  itemMap: Map<string, QaReviewItem & { evidence?: IssueEvidence }>,
  item: QaReviewItem & { evidence?: IssueEvidence }
) {
  const existing = itemMap.get(item.id);

  if (!existing) {
    itemMap.set(item.id, item);
    return;
  }

  const sourceCount = existing.sourceCount + item.sourceCount;
  const winner = item.sortScore < existing.sortScore ? item : existing;

  itemMap.set(item.id, {
    ...winner,
    sourceCount,
  });
}

export function buildQaReviewItems(
  analysisSummary: NonNullable<AnalysisSummaryState>
): QaReviewItem[] {
  const evidenceMap = buildIssueEvidenceMap(analysisSummary);
  const itemMap = new Map<string, QaReviewItem & { evidence?: IssueEvidence }>();

  (analysisSummary.blockedImpact?.topBlockedIssues ?? []).forEach((issue) => {
    const evidence = evidenceMap.get(issue.jiraKey);

    mergeReviewItem(
      itemMap,
      createReviewItem({
        id: `${issue.jiraKey}:조건부`,
        comment: issue.affectedTestCases[0]?.comment || issue.displayLabel,
        evidence,
        preferredTag: "조건부",
      })
    );
  });

  analysisSummary.qaFollowUps.forEach((comment) => {
    const jiraKeys = extractJiraKeys(comment);

    if (jiraKeys.length === 0) {
      const tag = inferTag(comment);
      const intent = getGenericIntent(comment, tag);

      mergeReviewItem(
        itemMap,
        createReviewItem({
          id: `generic:${intent}:${tag}`,
          comment,
          preferredTag: tag,
        })
      );
      return;
    }

    jiraKeys.forEach((jiraKey) => {
      const evidence = evidenceMap.get(jiraKey);
      const tag = inferTag(comment, evidence);

      mergeReviewItem(
        itemMap,
        createReviewItem({
          id: `${jiraKey}:${tag}`,
          comment,
          evidence,
          preferredTag: tag,
        })
      );
    });
  });

  return Array.from(itemMap.values())
    .map(({ evidence, ...item }) => {
      if (!evidence) {
        return {
          ...item,
          title: createDisplayGenericGroupTitle(item),
          description: createCompactGenericGroupDescription(item),
        };
      }

      return {
        ...item,
        description: createDescription({
          tag: item.tag,
          evidence,
          sourceCount: item.sourceCount,
        }),
      };
    })
    .sort(
      (first, second) =>
        first.sortScore - second.sortScore ||
        first.title.localeCompare(second.title)
    );
}

export function getDefaultQaReviewItems({
  analysisSummary,
  items,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  items: QaReviewItem[];
}) {
  const remainingPriority = analysisSummary.qaIssueOverview?.remaining?.prioritySummary;
  const highCount =
    (remainingPriority?.Highest ?? 0) + (remainingPriority?.High ?? 0);
  const mediumCount = remainingPriority?.Medium ?? 0;
  const genericItems = items.filter((item) => !item.hasLinkedIssue);
  let linkedItems: QaReviewItem[];

  if (highCount > 0) {
    linkedItems = items.filter(
      (item) => item.hasLinkedIssue && HIGH_PRIORITIES.has(item.priority)
    );
  } else if (mediumCount > 0) {
    linkedItems = items.filter(
      (item) => item.hasLinkedIssue && item.priority === "Medium"
    );
  } else {
    linkedItems = items.filter(
      (item) => item.hasLinkedIssue && LOW_PRIORITIES.has(item.priority)
    );
  }

  return [...linkedItems, ...genericItems].sort(
    (first, second) =>
      first.sortScore - second.sortScore ||
      first.title.localeCompare(second.title)
  );
}

export function classifyQaComment(
  comment: string,
  analysisSummary: NonNullable<AnalysisSummaryState>
): QaReviewMetadata {
  const evidenceMap = buildIssueEvidenceMap(analysisSummary);
  const jiraKey = extractJiraKeys(comment)[0] ?? "";
  const evidence = jiraKey ? evidenceMap.get(jiraKey) : undefined;
  const tag = inferTag(comment, evidence);

  return {
    tag,
    linkedIssueLabel: evidence?.displayLabel ?? "-",
    priority: evidence?.priority ?? "-",
    status: evidence?.status ?? "-",
  };
}
