"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AiAnalysisPreview } from "@/components/report/AiAnalysisPreview";
import { FeatureReportPreview } from "@/components/report/FeatureReportPreview";
import { OverallFeatureSummaryCard } from "@/components/report/OverallFeatureSummaryCard";
import { OverallReportPreview } from "@/components/report/OverallReportPreview";
import { OverallQaSummaryCard } from "@/components/report/OverallQaSummaryCard";
import { QaFollowUpList } from "@/components/report/QaFollowUpList";
import { RemainingIssueList } from "@/components/report/RemainingIssueList";
import { SpreadsheetPreview } from "@/components/report/SpreadsheetPreview";
import { SummaryCard } from "@/components/report/SummaryCard";
import { VersionIssueSummaryCard } from "@/components/report/VersionIssueSummaryCard";
import { parseJiraIssueSheetCsv, parseTestSheetCsv } from "@/lib/csv";
import {
  fetchGoogleSheetCsv,
  fetchSpreadsheetInfo,
  isGoogleSpreadsheetUrl,
  parseGoogleSheetUrl,
} from "@/lib/googleSheet";
import {
  createFieldValueSample,
  createJiraFilteredSummary,
  createQaIssueOverviewSummary,
  createRemainingIssues,
  createRcProgressSummary,
  filterJiraIssuesByLabels,
  filterJiraIssuesByPeriod,
  getRecordValue,
  getJiraStatus,
  JIRA_CREATED_FIELDS,
  JIRA_LABEL_FIELDS,
  JIRA_PRIORITY_FIELDS,
  JIRA_STATUS_FIELDS,
} from "@/lib/jira";
import {
  createFieldSummaryByFields,
  createQaSummary,
  extractQaFollowUps,
} from "@/lib/qaSummary";
import {
  createFeatureReportPreviewLines,
  createOverallReportPreviewLinesUtf8,
} from "@/lib/reportPreview";
import type {
  AnalysisSummaryState,
  CountSummary,
  CsvRecord,
  IssuePatternAnalysisItem,
  LabelMatchMode,
  MessageState,
  OverallQaSummary,
  IssuePatternSource,
  QaAnalysisContext,
  QaIssueOverviewSummary,
  RcProgressSummary,
  RemainingIssue,
  ReportType,
  SheetInput,
  SpreadsheetInfo,
  SpreadsheetSheetInfo,
  VersionIssueSummaryItem,
} from "@/types/report";

const MAX_TEST_SHEETS = 50;
const MAX_JIRA_LABELS = 8;
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  index.toString().padStart(2, "0")
);
const JIRA_TARGET_VERSION_FIELDS = [
  "Version",
  "Versions",
  "Fix Version",
  "Fix versions",
  "Fix Version/s",
  "FixVersions",
  "Fix version",
  "Fix version/s",
  "Affects Version",
  "Affects versions",
  "Affects Version/s",
  "Affected Version",
  "Affected versions",
  "버전",
  "대상 버전",
  "대상버전",
  "수정 버전",
  "수정버전",
  "영향 버전",
  "영향버전",
  "릴리즈",
  "릴리즈 버전",
  "RC",
  "RC Version",
  "RC 버전",
  "RC 버전",
  "Target Version",
  "Target version",
  "Release",
  "Release Version",
  "릴리즈",
  "릴리즈 버전",
  "버전",
  "대상 버전",
  "대상버전",
  "수정 버전",
  "수정버전",
  "영향 버전",
  "영향버전",
];
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

type QuickScenarioPreset = {
  featureName: string;
  version: string;
  rcVersion: string;
  spreadsheetUrl: string;
  testSheetTitles: string[];
  jiraSheetTitle: string;
  testSheetGroups?: Array<{
    spreadsheetUrl: string;
    testSheetTitles: string[];
    jiraSheetTitle?: string;
  }>;
  startDate: string;
  startHour: string;
  startMinute: string;
  endDate: string;
  endHour: string;
  endMinute: string;
  labels: string[];
  labelMatchMode: LabelMatchMode;
};

const MAIN_FEATURE_SCENARIO = {
  featureName: "커뮤니티 미션 이벤트",
  version: "2.0.0",
  rcVersion: "RC2",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1PjBH8lwT8gRvWW_Gbio07CmlYjibOzFPdPXyHgonfr8/edit?gid=1971538612#gid=1971538612",
  testSheetTitles: [
    "메인피쳐1 TC",
    "메인피쳐2 TC",
    "메인피쳐3 TC",
    "메인피쳐4 TC",
  ],
  jiraSheetTitle: "지라 데이터",
  startDate: "2026-05-01",
  startHour: "09",
  startMinute: "30",
  endDate: "2026-05-11",
  endHour: "20",
  endMinute: "00",
  labels: ["커뮤니티미션"],
  labelMatchMode: "ANY",
} satisfies QuickScenarioPreset;
const SUB_FEATURE_SCENARIO = {
  featureName: "알림 우선순위 정책 개선",
  version: "2.0.0",
  rcVersion: "RC3",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1gl3yDCtZn71XeFEa3JSyOu7UrMluLO3x8ezN9Ag96eI/edit?gid=982602155#gid=982602155",
  testSheetTitles: ["서브피쳐1 TC", "서브피쳐2 TC"],
  jiraSheetTitle: "지라 데이터",
  startDate: "2026-05-08",
  startHour: "19",
  startMinute: "00",
  endDate: "2026-05-13",
  endHour: "13",
  endMinute: "00",
  labels: ["알림"],
  labelMatchMode: "ANY",
} satisfies QuickScenarioPreset;
const STABLE_DUMMY_SCENARIO = {
  featureName: "더미 결과 : 안정",
  version: "",
  rcVersion: "",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1KrAeYbhgiTpp4v-9ibcdKnTGkoyI_jk9qfGhLwOe68Y/edit?gid=846682949#gid=846682949",
  testSheetTitles: ["Dummy_TC_안정"],
  jiraSheetTitle: "Dummy_Jira_안정",
  startDate: "2026-05-20",
  startHour: "00",
  startMinute: "00",
  endDate: "2026-05-22",
  endHour: "17",
  endMinute: "00",
  labels: ["안정", "더미"],
  labelMatchMode: "ALL",
} satisfies QuickScenarioPreset;
const CAUTION_DUMMY_SCENARIO = {
  featureName: "더미 결과 : 주의 필요",
  version: "",
  rcVersion: "",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1KrAeYbhgiTpp4v-9ibcdKnTGkoyI_jk9qfGhLwOe68Y/edit?gid=2000456795#gid=2000456795",
  testSheetTitles: ["Dummy_TC_주의필요"],
  jiraSheetTitle: "Dummy_Jira_주의필요",
  startDate: "2026-05-20",
  startHour: "00",
  startMinute: "00",
  endDate: "",
  endHour: "00",
  endMinute: "00",
  labels: ["주의필요", "더미"],
  labelMatchMode: "ALL",
} satisfies QuickScenarioPreset;
const OVERALL_SCENARIO = {
  featureName: "A프로젝트 v2.0.0",
  version: "2.0.0",
  rcVersion: "RC3",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1PjBH8lwT8gRvWW_Gbio07CmlYjibOzFPdPXyHgonfr8/edit?gid=1971538612#gid=1971538612",
  testSheetTitles: [
    "메인피쳐1 TC",
    "메인피쳐2 TC",
    "메인피쳐3 TC",
    "메인피쳐4 TC",
    "지라 데이터",
  ],
  jiraSheetTitle: "지라 데이터",
  testSheetGroups: [
    {
      spreadsheetUrl:
        "https://docs.google.com/spreadsheets/d/1PjBH8lwT8gRvWW_Gbio07CmlYjibOzFPdPXyHgonfr8/edit?gid=1971538612#gid=1971538612",
      testSheetTitles: [
        "메인피쳐1 TC",
        "메인피쳐2 TC",
        "메인피쳐3 TC",
        "메인피쳐4 TC",
        "지라 데이터",
      ],
      jiraSheetTitle: "지라 데이터",
    },
    {
      spreadsheetUrl:
        "https://docs.google.com/spreadsheets/d/1gl3yDCtZn71XeFEa3JSyOu7UrMluLO3x8ezN9Ag96eI/edit?gid=982602155#gid=982602155",
      testSheetTitles: ["서브피쳐1 TC", "서브피쳐2 TC"],
    },
  ],
  startDate: "2026-05-01",
  startHour: "09",
  startMinute: "30",
  endDate: "2026-05-13",
  endHour: "13",
  endMinute: "00",
  labels: [],
  labelMatchMode: "ANY",
} satisfies QuickScenarioPreset;
const QUICK_SCENARIO_PRESETS = {
  메인피쳐: MAIN_FEATURE_SCENARIO,
  서브피쳐: SUB_FEATURE_SCENARIO,
  "더미:안정": STABLE_DUMMY_SCENARIO,
  "더미:주의필요": CAUTION_DUMMY_SCENARIO,
} satisfies Record<string, QuickScenarioPreset>;
const OVERALL_QUICK_SCENARIO_PRESETS = {
  "전체 결과": OVERALL_SCENARIO,
} satisfies Record<string, QuickScenarioPreset>;

function logSummary(title: string, summary: CountSummary) {
  console.log(title);
  Object.entries(summary).forEach(([label, count]) => {
    console.log(`- ${label}: ${count}`);
  });
}

function logQaSummary(title: string, records: CsvRecord[], includeRows = false) {
  console.log(title);
  if (includeRows) console.log(`- Rows: ${records.length}`);
  Object.entries(createQaSummary(records)).forEach(([label, count]) => {
    console.log(`- ${label}: ${count}`);
  });
}

function normalizeMinute(minute: string) {
  return minute.trim().padStart(2, "0");
}

function buildAnalysisDateTime(date: string, hour: string, minute: string) {
  if (!date.trim()) return null;
  return `${date} ${hour}:${normalizeMinute(minute)}`;
}

