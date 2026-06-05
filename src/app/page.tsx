"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReportAssistantPageView } from "@/components/layout/ReportAssistantPageView";
import {
  OVERALL_QUICK_SCENARIO_PRESETS,
  QUICK_SCENARIO_PRESETS,
} from "@/components/report/quickScenarioPresets";
import type { QuickScenarioPreset } from "@/components/report/reportInputTypes";
import { useAiAnalysisAction } from "@/hooks/useAiAnalysisAction";
import { useResultSheetAction } from "@/hooks/useResultSheetAction";
import { createGenerateInputValidation } from "@/lib/report/generateValidation";
import { createSheetUrlValidation } from "@/lib/report/sheetUrlValidation";
import { createQaSummaryBundle } from "@/lib/report/qaSummaryBuilder";
import { createJiraSummaryBundle } from "@/lib/report/jiraSummaryBuilder";
import { createRcProgressBundle } from "@/lib/report/rcProgressBuilder";
import { createOverallSummaryBundle } from "@/lib/report/overallSummaryBuilder";
import {
  buildAnalysisDateTime,
  buildGoogleSpreadsheetTabUrl,
  createReportTitle,
  isJiraSheetTitle,
} from "@/lib/report/reportFormatting";
import { createTargetVersionDisplay } from "@/lib/report/versionHelpers";
import {
  QA_SCOPE_FIELDS,
} from "@/lib/report/qaAnalysisContext";
import { getJiraTargetVersionValues } from "@/lib/report/versionInference";
import { parseJiraIssueSheetCsv, parseTestSheetCsv } from "@/lib/csv";
import {
  fetchGoogleSheetCsv,
  fetchSpreadsheetInfo,
  parseGoogleSheetUrl,
} from "@/lib/googleSheet";
import {
  createFieldValueSample,
  filterJiraIssuesByLabels,
  filterJiraIssuesByPeriod,
  getRecordValue,
  getJiraStatus,
  JIRA_CREATED_FIELDS,
  JIRA_LABEL_FIELDS,
  JIRA_PRIORITY_FIELDS,
  JIRA_STATUS_FIELDS,
} from "@/lib/jira";
import type {
  AnalysisSummaryState,
  CsvRecord,
  IssuePatternAnalysisItem,
  LabelMatchMode,
  MessageState,
  IssuePatternSource,
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
  const [reportType, setReportType] = useState<ReportType>("OVERALL");
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

    const {
      validTestSheetEntries,
      validTestSheetUrls,
      validJiraLabels,
      jiraIssueSheetUrl,
      jiraAnalysisStartDateTime,
      jiraAnalysisEndDateTime,
      reportName,
      generatedReportTitle,
      missingItems,
    } = createGenerateInputValidation({
      testSheets,
      reportType,
      jiraLabels,
      jiraIssueSheet,
      jiraAnalysisStartDate,
      jiraAnalysisStartHour,
      jiraAnalysisStartMinute,
      jiraAnalysisEndDate,
      jiraAnalysisEndHour,
      jiraAnalysisEndMinute,
      reportTitle,
    });

    if (missingItems.length > 0) {
      setMessage({
        type: "error",
        title: "입력값을 확인해주세요.",
        items: missingItems,
      });
      return;
    }

    const {
      invalidFormatItems,
      parsedTestSheets,
      parsedJiraIssueSheet,
      invalidParsedItems,
    } = createSheetUrlValidation({
      validTestSheetUrls,
      jiraIssueSheetUrl,
    });

    if (invalidFormatItems.length > 0) {
      setMessage({
        type: "error",
        title: "Google Spreadsheet URL 형식을 확인해주세요.",
        items: invalidFormatItems,
      });
      return;
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
      const {
        qaTotalSummary,
        qaFollowUps,
        qaAnalysisContext,
        testSheetSummaries,
      } = createQaSummaryBundle(
        allParsedTestSheetData,
        parsedTestSheetDataList,
        selectedTestSheets
      );

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

        const {
          jiraStatusSummary,
          jiraPrioritySummary,
          jiraFilteredSummary,
          remainingIssues,
          qaIssueOverview,
          inferredTargetVersion,
        } = createJiraSummaryBundle({
          filteredJiraIssues,
        });
        const {
          overallQaSummary,
          overallTestSheets,
          versionIssueSummary,
          versionSummary,
          issuePatternSources,
          issuePatternAnalysis,
        } =
          reportType === "OVERALL"
            ? createOverallSummaryBundle({
                allParsedTestSheetData,
                parsedTestSheetDataList,
                selectedTestSheets,
                filteredJiraIssues,
                parsedJiraIssueData,
                remainingIssues,
                qaFollowUps,
                createVersionIssueSummary,
                createBaseVersionIssueSummary,
                createIssuePatternSources,
                createIssuePatternAnalysis,
              })
            : {
                overallQaSummary: undefined,
                overallTestSheets: undefined,
                versionIssueSummary: undefined,
                versionSummary: undefined,
                issuePatternSources: undefined,
                issuePatternAnalysis: undefined,
              };
        const { rcProgress } = createRcProgressBundle({
          filteredJiraIssues,
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

  const handleAiAnalysisTest = useAiAnalysisAction({
    analysisSummary,
    isAiAnalyzing,
    aiAnalysisRequestIdRef,
    setIsAiAnalyzing,
    setAiAnalysisText,
    reportTitle,
    createReportTitle,
  });

  const handleCreateResultSheet = useResultSheetAction({
    analysisSummary,
    isCreatingResultSheet,
    setIsCreatingResultSheet,
    setResultSheetMessage,
    setResultSheetUrl,
    reportTitle,
    reportVersion,
    reportRcVersion,
    jiraAnalysisStartDate,
    jiraAnalysisStartHour,
    jiraAnalysisStartMinute,
    jiraAnalysisEndDate,
    jiraAnalysisEndHour,
    jiraAnalysisEndMinute,
    aiAnalysisText,
    createReportTitle,
    buildAnalysisDateTime,
    createFallbackRcProgress,
    createFallbackQaIssueOverview,
  });

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
    <ReportAssistantPageView
      reportType={reportType}
      isFeatureReport={isFeatureReport}
      quickScenarioPresets={activeQuickScenarioPresets}
      legacyQuickScenarioPresets={QUICK_SCENARIO_PRESETS}
      applyingQuickScenario={applyingQuickScenario}
      onReportTypeChange={handleReportTypeChange}
      onApplyQuickScenario={applyQuickScenario}
      reportTitle={reportTitle}
      setReportTitle={setReportTitle}
      reportVersion={reportVersion}
      setReportVersion={setReportVersion}
      reportRcVersion={reportRcVersion}
      setReportRcVersion={setReportRcVersion}
      testSheets={testSheets}
      testSheetMetadataList={testSheetMetadataList}
      selectedTestSheetGids={selectedTestSheetGids}
      expandedTestSheetSelections={expandedTestSheetSelections}
      maxTestSheets={MAX_TEST_SHEETS}
      updateTestSheet={updateTestSheet}
      finishEditingTestSheet={finishEditingTestSheet}
      editTestSheet={editTestSheet}
      removeTestSheet={removeTestSheet}
      addTestSheet={addTestSheet}
      getAutoLinkedJiraSheetForTestSheet={getAutoLinkedJiraSheetForTestSheet}
      toggleTestSheetSelectionExpanded={toggleTestSheetSelectionExpanded}
      closeTestSheetSelection={closeTestSheetSelection}
      toggleSelectedTestSheetGid={toggleSelectedTestSheetGid}
      jiraIssueSheet={jiraIssueSheet}
      setJiraIssueSheet={setJiraIssueSheet}
      setAutoLinkedJiraSheet={setAutoLinkedJiraSheet}
      jiraAnalysisStartDate={jiraAnalysisStartDate}
      setJiraAnalysisStartDate={setJiraAnalysisStartDate}
      jiraAnalysisStartHour={jiraAnalysisStartHour}
      setJiraAnalysisStartHour={setJiraAnalysisStartHour}
      jiraAnalysisStartMinute={jiraAnalysisStartMinute}
      setJiraAnalysisStartMinute={setJiraAnalysisStartMinute}
      jiraAnalysisEndDate={jiraAnalysisEndDate}
      setJiraAnalysisEndDate={setJiraAnalysisEndDate}
      jiraAnalysisEndHour={jiraAnalysisEndHour}
      setJiraAnalysisEndHour={setJiraAnalysisEndHour}
      jiraAnalysisEndMinute={jiraAnalysisEndMinute}
      setJiraAnalysisEndMinute={setJiraAnalysisEndMinute}
      updateMinute={updateMinute}
      labelMatchMode={labelMatchMode}
      setLabelMatchMode={setLabelMatchMode}
      jiraLabels={jiraLabels}
      updateJiraLabel={updateJiraLabel}
      removeJiraLabel={removeJiraLabel}
      addJiraLabel={addJiraLabel}
      maxJiraLabels={MAX_JIRA_LABELS}
      onGenerateReport={handleGenerateReport}
      isGenerating={isGenerating}
      message={message}
      analysisSummary={analysisSummary}
      analysisSummaryRef={analysisSummaryRef}
      aiAnalysisText={aiAnalysisText}
      isAiAnalyzing={isAiAnalyzing}
      onAnalyze={handleAiAnalysisTest}
      onCreateResultSheet={handleCreateResultSheet}
      isCreatingResultSheet={isCreatingResultSheet}
      resultSheetMessage={resultSheetMessage}
      resultSheetUrl={resultSheetUrl}
      reportScopeText={reportScopeText}
    />
  );
}
