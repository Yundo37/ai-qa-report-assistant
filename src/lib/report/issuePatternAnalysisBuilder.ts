import { QA_SCOPE_FIELDS } from "@/lib/report/qaAnalysisContext";
import { getJiraTargetVersionValues } from "@/lib/report/versionInference";
import {
  getRecordValue,
  JIRA_CREATED_FIELDS,
  JIRA_PRIORITY_FIELDS,
  JIRA_STATUS_FIELDS,
} from "@/lib/jira";
import { extractBaseVersion, getVersionIssueSortScore } from "@/lib/report/versionIssueSummaryBuilder";
import type {
  CsvRecord,
  IssuePatternAnalysisItem,
  IssuePatternSource,
  RemainingIssue,
} from "@/types/report";

const JIRA_ISSUE_PATTERN_SUMMARY_FIELDS = [
  "Summary",
  "Issue Summary",
  "Title",
  "Subject",
  "요약",
  "제목",
];
const JIRA_ISSUE_PATTERN_KEY_FIELDS = ["Key", "Issue key", "이슈 키", "키"];

const ISSUE_PATTERN_GROUPS = [
  {
    name: "상태 변경 / 상태 반영 / 상태 동기화",
    keywords: [
      "상태 변경",
      "상태 반영",
      "상태 동기화",
      "상태값",
      "자동 변경",
      "종료 상태",
      "변경 지연",
    ],
  },
  {
    name: "데이터 반영 지연 / 저장 후 리스트 갱신",
    keywords: [
      "데이터 반영",
      "반영 지연",
      "저장 후",
      "리스트 갱신",
      "목록 갱신",
      "새로고침",
      "refresh",
    ],
  },
  {
    name: "노출 시점 / CTA 노출 유지",
    keywords: [
      "노출 시점",
      "노출 유지",
      "CTA",
      "버튼 노출",
      "미노출",
      "노출되지",
      "노출 불일치",
    ],
  },
  {
    name: "알림 중복 발송 / 우선순위 처리",
    keywords: [
      "중복 발송",
      "중복 노출",
      "알림 중복",
      "우선순위",
      "우선 노출",
      "정렬",
      "알림 처리",
    ],
  },
  {
    name: "결과 상태 반영 / 결과 알림 지연",
    keywords: [
      "결과 상태",
      "결과 반영",
      "결과 알림",
      "결과값",
      "결과 노출",
      "결과 갱신",
    ],
  },
  {
    name: "다국어 / 문구 표시",
    keywords: [
      "다국어",
      "번역",
      "문구",
      "텍스트",
      "메시지",
      "label",
      "copy",
    ],
  },
] satisfies Array<{ name: string; keywords: string[] }>;

export function createIssuePatternSources(
  records: CsvRecord[]
): IssuePatternSource[] {
  return records
    .map((record) => ({
      key: getRecordValue(record, JIRA_ISSUE_PATTERN_KEY_FIELDS),
      summary: getRecordValue(record, JIRA_ISSUE_PATTERN_SUMMARY_FIELDS),
      priority: getRecordValue(record, JIRA_PRIORITY_FIELDS),
      status: getRecordValue(record, JIRA_STATUS_FIELDS),
      version: getJiraTargetVersionValues(record).join(", "),
    }))
    .filter((source) => source.summary)
    .slice(0, 80);
}

function normalizePatternText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function patternKeywordMatches(text: string, keyword: string) {
  const normalizedText = normalizePatternText(text);
  const normalizedKeyword = normalizePatternText(keyword);

  return text.toLowerCase().includes(keyword.toLowerCase()) ||
    normalizedText.includes(normalizedKeyword);
}

const ISSUE_PATTERN_TREND_DAY_MS = 24 * 60 * 60 * 1000;

type IssuePatternTrendBucket = {
  label: string;
  title: string;
  basis: "rc" | "version" | "period";
  values?: string[];
  start?: Date;
  end?: Date;
};

function parseIssuePatternDateValue(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  const normalizedValue = trimmedValue
    .replace(/\./g, "-")
    .replace("T", " ")
    .replace(/\s+/g, " ");
  const dateTimeMatch = normalizedValue.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/
  );

  if (dateTimeMatch) {
    const [, year, month, day, hour = "0", minute = "0"] = dateTimeMatch;
    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedTime = Date.parse(trimmedValue);

  return Number.isNaN(parsedTime) ? null : new Date(parsedTime);
}

function formatIssuePatternTrendDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeIssuePatternTrendValue(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function extractIssuePatternRcLabel(value: string) {
  const match = value.match(/\brc\s*0*(\d+)\b/i);

  return match ? `RC${Number(match[1])}` : "";
}

function getIssuePatternRecordRcLabels(record: CsvRecord) {
  return Array.from(
    new Set(
      getJiraTargetVersionValues(record)
        .map(extractIssuePatternRcLabel)
        .filter(Boolean)
    )
  );
}

function getIssuePatternRecordVersionLabels(record: CsvRecord) {
  return Array.from(
    new Set(
      getJiraTargetVersionValues(record)
        .map(extractBaseVersion)
        .filter(Boolean)
    )
  );
}

function createCategoricalIssuePatternTrendBuckets(
  labels: string[],
  basis: "rc" | "version"
): IssuePatternTrendBucket[] {
  const sortedLabels = Array.from(new Set(labels)).sort((first, second) => {
    if (basis === "rc") {
      return (
        Number(first.match(/\d+/)?.[0] ?? 0) -
          Number(second.match(/\d+/)?.[0] ?? 0) ||
        first.localeCompare(second)
      );
    }

    return (
      getVersionIssueSortScore(first) - getVersionIssueSortScore(second) ||
      first.localeCompare(second)
    );
  });

  if (sortedLabels.length > 6) {
    const recentLabels = sortedLabels.slice(-5);
    const earlierLabels = sortedLabels.slice(0, -5);

    return [
      {
        label: "Earlier",
        title: `Earlier ${basis === "rc" ? "RC" : "Version"}: ${earlierLabels.join(", ")}`,
        basis,
        values: earlierLabels,
      },
      ...recentLabels.map((label) => ({
        label,
        title: label,
        basis,
        values: [label],
      })),
    ];
  }

  return sortedLabels.map((label) => ({
    label,
    title: label,
    basis,
    values: [label],
  }));
}

function createPeriodIssuePatternTrendBuckets(
  jiraRecords: CsvRecord[],
  options?: {
    startDateTime?: string;
    endDateTime?: string | null;
  }
): IssuePatternTrendBucket[] {
  const recordDates = jiraRecords
    .map((record) => parseIssuePatternDateValue(getRecordValue(record, JIRA_CREATED_FIELDS)))
    .filter((date): date is Date => Boolean(date))
    .sort((first, second) => first.getTime() - second.getTime());
  const optionStart = options?.startDateTime
    ? parseIssuePatternDateValue(options.startDateTime)
    : null;
  const optionEnd = options?.endDateTime
    ? parseIssuePatternDateValue(options.endDateTime)
    : null;
  const startDate = optionStart ?? recordDates[0] ?? null;
  const endDate = optionEnd ?? recordDates[recordDates.length - 1] ?? null;

  if (!startDate || !endDate || endDate.getTime() < startDate.getTime()) {
    return [];
  }

  const rangeMs = Math.max(1, endDate.getTime() - startDate.getTime() + 1);
  const daySpan = Math.max(1, Math.ceil(rangeMs / ISSUE_PATTERN_TREND_DAY_MS));
  const bucketCount = Math.min(6, Math.max(1, daySpan <= 6 ? daySpan : 5));
  const bucketSizeMs = rangeMs / bucketCount;

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(startDate.getTime() + bucketSizeMs * index);
    const bucketEnd =
      index === bucketCount - 1
        ? new Date(endDate)
        : new Date(startDate.getTime() + bucketSizeMs * (index + 1) - 1);

    return {
      label: `P${index + 1}`,
      title: `${formatIssuePatternTrendDate(bucketStart)} ~ ${formatIssuePatternTrendDate(bucketEnd)}`,
      basis: "period",
      start: bucketStart,
      end: bucketEnd,
    };
  });
}

function createIssuePatternTrendBuckets(
  jiraRecords: CsvRecord[],
  options?: {
    startDateTime?: string;
    endDateTime?: string | null;
  }
): IssuePatternTrendBucket[] {
  const rcLabels = jiraRecords.flatMap(getIssuePatternRecordRcLabels);

  if (rcLabels.length > 0) {
    return createCategoricalIssuePatternTrendBuckets(rcLabels, "rc");
  }

  const versionLabels = jiraRecords.flatMap(getIssuePatternRecordVersionLabels);

  if (versionLabels.length > 0) {
    return createCategoricalIssuePatternTrendBuckets(versionLabels, "version");
  }

  return createPeriodIssuePatternTrendBuckets(jiraRecords, options);
}