function createReportTitle(featureName: string) {
  return `${featureName.trim()} QA 결과 리포트`;
}

function isJiraSheetTitle(title: string) {
  return /jira|지라/i.test(title);
}

function buildGoogleSpreadsheetTabUrl(spreadsheetId: string, gid: string) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${gid}`;
}

function normalizeRcVersion(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "";
  if (/^\d+$/.test(trimmedValue)) return `RC${trimmedValue}`;

  return trimmedValue.replace(/\brc\s*(\d+)\b/gi, "RC$1");
}

function normalizeTargetVersion(value: string) {
  return normalizeRcVersion(value).replace(/\s+/g, " ").trim();
}

function createTargetVersionDisplay({
  version,
  rcVersion,
  inferredTargetVersion,
}: {
  version: string;
  rcVersion: string;
  inferredTargetVersion: string;
}) {
  const normalizedVersion = version.trim();
  const normalizedRcVersion = normalizeRcVersion(rcVersion);
  const userTargetVersion = [normalizedVersion, normalizedRcVersion]
    .filter(Boolean)
    .join(" ");

  if (userTargetVersion) {
    return userTargetVersion;
  }

  if (inferredTargetVersion) {
    return `${inferredTargetVersion} (Auto inferred)`;
  }

  return "Version TBD";
}

function inferTargetVersionFromJiraIssues(records: CsvRecord[]) {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    JIRA_TARGET_VERSION_FIELDS.forEach((fieldName) => {
      const rawValue = record[fieldName]?.trim();

      if (!rawValue) return;

      rawValue
        .split(/[;,\n]/)
        .map(normalizeTargetVersion)
        .filter(Boolean)
        .forEach((value) => {
          counts.set(value, (counts.get(value) ?? 0) + 1);
        });
    });
  });

  return (
    Array.from(counts.entries()).sort(
      (first, second) =>
        second[1] - first[1] || first[0].localeCompare(second[0])
    )[0]?.[0] ?? ""
  );
}

function getJiraTargetVersionValues(record: CsvRecord) {
  return JIRA_TARGET_VERSION_FIELDS.flatMap((fieldName) =>
    (record[fieldName] ?? "")
      .split(/[;,\n]/)
      .map(normalizeTargetVersion)
      .filter(Boolean)
  );
}

function getVersionIssueSortScore(version: string) {
  if (version === "기타 / 버전 없음") {
    return Number.MAX_SAFE_INTEGER;
  }

  const normalizedVersion = version.toLowerCase().replace(/\s+/g, "");
  const versionScore =
    normalizedVersion
      .match(/\d+(?:\.\d+)*/)?.[0]
      ?.split(".")
      .map(Number)
      .reduce((score, number) => score * 100 + number, 0) ?? 0;
  const rcScore = Number(normalizedVersion.match(/rc(\d+)/)?.[1] ?? 0);

  return versionScore * 100 + rcScore;
}

function extractBaseVersion(value: string) {
  return value.match(/\d+(?:\.\d+)+/)?.[0] ?? "";
}

function createOverallQaSummary(records: CsvRecord[]): OverallQaSummary {
  return records.reduce<OverallQaSummary>(
    (summary, record) => {
      const qaCheck = record["QA Check"]?.trim().toLowerCase() ?? "";
      const normalizedQaCheck = qaCheck.replace(/[\s_]+/g, "");

      if (!qaCheck) {
        return summary;
      }

      summary.Total += 1;

      if (qaCheck === "pass") summary.Pass += 1;
      if (qaCheck === "fail") summary.Fail += 1;
      if (qaCheck === "blocked") summary.Blocked += 1;
      if (normalizedQaCheck === "nextevent") summary.NextEvent += 1;
      if (normalizedQaCheck === "n/a" || normalizedQaCheck === "na") {
        summary["N/A"] += 1;
      }

      return summary;
    },
    {
      Total: 0,
      Pass: 0,
      Fail: 0,
      Blocked: 0,
      NextEvent: 0,
      "N/A": 0,
    }
  );
}

function createEmptyVersionIssueSummaryItem(version: string): VersionIssueSummaryItem {
  return {
    version,
    highHighest: 0,
    medium: 0,
    low: 0,
    total: 0,
  };
}

function addPriorityToVersionIssueSummary(
  item: VersionIssueSummaryItem,
  priority: string
) {
  item.total += 1;

  if (priority === "Highest" || priority === "High") {
    item.highHighest += 1;
  } else if (priority === "Medium") {
    item.medium += 1;
  } else if (priority === "Low" || priority === "Lowest") {
    item.low += 1;
  }
}

function createVersionIssueSummary(
  records: CsvRecord[]
): VersionIssueSummaryItem[] {
  const groupedSummary = new Map<string, VersionIssueSummaryItem>();

  records.forEach((record) => {
    const versionValues = Array.from(new Set(getJiraTargetVersionValues(record)));
    const targetVersions =
      versionValues.length > 0 ? versionValues : ["기타 / 버전 없음"];
    const priority = getRecordValue(record, JIRA_PRIORITY_FIELDS);

    targetVersions.forEach((version) => {
      const item =
        groupedSummary.get(version) ?? createEmptyVersionIssueSummaryItem(version);

      addPriorityToVersionIssueSummary(item, priority);
      groupedSummary.set(version, item);
    });
  });

  return Array.from(groupedSummary.values()).sort(
    (first, second) =>
      getVersionIssueSortScore(first.version) -
        getVersionIssueSortScore(second.version) ||
      first.version.localeCompare(second.version)
  );
}

function createBaseVersionIssueSummary(
  records: CsvRecord[]
): VersionIssueSummaryItem[] {
  const groupedSummary = new Map<string, VersionIssueSummaryItem>();
  const debugVersionSamples: Array<{
    rawValues: string[];
    normalizedBaseVersions: string[];
  }> = [];

  records.forEach((record) => {
    const createdValue = getRecordValue(record, JIRA_CREATED_FIELDS);

    if (!createdValue) return;

    const rawVersionValues = getJiraTargetVersionValues(record);
    const baseVersions = Array.from(
      new Set(
        rawVersionValues.map(extractBaseVersion).filter(Boolean)
      )
    );

    if (debugVersionSamples.length < 20 && rawVersionValues.length > 0) {
      debugVersionSamples.push({
        rawValues: rawVersionValues,
        normalizedBaseVersions: baseVersions,
      });
    }

    if (baseVersions.length === 0) return;

    const priority = getRecordValue(record, JIRA_PRIORITY_FIELDS);

    baseVersions.forEach((version) => {
      const item =
        groupedSummary.get(version) ?? createEmptyVersionIssueSummaryItem(version);

      addPriorityToVersionIssueSummary(item, priority);
    groupedSummary.set(version, item);
    });
  });

  console.log("Overall Version Summary parsedJiraIssueData count:", records.length);
  console.log(
    "Overall Version Summary raw version values sample:",
    debugVersionSamples.map((sample) => sample.rawValues)
  );
  console.log(
    "Overall Version Summary normalized base version values sample:",
    debugVersionSamples.flatMap((sample) =>
      sample.rawValues.map((rawValue) => ({
        rawValue,
        baseVersion: extractBaseVersion(rawValue) || "No parsed base version",
      }))
    )
  );
  console.log(
    "Overall Version Summary grouped version summary:",
    Array.from(groupedSummary.values())
  );

  return Array.from(groupedSummary.values())
    .sort(
      (first, second) =>
        getVersionIssueSortScore(first.version) -
          getVersionIssueSortScore(second.version) ||
        first.version.localeCompare(second.version)
    )
    .slice(-5);
}

function createIssuePatternSources(records: CsvRecord[]): IssuePatternSource[] {
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

function createIssuePatternAnalysis(
  jiraRecords: CsvRecord[],
  remainingIssues: RemainingIssue[],
  qaFollowUps: string[]
): IssuePatternAnalysisItem[] {
  const patternMap = new Map<
    string,
    {
      keywords: Set<string>;
      count: number;
      versions: Set<string>;
      sourceTypes: Set<string>;
    }
  >();
  const addText = (text: string, sourceType: string, version = "") => {
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
        };

      current.count += 1;
      matchedKeywords.forEach((keyword) => current.keywords.add(keyword));
      if (version) current.versions.add(version);
      current.sourceTypes.add(sourceType);
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

    addText([summaryText, categoryText].filter(Boolean).join(" "), "jiraSummary", version);
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

const QA_SCOPE_FIELDS = [
  "Title",
  "Feature",
  "Category_1",
  "Category_2",
  "Category_3",
  "Category 1",
  "Category 2",
  "Category 3",
  "대분류",
  "중분류",
  "소분류",
];
const QA_PATTERN_FIELDS = [
  "Summary",
  "Test Case",
  "TC",
  "Case",
  "Description",
  "Expected Result",
  "Category_1",
  "Category_2",
  "Category_3",
  "대분류",
  "중분류",
  "소분류",
];

function getRecordValueByFields(record: CsvRecord, fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    const value = record[fieldName]?.trim();

    if (value) return value;
  }

  return "";
}

function createTopValues(values: string[], limit: number) {
  const counts = values.reduce<Map<string, number>>((summary, value) => {
    const normalizedValue = value.trim().replace(/\s+/g, " ");

    if (!normalizedValue) return summary;

    summary.set(normalizedValue, (summary.get(normalizedValue) ?? 0) + 1);
    return summary;
  }, new Map());

  return Array.from(counts.entries())
    .sort(
      (first, second) =>
        second[1] - first[1] || first[0].localeCompare(second[0])
    )
    .slice(0, limit)
    .map(([value]) => value);
}

function createQaAnalysisContext(
  records: CsvRecord[],
  testSheetTitles: string[]
): QaAnalysisContext {
  const scopeKeywords = records.flatMap((record) =>
    QA_SCOPE_FIELDS.map((fieldName) => record[fieldName]?.trim() ?? "").filter(
      Boolean
    )
  );
  const failPatternValues = records
    .filter((record) => record["QA Check"]?.trim().toLowerCase() === "fail")
    .map((record) => getRecordValueByFields(record, QA_PATTERN_FIELDS))
    .filter(Boolean);
  const blockedPatternValues = records
    .filter((record) => record["QA Check"]?.trim().toLowerCase() === "blocked")
    .map((record) => getRecordValueByFields(record, QA_PATTERN_FIELDS))
    .filter(Boolean);

  return {
    testSheetTitles,
    scopeKeywords: createTopValues(scopeKeywords, 8),
    failPatterns: createTopValues(failPatternValues, 8),
    blockedPatterns: createTopValues(blockedPatternValues, 5),
  };
}

function openDatePicker(input: HTMLInputElement) {
  if (typeof input.showPicker === "function") {
    input.showPicker();
    return;
  }
  input.focus();
}

function createFallbackRcProgress(
  analysisSummary: Exclude<AnalysisSummaryState, null>
): RcProgressSummary {
  return {
    rcLabel: "현재 RC (legacy fallback)",
    newIssues: analysisSummary.jiraMatchedRows,
    fixedIssues: analysisSummary.jiraFiltered.Resolved ?? 0,
    resolvedIssues: analysisSummary.jiraFiltered.Resolved ?? 0,
    remainingIssues: analysisSummary.jiraFiltered.Remaining ?? 0,
    reopenedIssues: analysisSummary.jiraStatus["다시열림"] ?? 0,
    items: [
      {
        rc: "현재 RC (legacy fallback)",
        newIssues: analysisSummary.jiraMatchedRows,
        fixedIssues: analysisSummary.jiraFiltered.Resolved ?? 0,
        resolvedIssues: analysisSummary.jiraFiltered.Resolved ?? 0,
        remainingIssues: analysisSummary.jiraFiltered.Remaining ?? 0,
        reopenedIssues: analysisSummary.jiraStatus["다시열림"] ?? 0,
        prioritySummary: {
          Highest: analysisSummary.jiraPriority.Highest ?? 0,
          High: analysisSummary.jiraPriority.High ?? 0,
          Medium: analysisSummary.jiraPriority.Medium ?? 0,
          Low: analysisSummary.jiraPriority.Low ?? 0,
          Lowest: analysisSummary.jiraPriority.Lowest ?? 0,
        },
      },
    ],
  };
}

function createFallbackQaIssueOverview(
  analysisSummary: Exclude<AnalysisSummaryState, null>
): QaIssueOverviewSummary {
  const remainingPrioritySummary = {
    Highest: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Lowest: 0,
  };

  analysisSummary.remainingIssues.forEach((issue) => {
    if (issue.priority in remainingPrioritySummary) {
      remainingPrioritySummary[
        issue.priority as keyof typeof remainingPrioritySummary
      ] += 1;
    }
  });

  return {
    created: {
      total: analysisSummary.jiraMatchedRows,
      prioritySummary: {
        Highest: analysisSummary.jiraPriority.Highest ?? 0,
        High: analysisSummary.jiraPriority.High ?? 0,
        Medium: analysisSummary.jiraPriority.Medium ?? 0,
        Low: analysisSummary.jiraPriority.Low ?? 0,
        Lowest: analysisSummary.jiraPriority.Lowest ?? 0,
      },
    },
    resolved: {
      total: analysisSummary.jiraFiltered.Resolved ?? 0,
      prioritySummary: {
        Highest: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Lowest: 0,
      },
    },
    remaining: {
      total: analysisSummary.jiraFiltered.Remaining ?? 0,
      prioritySummary: remainingPrioritySummary,
    },
  };
}

export default function Home() {
  const [reportType, setReportType] = useState<ReportType>("FEATURE");
  const [reportTitle, setReportTitle] = useState("");
  const [reportVersion, setReportVersion] = useState("");
  const [reportRcVersion, setReportRcVersion] = useState("");
  const [testSheets, setTestSheets] = useState<SheetInput[]>([
    { url: "", isEditing: true },
  ]);
  const [jiraIssueSheet, setJiraIssueSheet] = useState<SheetInput>({
    url: "",
    isEditing: true,
  });
  const [autoLinkedJiraSheet, setAutoLinkedJiraSheet] = useState<{
    spreadsheetId: string;
    gid: string;
    title: string;
  } | null>(null);
  const [jiraAnalysisStartDate, setJiraAnalysisStartDate] = useState("");
  const [jiraAnalysisStartHour, setJiraAnalysisStartHour] = useState("00");
  const [jiraAnalysisStartMinute, setJiraAnalysisStartMinute] =
    useState("00");
  const [jiraAnalysisEndDate, setJiraAnalysisEndDate] = useState("");
  const [jiraAnalysisEndHour, setJiraAnalysisEndHour] = useState("00");
  const [jiraAnalysisEndMinute, setJiraAnalysisEndMinute] = useState("00");
  const [jiraLabels, setJiraLabels] = useState([""]);
  const [labelMatchMode, setLabelMatchMode] =
    useState<LabelMatchMode>("ANY");
  const [message, setMessage] = useState<MessageState>(null);
  const [analysisSummary, setAnalysisSummary] =
    useState<AnalysisSummaryState>(null);
  const [testSheetMetadataList, setTestSheetMetadataList] = useState<
    Array<SpreadsheetInfo | null>
  >([null]);
  const [selectedTestSheetGids, setSelectedTestSheetGids] = useState<
    string[][]
  >([[]]);
  const [expandedTestSheetSelections, setExpandedTestSheetSelections] =
    useState<boolean[]>([false]);
  const [applyingQuickScenario, setApplyingQuickScenario] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState("");
  const [isCreatingResultSheet, setIsCreatingResultSheet] = useState(false);
  const [resultSheetUrl, setResultSheetUrl] = useState("");
  const [resultSheetMessage, setResultSheetMessage] =
    useState<MessageState>(null);
  const analysisSummaryRef = useRef<HTMLElement | null>(null);
  const aiAnalysisRequestIdRef = useRef(0);
  const didMountInputResetRef = useRef(false);

  useEffect(() => {
    if (!analysisSummary) return;
    analysisSummaryRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [analysisSummary]);

  const clearAiAnalysisResult = useCallback(() => {
    aiAnalysisRequestIdRef.current += 1;
    setAiAnalysisText("");
    setIsAiAnalyzing(false);
  }, []);

  useEffect(() => {
    if (!didMountInputResetRef.current) {
      didMountInputResetRef.current = true;
      return;
    }

    clearAiAnalysisResult();
  }, [
    reportType,
    reportTitle,
    reportVersion,
    reportRcVersion,
    testSheets,
    selectedTestSheetGids,
    jiraIssueSheet,
    jiraAnalysisStartDate,
    jiraAnalysisStartHour,
    jiraAnalysisStartMinute,
    jiraAnalysisEndDate,
    jiraAnalysisEndHour,
    jiraAnalysisEndMinute,
    jiraLabels,
    labelMatchMode,
    clearAiAnalysisResult,
  ]);

  const logSpreadsheetInfo = (spreadsheetMetadata: SpreadsheetInfo) => {
    console.log("Spreadsheet Info");
    console.log(`- Title: ${spreadsheetMetadata.title}`);
    console.log("- Sheets:");
    spreadsheetMetadata.sheets.forEach((sheet) => {
      console.log(`  - ${sheet.title}`);
    });
  };

  const resetReportState = () => {
    setMessage(null);
    setAnalysisSummary(null);
    clearAiAnalysisResult();
    setResultSheetMessage(null);
    setResultSheetUrl("");
  };

  const resetReportInputs = () => {
    setReportTitle("");
    setReportVersion("");
    setReportRcVersion("");
    setTestSheets([{ url: "", isEditing: true }]);
    setTestSheetMetadataList([null]);
    setSelectedTestSheetGids([[]]);
    setExpandedTestSheetSelections([false]);
    setJiraIssueSheet({ url: "", isEditing: true });
    setAutoLinkedJiraSheet(null);
    setJiraAnalysisStartDate("");
    setJiraAnalysisStartHour("00");
    setJiraAnalysisStartMinute("00");
    setJiraAnalysisEndDate("");
    setJiraAnalysisEndHour("00");
    setJiraAnalysisEndMinute("00");
    setJiraLabels([""]);
    setLabelMatchMode("ANY");
    setIsGenerating(false);
    setIsAiAnalyzing(false);
    setIsCreatingResultSheet(false);
  };

  const handleReportTypeChange = (nextReportType: ReportType) => {
    if (reportType === nextReportType) return;

    setReportType(nextReportType);
    resetReportInputs();
    resetReportState();
  };

  const applyQuickScenario = async (
    scenarioName: string,
    scenario: QuickScenarioPreset
  ) => {
    if (applyingQuickScenario) return;

    setApplyingQuickScenario(scenarioName);
    resetReportState();
    resetReportInputs();

    try {
      const scenarioGroups = scenario.testSheetGroups ?? [
        {
          spreadsheetUrl: scenario.spreadsheetUrl,
          testSheetTitles: scenario.testSheetTitles,
          jiraSheetTitle: scenario.jiraSheetTitle,
        },
      ];
      const loadedGroups = await Promise.all(
        scenarioGroups.map(async (group) => {
          const parsedSheet = parseGoogleSheetUrl(group.spreadsheetUrl);

          if (!parsedSheet.spreadsheetId) {
            throw new Error(
              `${scenarioName} Spreadsheet URL에서 spreadsheetId를 찾을 수 없습니다.`
            );
          }

          const spreadsheetMetadata = await fetchSpreadsheetInfo(
            parsedSheet.spreadsheetId
          );
          const selectedGids = spreadsheetMetadata.sheets
            .filter((sheet) => group.testSheetTitles.includes(sheet.title))
            .map((sheet) => sheet.gid);

          return {
            group,
            parsedSheet,
            spreadsheetMetadata,
            selectedGids,
          };
        })
      );
      const jiraGroup =
        loadedGroups.find(
          ({ group, spreadsheetMetadata }) =>
            group.jiraSheetTitle &&
            spreadsheetMetadata.sheets.some(
              (sheet) => sheet.title === group.jiraSheetTitle
            )
        ) ?? loadedGroups[0];
      const jiraSheet =
        jiraGroup?.spreadsheetMetadata.sheets.find(
          (sheet) => sheet.title === jiraGroup.group.jiraSheetTitle
        ) ??
        jiraGroup?.spreadsheetMetadata.sheets.find((sheet) =>
          isJiraSheetTitle(sheet.title)
        );

      setReportTitle(scenario.featureName);
      setReportVersion(scenario.version);
      setReportRcVersion(scenario.rcVersion);
      setTestSheets(
        loadedGroups.map(({ group }) => ({
          url: group.spreadsheetUrl,
          isEditing: false,
        }))
      );
      setTestSheetMetadataList(
        loadedGroups.map(({ spreadsheetMetadata }) => spreadsheetMetadata)
      );
      setSelectedTestSheetGids(loadedGroups.map(({ selectedGids }) => selectedGids));
      setExpandedTestSheetSelections(loadedGroups.map(() => false));
      setJiraAnalysisStartDate(scenario.startDate);
      setJiraAnalysisStartHour(scenario.startHour);
      setJiraAnalysisStartMinute(scenario.startMinute);
      setJiraAnalysisEndDate(scenario.endDate);
      setJiraAnalysisEndHour(scenario.endHour);
      setJiraAnalysisEndMinute(scenario.endMinute);
      setJiraLabels(scenario.labels);
      setLabelMatchMode(scenario.labelMatchMode);
      loadedGroups.forEach(({ spreadsheetMetadata }) =>
        logSpreadsheetInfo(spreadsheetMetadata)
      );

      if (jiraGroup && jiraSheet) {
        const jiraSpreadsheetId = jiraGroup.parsedSheet.spreadsheetId!;

        setJiraIssueSheet({
          url: buildGoogleSpreadsheetTabUrl(
            jiraSpreadsheetId,
            jiraSheet.gid
          ),
          isEditing: false,
        });
        setAutoLinkedJiraSheet({
          spreadsheetId: jiraSpreadsheetId,
          gid: jiraSheet.gid,
          title: jiraSheet.title,
        });
      } else {
        setJiraIssueSheet({ url: "", isEditing: true });
      }
    } catch (error) {
      console.error("Quick Scenario Apply Error:", error);
      setMessage({
        type: "error",
        title: "Quick Scenario 적용에 실패했습니다.",
        items: [
          error instanceof Error
            ? error.message
            : `${scenarioName} 시나리오를 불러오는 중 오류가 발생했습니다.`,
        ],
      });
    } finally {
      setApplyingQuickScenario("");
    }
  };

  const loadTestSheetMetadata = async (index: number, url: string) => {
    const parsedSheet = parseGoogleSheetUrl(url);
    if (!parsedSheet.spreadsheetId) return null;

    try {
      const spreadsheetMetadata = await fetchSpreadsheetInfo(
        parsedSheet.spreadsheetId
      );
      const defaultSelectedGids =
        parsedSheet.gid &&
        spreadsheetMetadata.sheets.some((sheet) => sheet.gid === parsedSheet.gid)
          ? [parsedSheet.gid]
          : [];

      setTestSheetMetadataList((currentMetadataList) => {
        const updatedMetadataList = [...currentMetadataList];
        updatedMetadataList[index] = spreadsheetMetadata;
        return updatedMetadataList;
      });
      setSelectedTestSheetGids((currentSelectedGids) => {
        const updatedSelectedGids = [...currentSelectedGids];
        updatedSelectedGids[index] = defaultSelectedGids;
        return updatedSelectedGids;
      });

      logSpreadsheetInfo(spreadsheetMetadata);
      return spreadsheetMetadata;
    } catch (error) {
      console.error(`Spreadsheet Info Fetch Error - Test Sheet ${index + 1}:`, error);
      return null;
    }
  };

  const toggleSelectedTestSheetGid = (
    index: number,
    sheet: SpreadsheetSheetInfo
  ) => {
    const parsedSheet = parseGoogleSheetUrl(testSheets[index]?.url ?? "");

    if (isJiraSheetTitle(sheet.title) && parsedSheet.spreadsheetId) {
      setSelectedTestSheetGids((currentSelectedGids) => {
        const updatedSelectedGids = [...currentSelectedGids];
        const currentGids = updatedSelectedGids[index] ?? [];
        updatedSelectedGids[index] = currentGids.filter(
          (selectedGid) => selectedGid !== sheet.gid
        );
        return updatedSelectedGids;
      });
      setJiraIssueSheet({
        url: buildGoogleSpreadsheetTabUrl(parsedSheet.spreadsheetId, sheet.gid),
        isEditing: false,
      });
      setAutoLinkedJiraSheet({
        spreadsheetId: parsedSheet.spreadsheetId,
        gid: sheet.gid,
        title: sheet.title,
      });
      return;
    }

    setSelectedTestSheetGids((currentSelectedGids) => {
      const updatedSelectedGids = [...currentSelectedGids];
      const currentGids = updatedSelectedGids[index] ?? [];
      updatedSelectedGids[index] = currentGids.includes(sheet.gid)
        ? currentGids.filter((selectedGid) => selectedGid !== sheet.gid)
        : [...currentGids, sheet.gid];
      return updatedSelectedGids;
    });
  };

  const getAutoLinkedJiraSheetForTestSheet = (url: string) => {
    const parsedSheet = parseGoogleSheetUrl(url);

    if (
      !parsedSheet.spreadsheetId ||
      autoLinkedJiraSheet?.spreadsheetId !== parsedSheet.spreadsheetId
    ) {
      return null;
    }

    return {
      gid: autoLinkedJiraSheet.gid,
      title: autoLinkedJiraSheet.title,
    };
  };

  const toggleTestSheetSelectionExpanded = (index: number) => {
    setExpandedTestSheetSelections((currentExpandedSelections) => {
      const updatedExpandedSelections = [...currentExpandedSelections];
      updatedExpandedSelections[index] = !updatedExpandedSelections[index];
      return updatedExpandedSelections;
    });
  };

  const closeTestSheetSelection = (index: number) => {
    setExpandedTestSheetSelections((currentExpandedSelections) => {
      const updatedExpandedSelections = [...currentExpandedSelections];
      updatedExpandedSelections[index] = false;
      return updatedExpandedSelections;
    });
  };

  const addTestSheet = () => {
    if (testSheets.length >= MAX_TEST_SHEETS) return;
    setTestSheets([...testSheets, { url: "", isEditing: true }]);
    setTestSheetMetadataList([...testSheetMetadataList, null]);
    setSelectedTestSheetGids([...selectedTestSheetGids, []]);
    setExpandedTestSheetSelections([...expandedTestSheetSelections, false]);
  };

  const updateTestSheet = (index: number, value: string) => {
    const updatedSheets = [...testSheets];
    updatedSheets[index].url = value;
    setTestSheets(updatedSheets);

    const updatedMetadataList = [...testSheetMetadataList];
    updatedMetadataList[index] = null;
    setTestSheetMetadataList(updatedMetadataList);

    const updatedSelectedGids = [...selectedTestSheetGids];
    updatedSelectedGids[index] = [];
    setSelectedTestSheetGids(updatedSelectedGids);

    const updatedExpandedSelections = [...expandedTestSheetSelections];
    updatedExpandedSelections[index] = false;
    setExpandedTestSheetSelections(updatedExpandedSelections);
  };

  const finishEditingTestSheet = (index: number) => {
    const updatedSheets = [...testSheets];
    if (updatedSheets[index].url.trim()) {
      updatedSheets[index].isEditing = false;
      void loadTestSheetMetadata(index, updatedSheets[index].url.trim());
    }
    setTestSheets(updatedSheets);
  };

  const editTestSheet = (index: number) => {
    const updatedSheets = [...testSheets];
    updatedSheets[index].isEditing = true;
    setTestSheets(updatedSheets);
  };

  const removeTestSheet = (index: number) => {
    setTestSheets(testSheets.filter((_, itemIndex) => itemIndex !== index));
    setTestSheetMetadataList(
      testSheetMetadataList.filter((_, itemIndex) => itemIndex !== index)
    );
    setSelectedTestSheetGids(
      selectedTestSheetGids.filter((_, itemIndex) => itemIndex !== index)
    );
    setExpandedTestSheetSelections(
      expandedTestSheetSelections.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const addJiraLabel = () => {
    if (jiraLabels.length >= MAX_JIRA_LABELS) return;
    setJiraLabels([...jiraLabels, ""]);
  };

  const updateJiraLabel = (index: number, value: string) => {
    const updatedLabels = [...jiraLabels];
    updatedLabels[index] = value;
    setJiraLabels(updatedLabels);
  };

  const removeJiraLabel = (index: number) => {
    setJiraLabels(jiraLabels.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateMinute = (value: string, setter: (minute: string) => void) => {
    if (!/^\d{0,2}$/.test(value)) return;
    if (value && Number(value) > 59) return;
    setter(value);
  };

  const runGenerateReport = async () => {
    clearAiAnalysisResult();
    setAnalysisSummary(null);
    setResultSheetMessage(null);
    setResultSheetUrl("");

    const validTestSheetEntries = testSheets
      .map((sheet, index) => ({ url: sheet.url.trim(), index }))
      .filter((sheet) => Boolean(sheet.url));
    const validTestSheetUrls = validTestSheetEntries.map((sheet) => sheet.url);
    const validJiraLabels =
      reportType === "FEATURE"
        ? jiraLabels.map((label) => label.trim()).filter(Boolean)
        : [];
    const jiraIssueSheetUrl = jiraIssueSheet.url.trim();
    const jiraAnalysisStartDateTime = buildAnalysisDateTime(
      jiraAnalysisStartDate,
      jiraAnalysisStartHour,
      jiraAnalysisStartMinute
    );
    const jiraAnalysisEndDateTime = buildAnalysisDateTime(
      jiraAnalysisEndDate,
      jiraAnalysisEndHour,
      jiraAnalysisEndMinute
    );
    const missingItems: string[] = [];

    const reportName = reportTitle.trim();
    const generatedReportTitle =
      reportType === "FEATURE"
        ? createReportTitle(reportName)
        : reportName || "Overall QA Report";

    if (!reportName) {
      missingItems.push(
        reportType === "FEATURE"
          ? "Feature Name을 입력해주세요."
          : "Overall Report Title을 입력해주세요."
      );
    }
    if (validTestSheetUrls.length === 0) {
      missingItems.push("Test Sheets URL을 1개 이상 입력해주세요.");
    }
    if (!jiraIssueSheetUrl) missingItems.push("Jira Issue Sheet URL을 입력해주세요.");
    if (!jiraAnalysisStartDateTime) {
      missingItems.push("Jira Analysis Start DateTime을 입력해주세요.");
    }

    if (missingItems.length > 0) {
      setMessage({
        type: "error",
        title: "입력값을 확인해주세요.",
        items: missingItems,
      });
      return;
    }

    const invalidFormatItems: string[] = [];
    validTestSheetUrls.forEach((url, index) => {
      if (!isGoogleSpreadsheetUrl(url)) {
        invalidFormatItems.push(
          `Test Sheet ${index + 1} URL이 Google Spreadsheet 형식이 아닙니다.`
        );
      }
    });
    if (!isGoogleSpreadsheetUrl(jiraIssueSheetUrl)) {
      invalidFormatItems.push(
        "Jira Issue Sheet URL이 Google Spreadsheet 형식이 아닙니다."
      );
    }

    if (invalidFormatItems.length > 0) {
      setMessage({
        type: "error",
        title: "Google Spreadsheet URL 형식을 확인해주세요.",
        items: invalidFormatItems,
      });
      return;
    }

    const parsedTestSheets = validTestSheetUrls.map((url) =>
      parseGoogleSheetUrl(url)
    );
    const parsedJiraIssueSheet = parseGoogleSheetUrl(jiraIssueSheetUrl);
    const invalidParsedItems: string[] = [];

    parsedTestSheets.forEach((sheet, index) => {
      if (!sheet.spreadsheetId || !sheet.gid) {
        invalidParsedItems.push(
          `Test Sheet ${index + 1} URL에서 spreadsheetId 또는 gid를 찾을 수 없습니다.`
        );
      }
    });
    if (!parsedJiraIssueSheet.spreadsheetId || !parsedJiraIssueSheet.gid) {
      invalidParsedItems.push(
        "Jira Issue Sheet URL에서 spreadsheetId 또는 gid를 찾을 수 없습니다."
      );
    }

    if (invalidParsedItems.length > 0) {
      setMessage({
        type: "error",
        title: "Google Spreadsheet URL 정보를 확인해주세요.",
        items: invalidParsedItems,
      });
      return;
    }

    const reportInput = {
      reportTitle: generatedReportTitle,
      featureName: reportName,
      reportType,
      testSheets: parsedTestSheets,
      jiraIssueSheet: parsedJiraIssueSheet,
      jiraAnalysisPeriod: {
        startDateTime: jiraAnalysisStartDateTime ?? "",
        endDateTime: jiraAnalysisEndDateTime,
      },
      jiraLabels: validJiraLabels,
      labelMatchMode,
    };

    console.log(
      `${reportType === "FEATURE" ? "Feature" : "Overall"} Report Input:`,
      reportInput
    );
    console.log(
      `Label Match Mode: ${
        labelMatchMode === "ANY" ? "ANY (OR)" : "ALL (AND)"
      }`
    );
    console.log(
      `Label Filter: ${
        reportType === "FEATURE" && validJiraLabels.length > 0
          ? "Applied"
          : "Skipped (Period only)"
      }`
    );

    const spreadsheetMetadataList = await Promise.all(
      parsedTestSheets.map(async (sheet, index) => {
        const originalIndex = validTestSheetEntries[index].index;
        const cachedMetadata = testSheetMetadataList[originalIndex];
        if (cachedMetadata) return cachedMetadata;
        if (!sheet.spreadsheetId) return null;
        return loadTestSheetMetadata(originalIndex, validTestSheetEntries[index].url);
      })
    );
    const selectedTestSheets = parsedTestSheets.flatMap((sheet, index) => {
      const originalIndex = validTestSheetEntries[index].index;
      const spreadsheetMetadata = spreadsheetMetadataList[index];
      const stateSelectedGids = selectedTestSheetGids[originalIndex] ?? [];
      const selectedGids =
        stateSelectedGids.length > 0 || testSheetMetadataList[originalIndex]
          ? stateSelectedGids
          : sheet.gid
            ? [sheet.gid]
            : [];

      if (!sheet.spreadsheetId) return [];
      const spreadsheetId = sheet.spreadsheetId;

      return selectedGids.map((gid) => ({
        spreadsheetId,
        gid,
        title:
          spreadsheetMetadata?.sheets.find((metadataSheet) => metadataSheet.gid === gid)
            ?.title || `Test Sheet ${index + 1}`,
      }));
    });

    if (selectedTestSheets.length === 0) {
      setMessage({
        type: "error",
        title: "입력값을 확인해주세요.",
        items: ["분석할 Test Sheet 탭을 선택해주세요."],
      });
      return;
    }

    let hasNoMatchingJiraIssues = false;

    try {
      const parsedTestSheetDataList: CsvRecord[][] = [];

      for (const [index, testSheet] of selectedTestSheets.entries()) {
        try {
          const testSheetCsvData = await fetchGoogleSheetCsv(
            testSheet.spreadsheetId,
            testSheet.gid
          );
          parsedTestSheetDataList.push(parseTestSheetCsv(testSheetCsvData));
        } catch (error) {
          console.error(`Test Sheet ${index + 1} 처리 실패:`, error);
          throw new Error(`Test Sheet ${index + 1} 처리에 실패했습니다.`);
        }
      }

      const allParsedTestSheetData = parsedTestSheetDataList.flat();

      console.log("Parsed Test Sheets Data Preview:", {
        totalSheets: selectedTestSheets.length,
        totalRows: allParsedTestSheetData.length,
        sample: allParsedTestSheetData.slice(0, 5),
      });
      const qaTotalSummary = createQaSummary(allParsedTestSheetData);
      const qaFollowUps = extractQaFollowUps(allParsedTestSheetData);
      const qaAnalysisContext = createQaAnalysisContext(
        allParsedTestSheetData,
        selectedTestSheets.map((sheet) => sheet.title)
      );
      const testSheetSummaries = parsedTestSheetDataList.map(
        (parsedTestSheetData, index) => ({
          title: selectedTestSheets[index].title,
          rows: parsedTestSheetData.length,
          summary: createQaSummary(parsedTestSheetData),
        })
      );

      logQaSummary("QA Summary - Total", allParsedTestSheetData);
      parsedTestSheetDataList.forEach((parsedTestSheetData, index) => {
        logQaSummary(
          `QA Summary - Test Sheet ${index + 1}`,
          parsedTestSheetData,
          true
        );
      });

      if (parsedJiraIssueSheet.spreadsheetId && parsedJiraIssueSheet.gid) {
        const jiraIssueCsvData = await fetchGoogleSheetCsv(
          parsedJiraIssueSheet.spreadsheetId,
          parsedJiraIssueSheet.gid
        );
        const parsedJiraIssueData = parseJiraIssueSheetCsv(jiraIssueCsvData);

        console.log("Parsed Jira Issue Total Rows:", parsedJiraIssueData.length);
        console.log(
          "Parsed Jira Issue Headers:",
          Object.keys(parsedJiraIssueData[0] ?? {})
        );
        console.log("Parsed Jira Issue Sample:", parsedJiraIssueData.slice(0, 5));
        console.log("Parsed Jira Issue Sheet Data Preview:", {
          totalRows: parsedJiraIssueData.length,
          sample: parsedJiraIssueData.slice(0, 5),
        });

        const periodFilteredJiraIssues = filterJiraIssuesByPeriod(
          parsedJiraIssueData,
          jiraAnalysisStartDateTime ?? "",
          jiraAnalysisEndDateTime
        );
        console.log(
          "Period Filtered Jira Issues Count:",
          periodFilteredJiraIssues.length
        );
        console.log(
          "Period Filtered Jira Issues Sample:",
          periodFilteredJiraIssues.slice(0, 5)
        );

        if (periodFilteredJiraIssues.length === 0) {
          console.log(
            "Jira Created Field Sample:",
            createFieldValueSample(parsedJiraIssueData, JIRA_CREATED_FIELDS)
          );
        }

        const filteredJiraIssues =
          validJiraLabels.length > 0
            ? filterJiraIssuesByLabels(
                periodFilteredJiraIssues,
                validJiraLabels,
                labelMatchMode
              )
            : periodFilteredJiraIssues;

        console.log("Applied Labels:", validJiraLabels);
        console.log(
          "Label Match Mode:",
          labelMatchMode === "ANY" ? "ANY (OR)" : "ALL (AND)"
        );
        console.log("Label Filtered Jira Issues Count:", filteredJiraIssues.length);
        console.log("Label Filtered Jira Issues Sample:", filteredJiraIssues.slice(0, 5));

        if (validJiraLabels.length > 0 && filteredJiraIssues.length === 0) {
          console.log(
            "Jira Label Field Sample:",
            createFieldValueSample(periodFilteredJiraIssues, JIRA_LABEL_FIELDS)
          );
        }

        console.log("Filtered Jira Issues:", {
          totalRows: filteredJiraIssues.length,
          sample: filteredJiraIssues.slice(0, 5),
        });
        console.log(
          "Filtered Jira Status Values:",
          Array.from(
            new Set(
              filteredJiraIssues
                .map(getJiraStatus)
                .filter((status): status is string => Boolean(status))
            )
          )
        );

        const jiraStatusSummary = createFieldSummaryByFields(
          filteredJiraIssues,
          JIRA_STATUS_FIELDS
        );
        const jiraPrioritySummary = createFieldSummaryByFields(
          filteredJiraIssues,
          JIRA_PRIORITY_FIELDS
        );
        const jiraFilteredSummary =
          createJiraFilteredSummary(filteredJiraIssues);
        const remainingIssues = createRemainingIssues(filteredJiraIssues);
        const qaIssueOverview = createQaIssueOverviewSummary(filteredJiraIssues);
        const inferredTargetVersion =
          inferTargetVersionFromJiraIssues(filteredJiraIssues);
        const overallQaSummary =
          reportType === "OVERALL"
            ? createOverallQaSummary(allParsedTestSheetData)
            : undefined;
        const overallTestSheets =
          reportType === "OVERALL"
            ? parsedTestSheetDataList.map((parsedTestSheetData, index) => ({
                title: selectedTestSheets[index].title,
                rows: parsedTestSheetData.length,
                summary: createOverallQaSummary(parsedTestSheetData),
              }))
            : undefined;
        const versionIssueSummary =
          reportType === "OVERALL"
            ? createVersionIssueSummary(filteredJiraIssues)
            : undefined;
        const versionSummary =
          reportType === "OVERALL"
            ? createBaseVersionIssueSummary(parsedJiraIssueData)
            : undefined;
        const issuePatternSources =
          reportType === "OVERALL"
            ? createIssuePatternSources(parsedJiraIssueData)
            : undefined;
        const issuePatternAnalysis =
          reportType === "OVERALL"
            ? createIssuePatternAnalysis(
                parsedJiraIssueData,
                remainingIssues,
                qaFollowUps
              )
            : undefined;
        const rcProgress = createRcProgressSummary(filteredJiraIssues, {
          reportTitle: reportInput.reportTitle,
          startDateTime: jiraAnalysisStartDateTime ?? "",
          endDateTime: jiraAnalysisEndDateTime,
        });
        const nextAnalysisSummary: Exclude<AnalysisSummaryState, null> = {
          reportType,
          resultSpreadsheetId: selectedTestSheets[0].spreadsheetId,
          qaTotal: qaTotalSummary,
          testSheets: testSheetSummaries,
          jiraFiltered: jiraFilteredSummary,
          jiraStatus: jiraStatusSummary,
          jiraPriority: jiraPrioritySummary,
          jiraMatchedRows: filteredJiraIssues.length,
          remainingIssues,
          rcProgress,
          qaIssueOverview,
          qaFollowUps,
          inferredTargetVersion,
          qaAnalysisContext,
          overallQaSummary,
          overallTestSheets,
          versionSummary,
          versionIssueSummary,
          issuePatternSources,
          issuePatternAnalysis,
        };
        console.log("Remaining Count Summary:", jiraFilteredSummary.Remaining ?? 0);
        console.log("Remaining Issue List Length:", remainingIssues.length);
        console.log("Remaining Issue Sample:", remainingIssues.slice(0, 5));
        console.log("QA Issue Overview Summary:", qaIssueOverview);
        console.log("QA Analysis Context:", qaAnalysisContext);
        console.log("Inferred Target Version:", inferredTargetVersion || "Version TBD");
        console.log("RC QA Progress Summary Immediately After Create:", rcProgress);
        console.log("Analysis Summary Payload Before setAnalysisSummary:", nextAnalysisSummary);
        hasNoMatchingJiraIssues = filteredJiraIssues.length === 0;

        logSummary("Jira Filtered Summary", jiraFilteredSummary);
        logSummary("Jira Status Summary", jiraStatusSummary);
        logSummary("Jira Priority Summary", jiraPrioritySummary);

        setAnalysisSummary(nextAnalysisSummary);
      }
    } catch (error) {
      console.error("Google Sheet Fetch Error:", error);
      setMessage({
        type: "error",
        title: "Google Sheet 데이터를 읽을 수 없습니다.",
        items: [
          "시트가 공개 상태인지 확인해주세요.",
          "링크 공유 설정을 확인해주세요.",
          "입력한 Test Sheet 또는 Jira Issue Sheet URL을 확인해주세요.",
        ],
      });
      return;
    }

    if (hasNoMatchingJiraIssues) {
      setMessage({
        type: "success",
        title: "Feature 관련 Jira Issue가 없습니다.",
        items: [
          reportType === "FEATURE"
            ? "Jira Reference Label이 Jira 시트의 Label 값과 일치하는지 확인해주세요."
            : "Jira Analysis Period 범위가 전체 이슈 생성일을 포함하는지 확인해주세요.",
          "Jira Analysis Period 범위가 너무 좁지 않은지 확인해주세요.",
          'Jira 시트의 "만듦" 컬럼 날짜 형식이 정상인지 확인해주세요.',
        ],
      });
    } else {
      setMessage({
        type: "success",
        title: "Feature Report 입력값과 Google Sheet 데이터 확인이 완료되었습니다.",
        items: [
          `${
            reportType === "FEATURE" ? "Feature Name" : "Overall Report"
          }: ${reportInput.featureName}`,
          `Test Sheets: ${reportInput.testSheets.length}개`,
          "Jira Issue Sheet: 입력 완료",
          reportType === "FEATURE"
            ? `Jira Reference Labels: ${reportInput.jiraLabels.length}개`
            : "Jira Reference Labels: 사용 안 함 (Period only)",
          "Console에서 Test Sheet / Jira Issue Sheet parsed data preview를 확인할 수 있습니다.",
        ],
      });
    }
  };

  const handleGenerateReport = async () => {
    if (isGenerating) return;
    clearAiAnalysisResult();
    setIsGenerating(true);
    try {
      await runGenerateReport();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiAnalysisTest = async () => {
    if (!analysisSummary || isAiAnalyzing) return;
    const requestId = aiAnalysisRequestIdRef.current + 1;
    aiAnalysisRequestIdRef.current = requestId;
    setIsAiAnalyzing(true);
    setAiAnalysisText("");

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qaSummary: analysisSummary.qaTotal,
          reportType: analysisSummary.reportType,
          jiraFilteredSummary: analysisSummary.jiraFiltered,
          jiraStatusSummary: analysisSummary.jiraStatus,
          jiraPrioritySummary: analysisSummary.jiraPriority,
          reportTitle: createReportTitle(reportTitle),
          testSheets: analysisSummary.testSheets,
          overallQaSummary: analysisSummary.overallQaSummary,
          overallTestSheets: analysisSummary.overallTestSheets,
          versionSummary: analysisSummary.versionSummary,
          versionIssueSummary: analysisSummary.versionIssueSummary,
          rcProgress: analysisSummary.rcProgress,
          qaIssueOverview: analysisSummary.qaIssueOverview,
          issuePatternSources: analysisSummary.issuePatternSources,
          issuePatternAnalysis: analysisSummary.issuePatternAnalysis,
          remainingIssues: analysisSummary.remainingIssues,
          qaFollowUps: analysisSummary.qaFollowUps,
          qaAnalysisContext: analysisSummary.qaAnalysisContext,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("AI Analysis Response Body:", errorBody);
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const data = (await response.json()) as { analysis?: string };
      if (aiAnalysisRequestIdRef.current === requestId) {
        setAiAnalysisText(data.analysis || "AI 분석 결과가 비어 있습니다.");
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      if (aiAnalysisRequestIdRef.current === requestId) {
        setAiAnalysisText("AI 분석을 불러오지 못했습니다.");
      }
    } finally {
      if (aiAnalysisRequestIdRef.current === requestId) {
        setIsAiAnalyzing(false);
      }
    }
  };

  const handleCreateResultSheet = async () => {
    if (!analysisSummary || isCreatingResultSheet) return;

    setIsCreatingResultSheet(true);
    setResultSheetMessage(null);
    setResultSheetUrl("");

    try {
      const rcProgressForRequest =
        analysisSummary.rcProgress ?? createFallbackRcProgress(analysisSummary);
      const qaIssueOverviewForRequest =
        analysisSummary.qaIssueOverview ??
        createFallbackQaIssueOverview(analysisSummary);
      const didUseRcProgressFallback = !analysisSummary.rcProgress;
      const createResultSheetPayload = {
        spreadsheetId: analysisSummary.resultSpreadsheetId,
        reportTitle:
          analysisSummary.reportType === "FEATURE"
            ? createReportTitle(reportTitle)
            : reportTitle.trim() || "Overall QA Report",
        version: reportVersion.trim(),
        rcVersion: reportRcVersion.trim(),
        qaStartDateTime: buildAnalysisDateTime(
          jiraAnalysisStartDate,
          jiraAnalysisStartHour,
          jiraAnalysisStartMinute
        ),
        qaEndDateTime: buildAnalysisDateTime(
          jiraAnalysisEndDate,
          jiraAnalysisEndHour,
          jiraAnalysisEndMinute
        ),
        qaSummary: analysisSummary.qaTotal,
        testSheets: analysisSummary.testSheets,
        jiraFilteredSummary: analysisSummary.jiraFiltered,
        jiraStatusSummary: analysisSummary.jiraStatus,
        jiraPrioritySummary: analysisSummary.jiraPriority,
        reportPreviewLines:
          analysisSummary.reportType === "FEATURE"
            ? createFeatureReportPreviewLines(analysisSummary)
            : createOverallReportPreviewLinesUtf8(analysisSummary),
        remainingIssues: analysisSummary.remainingIssues,
        rcProgress: rcProgressForRequest,
        qaIssueOverview: qaIssueOverviewForRequest,
        qaFollowUps: analysisSummary.qaFollowUps,
        overallTestSheets: analysisSummary.overallTestSheets,
        versionSummary: analysisSummary.versionSummary,
        versionIssueSummary: analysisSummary.versionIssueSummary,
        aiAnalysisText,
      };

      console.log(
        "Create Result Sheet rcProgress fallback used:",
        didUseRcProgressFallback
      );
      console.log(
        "Create Result Sheet Request Payload rcProgress:",
        createResultSheetPayload.rcProgress
      );
      console.log(
        "Create Result Sheet Request Payload qaIssueOverview:",
        createResultSheetPayload.qaIssueOverview
      );
      console.log("Create Result Sheet Request Payload:", createResultSheetPayload);

      const createResultSheetEndpoint =
        analysisSummary.reportType === "FEATURE"
          ? "/api/create-result-sheet"
          : "/api/create-overall-result-sheet";

      const response = await fetch(createResultSheetEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createResultSheetPayload),
      });

      const data = (await response.json()) as {
        sheetName?: string;
        sheetId?: number;
        spreadsheetId?: string;
        sheetUrl?: string;
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        console.error("Create Result Sheet Response Body:", data);
        throw new Error(data.error || "Result Sheet creation failed");
      }

      setResultSheetMessage({
        type: "success",
        title: "Result Sheet 생성이 완료되었습니다.",
        items: [`Sheet Name: ${data.sheetName ?? "-"}`],
      });
      setResultSheetUrl(data.sheetUrl ?? "");
    } catch (error) {
      console.error("Create Result Sheet Error:", error);
      setResultSheetMessage({
        type: "error",
        title: "Result Sheet 생성에 실패했습니다.",
        items: [
          error instanceof Error
            ? error.message
            : "Result Sheet 생성 중 오류가 발생했습니다.",
        ],
      });
    } finally {
      setIsCreatingResultSheet(false);
    }
  };

  const reportScopeText = createTargetVersionDisplay({
    version: reportVersion,
    rcVersion: reportRcVersion,
    inferredTargetVersion: analysisSummary?.inferredTargetVersion ?? "",
  });
  const isFeatureReport = reportType === "FEATURE";
  const activeQuickScenarioPresets = isFeatureReport
    ? QUICK_SCENARIO_PRESETS
    : OVERALL_QUICK_SCENARIO_PRESETS;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
        <div className="mb-12">
          <p className="mb-4 inline-flex rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
            AI 기반 QA 운영 지원 도구
          </p>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <h1
              onClick={() => window.location.reload()}
              className="cursor-pointer text-4xl font-bold tracking-tight transition hover:text-zinc-200 sm:text-5xl"
            >
              AI QA Report Assistant
            </h1>
            <span className="pb-1 text-sm font-medium text-zinc-500 sm:text-base">
              v1.0 Beta 2
            </span>
          </div>
          <p className="mt-6 max-w-3xl text-base leading-7 text-zinc-400">
            TC, CL 등 테스트 수행 문서와 Jira 이슈 데이터를 함께 분석해 피쳐
            단위 QA 결과 리포트를 생성합니다.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              Report Type
            </label>
            <div className="flex gap-3">
              {(["FEATURE", "OVERALL"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleReportTypeChange(type)}
                  className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
                    reportType === type
                      ? "bg-white text-black"
                      : "border border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {type === "FEATURE" ? "Feature Report" : "Overall Report"}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              {reportType === "FEATURE"
                ? "Feature Report는 label 기준으로 특정 피쳐 QA 결과를 분석합니다."
                : "Overall Report는 프로젝트 / 버전 단위 릴리즈 QA 결과를 기간 기준으로 분석합니다."}
            </p>
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              Quick Scenario
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeQuickScenarioPresets).map(
                ([scenario, preset]) => {
                  const isApplying = applyingQuickScenario === scenario;

                  return (
                    <button
                      key={scenario}
                      type="button"
                      onClick={() => applyQuickScenario(scenario, preset)}
                      disabled={Boolean(applyingQuickScenario)}
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isApplying ? "Applying..." : scenario}
                    </button>
                  );
                }
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {isFeatureReport
                ? "준비된 Feature QA 시나리오로 입력값을 빠르게 세팅합니다."
                : "릴리즈 QA 결과를 기간 기준으로 빠르게 확인할 수 있습니다."}
            </p>
          </div>

          <div className="hidden">
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              Quick Scenario
            </label>
            <div className="flex flex-wrap gap-2">
              {["메인피쳐", "서브피쳐", "더미:안정", "더미:주의필요"].map(
                (scenario) => {
                  const preset =
                    QUICK_SCENARIO_PRESETS[
                      scenario as keyof typeof QUICK_SCENARIO_PRESETS
                    ];
                  const isApplying = applyingQuickScenario === scenario;

                  return (
                    <button
                      key={scenario}
                      type="button"
                      onClick={
                        preset
                          ? () => applyQuickScenario(scenario, preset)
                          : undefined
                      }
                      disabled={Boolean(applyingQuickScenario)}
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isApplying ? "적용 중..." : scenario}
                    </button>
                  );
                }
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              준비된 QA 시나리오를 통해 Result Report를 빠르게 확인할 수
              있습니다.
            </p>
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              {isFeatureReport ? "Feature Name" : "Overall Report Title"}
            </label>
            <p className="mb-3 text-sm leading-6 text-zinc-500">
              {isFeatureReport
                ? "결과 리포트에 사용할 피쳐명을 입력하세요."
                : "전체 QA 결과 리포트에 사용할 프로젝트명과 버전을 입력하세요."}
              <br />
              {isFeatureReport
                ? "예: 결제 / 알림 / 이벤트 응모 / 멤버십"
                : "예: 디어스 2.0.0 / A프로젝트 2.0.0"}
            </p>
            <p className="hidden">
              결과 리포트에 사용할 피쳐명을 입력하세요.
              <br />
              예: 결제 / 알림 / 이벤트 응모 / 멤버십
            </p>
            <input
              type="text"
              value={reportTitle}
              onChange={(event) => setReportTitle(event.target.value)}
              placeholder={
                isFeatureReport ? "예: 결제" : "예: 디어스 2.0.0"
              }
              className="min-h-11 w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
            />
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              Version / RC
            </label>
            <p className="mb-3 text-sm leading-6 text-zinc-500">
              미입력 시 Jira Version / RC 기준 자동 추론
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-40">
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Build Version
                </label>
                <input
                  type="text"
                  value={reportVersion}
                  onChange={(event) => setReportVersion(event.target.value)}
                  placeholder="2.0.0"
                  className="min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Report RC Version
                </label>
                <input
                  type="text"
                  value={reportRcVersion}
                  onChange={(event) => setReportRcVersion(event.target.value)}
                  placeholder="RC3"
                  className="min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              Test Sheets
            </label>
            <p className="mb-4 text-sm leading-6 text-zinc-500">
              TC, CL, Smoke Test 등 QA 진행 내용을 확인할 Google Sheet URL을
              입력하세요. TC 또는 CL 문서가 별도 링크로 관리되는 경우 Add를
              통해 추가할 수 있습니다.
            </p>
            <div className="mb-4 text-sm leading-6 text-zinc-500">
              <p>
                결과 리포트에 포함할 코멘트에는 &quot;##&quot;를 함께
                작성해주세요.
              </p>
              <p className="mt-1">예: ## 다음 버전 수정 예정</p>
            </div>
            <div className="space-y-3">
              {testSheets.map((sheet, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex min-w-0 gap-3">
                    {sheet.isEditing ? (
                      <input
                        type="text"
                        value={sheet.url}
                        onChange={(event) =>
                          updateTestSheet(index, event.target.value)
                        }
                        onBlur={() => finishEditingTestSheet(index)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") finishEditingTestSheet(index);
                        }}
                        placeholder="https://docs.google.com/spreadsheets/..."
                        className="min-h-12 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
                      />
                    ) : (
                      <div className="flex min-h-12 min-w-0 flex-1 items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4">
                        <a
                          href={sheet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1 truncate text-sm text-blue-400 underline-offset-4 transition hover:text-blue-300 hover:underline"
                        >
                          {sheet.url}
                        </a>
                        <button
                          onClick={() => editTestSheet(index)}
                          title="Edit URL"
                          className="ml-4 shrink-0 text-zinc-500 transition hover:text-zinc-300"
                        >
                          ✎
                        </button>
                      </div>
                    )}
                    {testSheets.length > 1 && (
                      <button
                        onClick={() => removeTestSheet(index)}
                        className="min-h-12 shrink-0 rounded-xl border border-zinc-700 px-4 text-sm text-zinc-300 transition hover:border-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {testSheetMetadataList[index] && (
                    <SpreadsheetPreview
                      spreadsheetInfo={testSheetMetadataList[index]!}
                      selectedGids={selectedTestSheetGids[index] ?? []}
                      autoLinkedJiraSheet={getAutoLinkedJiraSheetForTestSheet(
                        sheet.url
                      )}
                      isExpanded={expandedTestSheetSelections[index] ?? false}
                      onToggleExpanded={() => toggleTestSheetSelectionExpanded(index)}
                      onCloseSelection={() => closeTestSheetSelection(index)}
                      onToggleSheet={(sheet) =>
                        toggleSelectedTestSheetGid(index, sheet)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <button
                onClick={addTestSheet}
                disabled={testSheets.length >= MAX_TEST_SHEETS}
                className="rounded-xl border border-dashed border-zinc-600 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Add Test Sheet
              </button>
              <span className="text-xs text-zinc-500">
                {testSheets.length}/{MAX_TEST_SHEETS}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              Jira Issue Sheet
            </label>
            <p className="mb-3 text-sm leading-6 text-zinc-500">
              Jira for Cloud Google Sheets 등을 통해 불러온 전체 이슈 시트 URL을
              입력하세요.
            </p>
            {jiraIssueSheet.isEditing ? (
              <input
                type="text"
                value={jiraIssueSheet.url}
                onChange={(event) => {
                  setJiraIssueSheet({ ...jiraIssueSheet, url: event.target.value });
                  setAutoLinkedJiraSheet(null);
                }}
                onBlur={() => {
                  if (jiraIssueSheet.url.trim()) {
                    setJiraIssueSheet({ ...jiraIssueSheet, isEditing: false });
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && jiraIssueSheet.url.trim()) {
                    setJiraIssueSheet({ ...jiraIssueSheet, isEditing: false });
                  }
                }}
                placeholder="https://docs.google.com/spreadsheets/..."
                className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
              />
            ) : (
              <div className="flex min-h-12 min-w-0 items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4">
                <a
                  href={jiraIssueSheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-blue-400 underline-offset-4 transition hover:text-blue-300 hover:underline"
                >
                  {jiraIssueSheet.url}
                </a>
                <button
                  onClick={() =>
                    setJiraIssueSheet({ ...jiraIssueSheet, isEditing: true })
                  }
                  title="Edit URL"
                  className="ml-4 shrink-0 text-zinc-500 transition hover:text-zinc-300"
                >
                  ✎
                </button>
              </div>
            )}
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              Jira Analysis Period
            </label>
            <p className="mb-4 text-sm leading-6 text-zinc-500">
              End DateTime 미입력 시 현재 시점까지 분석합니다.
            </p>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <DateTimeInputs
                label="Start DateTime"
                date={jiraAnalysisStartDate}
                hour={jiraAnalysisStartHour}
                minute={jiraAnalysisStartMinute}
                onDateChange={setJiraAnalysisStartDate}
                onHourChange={setJiraAnalysisStartHour}
                onMinuteChange={(value) => updateMinute(value, setJiraAnalysisStartMinute)}
              />
              <span className="hidden pb-3 text-sm text-zinc-500 lg:block">~</span>
              <DateTimeInputs
                label="End DateTime"
                date={jiraAnalysisEndDate}
                hour={jiraAnalysisEndHour}
                minute={jiraAnalysisEndMinute}
                onDateChange={setJiraAnalysisEndDate}
                onHourChange={setJiraAnalysisEndHour}
                onMinuteChange={(value) => updateMinute(value, setJiraAnalysisEndMinute)}
              />
            </div>
          </div>

          {isFeatureReport && (
          <div className="mb-10">
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="block text-sm font-semibold text-zinc-200">
                Jira Reference Labels
              </label>
              <div className="flex gap-2">
                {(["ANY", "ALL"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLabelMatchMode(mode)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      labelMatchMode === mode
                        ? "bg-white text-black"
                        : "border border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {mode} ({mode === "ANY" ? "OR" : "AND"})
                  </button>
                ))}
              </div>
            </div>
            <p className="mb-4 text-sm leading-6 text-zinc-500">
              Jira 이슈 시트에서 참고할 label 또는 keyword를 입력하세요.
              입력된 label 기준으로 관련 이슈를 분석합니다.
              <br />
              Label을 입력하지 않으면 Jira Analysis Period 기준으로만 이슈를
              분석합니다.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {jiraLabels.map((label, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={label}
                    onChange={(event) => updateJiraLabel(index, event.target.value)}
                    placeholder="payment"
                    className="min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
                  />
                  {jiraLabels.length > 1 && (
                    <button
                      onClick={() => removeJiraLabel(index)}
                      className="min-h-11 rounded-xl border border-zinc-700 px-3 text-xs text-zinc-300 transition hover:border-red-400 hover:text-red-300"
                    >
                      -
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <button
                onClick={addJiraLabel}
                disabled={jiraLabels.length >= MAX_JIRA_LABELS}
                className="rounded-xl border border-dashed border-zinc-600 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Add Label
              </button>
              <span className="text-xs text-zinc-500">
                {jiraLabels.length}/{MAX_JIRA_LABELS}
              </span>
            </div>
          </div>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating
              ? "Generating Report..."
              : isFeatureReport
                ? "Generate Feature QA Report"
                : "Generate Overall QA Report"}
          </button>

          {message && <MessagePanel message={message} />}
        </div>

        {analysisSummary && (
          <section ref={analysisSummaryRef} className="mt-8 space-y-6">
            <AiAnalysisPreview
              analysisText={aiAnalysisText}
              isLoading={isAiAnalyzing}
              onAnalyze={handleAiAnalysisTest}
            />

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-zinc-100">
                    Result Report
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    {analysisSummary.reportType === "FEATURE"
                      ? "현재 분석 결과를 QA Dashboard 형태의 Result Report로 저장합니다. 생성 후 결과 리포트 바로가기가 활성화됩니다."
                      : "현재 분석 결과를 Overall QA Dashboard 형태의 Result Report로 저장합니다. 생성 후 결과 리포트 바로가기가 활성화됩니다."}
                  </p>
                  <p className="hidden">
                    현재 분석 결과를 QA Dashboard 형태의 Result Report로
                    저장합니다. 생성 후 결과 리포트 바로가기가 활성화됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateResultSheet}
                  disabled={isCreatingResultSheet}
                  className="min-w-44 whitespace-nowrap rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.18)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 md:shrink-0"
                >
                  {isCreatingResultSheet
                      ? "Creating Result Report..."
                      : "Create Result Report"}
                </button>
              </div>
              {resultSheetMessage && <MessagePanel message={resultSheetMessage} />}
              {resultSheetUrl && (
                <button
                  type="button"
                  onClick={() => window.open(resultSheetUrl, "_blank")}
                  className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Open Result Report
                </button>
              )}
            </section>

            {analysisSummary.reportType === "FEATURE" ? (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-zinc-300">
                  QA Summary
                </h2>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Report Scope
                    </p>
                    <p className="mt-2 text-sm font-medium text-zinc-100">
                      Target Version: {reportScopeText}
                    </p>
                  </div>
                  <SummaryCard title="QA Summary - Total" summary={analysisSummary.qaTotal} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {analysisSummary.testSheets.map((sheet) => (
                      <SummaryCard
                        key={sheet.title}
                        title={`QA Summary - ${sheet.title}`}
                        rows={sheet.rows}
                        summary={sheet.summary}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Report Scope
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-100">
                    Target Version: {reportScopeText}
                  </p>
                </div>
                {analysisSummary.overallQaSummary && (
                  <OverallQaSummaryCard summary={analysisSummary.overallQaSummary} />
                )}
                {analysisSummary.overallTestSheets && (
                  <OverallFeatureSummaryCard
                    testSheets={analysisSummary.overallTestSheets}
                  />
                )}
                <VersionIssueSummaryCard
                  items={analysisSummary.versionSummary ?? []}
                  title="Version Issue Summary"
                  description="같은 base version에 속한 RC 이슈를 통합한 우선순위 분포입니다."
                />
                <VersionIssueSummaryCard
                  items={analysisSummary.versionIssueSummary ?? []}
                />
              </>
            )}

            <div>
              <h2 className="mb-3 text-sm font-semibold text-zinc-300">
                Jira Summary
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SummaryCard
                  title="Jira Filtered Summary"
                  summary={analysisSummary.jiraFiltered}
                  emptyMessage={
                    analysisSummary.jiraMatchedRows === 0
                      ? "No matching Jira issues found."
                      : undefined
                  }
                />
                <SummaryCard
                  title="Jira Status Summary"
                  summary={analysisSummary.jiraStatus}
                  emptyMessage={
                    analysisSummary.jiraMatchedRows === 0
                      ? "No matching Jira issues found."
                      : undefined
                  }
                />
                <SummaryCard
                  title="Jira Priority Summary"
                  summary={analysisSummary.jiraPriority}
                  emptyMessage={
                    analysisSummary.jiraMatchedRows === 0
                      ? "No matching Jira issues found."
                      : undefined
                  }
                />
              </div>
            </div>

            {analysisSummary.reportType === "FEATURE" ? (
              <FeatureReportPreview analysisSummary={analysisSummary} />
            ) : (
              <OverallReportPreview analysisSummary={analysisSummary} />
            )}
            <RemainingIssueList issues={analysisSummary.remainingIssues} />
            <QaFollowUpList followUps={analysisSummary.qaFollowUps} />
          </section>
        )}

        <footer className="mt-6 space-y-2 text-center text-sm text-zinc-600">
          <p>
            AI-powered QA Reporting · Feature & Overall Report Supported ·
            Google Spreadsheet Integration
          </p>
          <p>Created by Dohyeon Yun</p>
          <p>
            Contact :{" "}
            <a
              href="mailto:porore37@naver.com"
              className="text-zinc-500 underline decoration-zinc-700 underline-offset-4 transition hover:text-zinc-300"
            >
              porore37@naver.com
            </a>
          </p>
        </footer>
      </section>
    </main>
  );
}

function DateTimeInputs({
  label,
  date,
  hour,
  minute,
  onDateChange,
  onHourChange,
  onMinuteChange,
}: {
  label: string;
  date: string;
  hour: string;
  minute: string;
  onDateChange: (date: string) => void;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
}) {
  return (
    <div className="shrink-0">
      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onClick={(event) => openDatePicker(event.currentTarget)}
          onChange={(event) => onDateChange(event.target.value)}
          className="min-h-11 w-40 cursor-pointer rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-400"
        />
        <select
          value={hour}
          onChange={(event) => onHourChange(event.target.value)}
          className="min-h-11 w-20 rounded-xl border border-zinc-700 bg-zinc-950 px-2 text-sm text-white outline-none focus:border-zinc-400"
        >
          {HOUR_OPTIONS.map((hourOption) => (
            <option key={hourOption} value={hourOption}>
              {hourOption}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          max="59"
          value={minute}
          onChange={(event) => onMinuteChange(event.target.value)}
          className="min-h-11 w-20 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-400"
        />
      </div>
    </div>
  );
}

function MessagePanel({ message }: { message: Exclude<MessageState, null> }) {
  return (
    <div
      className={`mt-6 rounded-2xl border p-5 ${
        message.type === "error"
          ? "border-red-500/40 bg-red-950/30"
          : "border-emerald-500/40 bg-emerald-950/30"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          message.type === "error" ? "text-red-300" : "text-emerald-300"
        }`}
      >
        {message.title}
      </p>
      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
        {message.items.map((item, index) => (
          <li key={index}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
