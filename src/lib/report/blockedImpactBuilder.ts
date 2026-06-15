import {
  getRecordValue,
  JIRA_PRIORITY_FIELDS,
  JIRA_STATUS_FIELDS,
  normalizeJiraStatus,
} from "@/lib/jira";
import type {
  BlockedImpactItem,
  BlockedImpactSummary,
  BlockedImpactTestCase,
  BlockedImpactWarning,
  CsvRecord,
} from "@/types/report";

type SelectedTestSheet = {
  title: string;
};

const JIRA_KEY_PATTERN = /[A-Z]+-\d+/g;
const QA_CHECK_FIELDS = [
  "QA Check",
  "QA 체크",
  "QA체크",
  "Check",
  "Result",
  "결과",
  "상태",
];
const TEST_CASE_JIRA_FIELDS = [
  "JIRA",
  "Jira",
  "Jira Key",
  "Jira key",
  "Jira Issue",
  "Jira 이슈",
  "Jira 키",
  "이슈",
  "이슈 키",
];
const TEST_CASE_COMMENT_FIELDS = [
  "Comment",
  "Comments",
  "QA Comment",
  "QA 코멘트",
  "코멘트",
  "비고",
  "협의사항",
  "메모",
];
const TEST_CASE_TID_FIELDS = ["TID", "TC ID", "TCID", "ID", "케이스 ID"];
const TEST_CASE_CATEGORY_1_FIELDS = [
  "Category1",
  "Category 1",
  "카테고리1",
  "대분류",
];
const TEST_CASE_CATEGORY_2_FIELDS = [
  "Category2",
  "Category 2",
  "카테고리2",
  "중분류",
];
const TEST_CASE_CATEGORY_3_FIELDS = [
  "Category3",
  "Category 3",
  "카테고리3",
  "소분류",
];
const TEST_CASE_ITEM_FIELDS = [
  "Item",
  "Test Item",
  "TC",
  "Test Case",
  "테스트 항목",
  "검증 항목",
  "항목",
];
const JIRA_KEY_FIELDS = ["Key", "키", "이슈 키", "Issue key"];
const JIRA_SUMMARY_FIELDS = ["Summary", "요약", "제목"];
const JIRA_VERSION_FIELDS = [
  "Version",
  "Versions",
  "Fix Version",
  "Fix versions",
  "Fix Version/s",
  "FixVersions",
  "Target Version",
  "Target version",
  "Release Version",
  "릴리즈 버전",
  "버전",
  "대상 버전",
  "수정 버전",
  "영향 버전",
];
const RESOLVED_OR_EXCLUDED_STATUSES = new Set(
  [
    "완료",
    "닫음",
    "QA승인",
    "버그아님",
    "중복이슈",
    "기획의도",
    "기획변경",
    "배포완료",
    "Excluded",
    "Done",
    "Resolved",
    "Closed",
    "Duplicate",
    "Won't Fix",
    "Not a Bug",
  ].map(normalizeJiraStatus)
);
const PRIORITY_ORDER: Record<string, number> = {
  Highest: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Lowest: 4,
};

function isBlockedQaCheck(record: CsvRecord) {
  return getRecordValue(record, QA_CHECK_FIELDS).trim().toLowerCase() === "blocked";
}

function extractJiraKeys(...values: string[]) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => value.match(JIRA_KEY_PATTERN) ?? [])
        .map((key) => key.trim().toUpperCase())
    )
  );
}

function createAffectedTestCase(
  record: CsvRecord,
  sheetTitle: string
): BlockedImpactTestCase {
  return {
    tid: getRecordValue(record, TEST_CASE_TID_FIELDS),
    sheetTitle,
    category1: getRecordValue(record, TEST_CASE_CATEGORY_1_FIELDS),
    category2: getRecordValue(record, TEST_CASE_CATEGORY_2_FIELDS),
    category3: getRecordValue(record, TEST_CASE_CATEGORY_3_FIELDS),
    item: getRecordValue(record, TEST_CASE_ITEM_FIELDS),
    comment: getRecordValue(record, TEST_CASE_COMMENT_FIELDS),
  };
}