function getIssuePatternTrendBucketIndexes(
  record: CsvRecord,
  buckets: IssuePatternTrendBucket[]
) {
  const basis = buckets[0]?.basis;

  if (basis === "rc" || basis === "version") {
    const labels =
      basis === "rc"
        ? getIssuePatternRecordRcLabels(record)
        : getIssuePatternRecordVersionLabels(record);
    const normalizedLabels = new Set(labels.map(normalizeIssuePatternTrendValue));

    return buckets
      .map((bucket, index) =>
        bucket.values?.some((value) =>
          normalizedLabels.has(normalizeIssuePatternTrendValue(value))
        )
          ? index
          : -1
      )
      .filter((index) => index >= 0);
  }

  const createdDate = parseIssuePatternDateValue(
    getRecordValue(record, JIRA_CREATED_FIELDS)
  );

  if (!createdDate) return [];

  const bucketIndex = buckets.findIndex(
    (bucket) =>
      bucket.start &&
      bucket.end &&
      createdDate.getTime() >= bucket.start.getTime() &&
      createdDate.getTime() <= bucket.end.getTime()
  );

  return bucketIndex >= 0 ? [bucketIndex] : [];
}

export function createIssuePatternAnalysis(
  jiraRecords: CsvRecord[],
  remainingIssues: RemainingIssue[],
  qaFollowUps: string[],
  options?: {
    startDateTime?: string;
    endDateTime?: string | null;
  }
): IssuePatternAnalysisItem[] {
  const trendBuckets = createIssuePatternTrendBuckets(jiraRecords, options);
  const patternMap = new Map<
    string,
    {
      keywords: Set<string>;
      count: number;
      versions: Set<string>;
      sourceTypes: Set<string>;
      trendCounts: number[];
    }
  >();
  const addText = (
    text: string,
    sourceType: string,
    version = "",
    trendBucketIndexes: number[] = []
  ) => {
    if (!text.trim()) return;

    ISSUE_PATTERN_GROUPS.forEach((group) => {
      const matchedKeywords = group.keywords.filter((keyword) =>
        patternKeywordMatches(text, keyword)
      );

      if (matchedKeywords.length === 0) return;

      const current =
        patternMap.get(group.name) ??
        {
          keywords: new Set<string>(),
          count: 0,
          versions: new Set<string>(),
          sourceTypes: new Set<string>(),
          trendCounts: Array.from({ length: trendBuckets.length }, () => 0),
        };

      current.count += 1;
      matchedKeywords.forEach((keyword) => current.keywords.add(keyword));
      if (version) current.versions.add(version);
      current.sourceTypes.add(sourceType);
      Array.from(new Set(trendBucketIndexes)).forEach((trendBucketIndex) => {
        current.trendCounts[trendBucketIndex] =
          (current.trendCounts[trendBucketIndex] ?? 0) + 1;
      });
      patternMap.set(group.name, current);
    });
  };

  jiraRecords.forEach((record) => {
    const summaryText = getRecordValue(record, JIRA_ISSUE_PATTERN_SUMMARY_FIELDS);
    const categoryText = QA_SCOPE_FIELDS.map((fieldName) => record[fieldName] ?? "")
      .filter(Boolean)
      .join(" ");
    const versions = getJiraTargetVersionValues(record)
      .map(extractBaseVersion)
      .filter(Boolean);
    const version = Array.from(new Set(versions)).join(", ");
    const trendBucketIndexes = getIssuePatternTrendBucketIndexes(
      record,
      trendBuckets
    );

    addText(
      [summaryText, categoryText].filter(Boolean).join(" "),
      "jiraSummary",
      version,
      trendBucketIndexes
    );
  });

  remainingIssues.forEach((issue) => {
    addText(issue.summary, "remainingIssue", extractBaseVersion(issue.version));
  });

  qaFollowUps.forEach((comment) => {
    addText(comment, "qaComment");
  });

  return Array.from(patternMap.entries())
    .map(([name, pattern]) => ({
      name,
      keywords: Array.from(pattern.keywords).slice(0, 6),
      count: pattern.count,
      versions: Array.from(pattern.versions)
        .sort(
          (first, second) =>
            getVersionIssueSortScore(first) - getVersionIssueSortScore(second) ||
            first.localeCompare(second)
        )
        .slice(0, 6),
      sourceTypes: Array.from(pattern.sourceTypes),
      trendBasis: trendBuckets[0]?.basis ?? "period",
      trend: trendBuckets.map((bucket, index) => ({
        label: bucket.label,
        title: bucket.title,
        count: pattern.trendCounts[index] ?? 0,
      })),
    }))
    .filter((pattern) => pattern.count >= 2)
    .sort(
      (first, second) =>
        second.versions.length - first.versions.length ||
        second.count - first.count ||
        first.name.localeCompare(second.name)
    )
    .slice(0, 5);
}