function createIssueLookup(jiraRecords: CsvRecord[]) {
  return new Map(
    jiraRecords
      .map((record) => {
        const jiraKey = getRecordValue(record, JIRA_KEY_FIELDS).toUpperCase();

        if (!jiraKey) return null;

        return [
          jiraKey,
          {
            jiraKey,
            jiraSummary: getRecordValue(record, JIRA_SUMMARY_FIELDS),
            priority: getRecordValue(record, JIRA_PRIORITY_FIELDS),
            status: getRecordValue(record, JIRA_STATUS_FIELDS),
            version: getRecordValue(record, JIRA_VERSION_FIELDS),
          },
        ] as const;
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  );
}

function createWarning(item: BlockedImpactItem): BlockedImpactWarning | null {
  if (!RESOLVED_OR_EXCLUDED_STATUSES.has(normalizeJiraStatus(item.status))) {
    return null;
  }

  return {
    jiraKey: item.jiraKey,
    jiraSummary: item.jiraSummary,
    displayLabel: item.displayLabel,
    status: item.status,
    reason:
      "Blocked 원인으로 연결된 Jira가 완료/배포완료/QA승인/비버그 계열 상태입니다.",
    blockedCaseCount: item.blockedCaseCount,
  };
}

export function createBlockedImpactSummary({
  parsedTestSheetDataList,
  selectedTestSheets,
  jiraRecords,
}: {
  parsedTestSheetDataList: CsvRecord[][];
  selectedTestSheets: SelectedTestSheet[];
  jiraRecords: CsvRecord[];
}): BlockedImpactSummary {
  const issueLookup = createIssueLookup(jiraRecords);
  const impactMap = new Map<string, BlockedImpactItem>();
  let totalBlockedCases = 0;

  parsedTestSheetDataList.forEach((records, sheetIndex) => {
    const sheetTitle = selectedTestSheets[sheetIndex]?.title ?? `Test Sheet ${sheetIndex + 1}`;

    records.forEach((record) => {
      if (!isBlockedQaCheck(record)) return;

      totalBlockedCases += 1;

      const comment = getRecordValue(record, TEST_CASE_COMMENT_FIELDS);
      const jiraValue = getRecordValue(record, TEST_CASE_JIRA_FIELDS);
      const jiraKeys = extractJiraKeys(jiraValue, comment);

      jiraKeys.forEach((jiraKey) => {
        const issue = issueLookup.get(jiraKey);

        if (!issue?.jiraSummary) return;

        const affectedTestCase = createAffectedTestCase(record, sheetTitle);
        const current =
          impactMap.get(jiraKey) ??
          {
            jiraKey,
            jiraSummary: issue.jiraSummary,
            displayLabel: `${jiraKey}(${issue.jiraSummary})`,
            priority: issue.priority,
            status: issue.status,
            version: issue.version,
            blockedCaseCount: 0,
            affectedSheets: [],
            affectedCategories: [],
            affectedTestCases: [],
          };

        current.blockedCaseCount += 1;
        current.affectedSheets = Array.from(
          new Set([...current.affectedSheets, sheetTitle])
        );
        current.affectedCategories = Array.from(
          new Set(
            [
              ...current.affectedCategories,
              affectedTestCase.category1,
              affectedTestCase.category2,
              affectedTestCase.category3,
            ].filter(Boolean)
          )
        );
        current.affectedTestCases.push(affectedTestCase);
        impactMap.set(jiraKey, current);
      });
    });
  });

  const topBlockedIssues = Array.from(impactMap.values()).sort(
    (first, second) =>
      (PRIORITY_ORDER[first.priority] ?? 99) -
        (PRIORITY_ORDER[second.priority] ?? 99) ||
      second.blockedCaseCount - first.blockedCaseCount ||
      first.jiraKey.localeCompare(second.jiraKey)
  );
  const warnings = topBlockedIssues
    .map(createWarning)
    .filter((warning): warning is BlockedImpactWarning => Boolean(warning));

  return {
    totalBlockedCases,
    blockedCauseIssueCount: topBlockedIssues.length,
    topBlockedIssues,
    warnings,
  };
}
