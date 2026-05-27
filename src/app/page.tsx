"use client";

import { useEffect, useRef, useState } from "react";
import { AiAnalysisPreview } from "@/components/report/AiAnalysisPreview";
import { FeatureReportPreview } from "@/components/report/FeatureReportPreview";
import { QaFollowUpList } from "@/components/report/QaFollowUpList";
import { RemainingIssueList } from "@/components/report/RemainingIssueList";
import { SpreadsheetPreview } from "@/components/report/SpreadsheetPreview";
import { SummaryCard } from "@/components/report/SummaryCard";
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
import { createFeatureReportPreviewLines } from "@/lib/reportPreview";
import type {
  AnalysisSummaryState,
  CountSummary,
  CsvRecord,
  LabelMatchMode,
  MessageState,
  QaIssueOverviewSummary,
  RcProgressSummary,
  SheetInput,
  SpreadsheetInfo,
} from "@/types/report";

const MAX_TEST_SHEETS = 50;
const MAX_JIRA_LABELS = 8;
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  index.toString().padStart(2, "0")
);

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
  const [reportTitle, setReportTitle] = useState("");
  const [testSheets, setTestSheets] = useState<SheetInput[]>([
    { url: "", isEditing: true },
  ]);
  const [jiraIssueSheet, setJiraIssueSheet] = useState<SheetInput>({
    url: "",
    isEditing: true,
  });
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState("");
  const [isCreatingResultSheet, setIsCreatingResultSheet] = useState(false);
  const [resultSheetMessage, setResultSheetMessage] =
    useState<MessageState>(null);
  const analysisSummaryRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!analysisSummary) return;
    analysisSummaryRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [analysisSummary]);

  const logSpreadsheetInfo = (spreadsheetMetadata: SpreadsheetInfo) => {
    console.log("Spreadsheet Info");
    console.log(`- Title: ${spreadsheetMetadata.title}`);
    console.log("- Sheets:");
    spreadsheetMetadata.sheets.forEach((sheet) => {
      console.log(`  - ${sheet.title}`);
    });
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

  const toggleSelectedTestSheetGid = (index: number, gid: string) => {
    setSelectedTestSheetGids((currentSelectedGids) => {
      const updatedSelectedGids = [...currentSelectedGids];
      const currentGids = updatedSelectedGids[index] ?? [];
      updatedSelectedGids[index] = currentGids.includes(gid)
        ? currentGids.filter((selectedGid) => selectedGid !== gid)
        : [...currentGids, gid];
      return updatedSelectedGids;
    });
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
    setAnalysisSummary(null);
    setResultSheetMessage(null);

    const validTestSheetEntries = testSheets
      .map((sheet, index) => ({ url: sheet.url.trim(), index }))
      .filter((sheet) => Boolean(sheet.url));
    const validTestSheetUrls = validTestSheetEntries.map((sheet) => sheet.url);
    const validJiraLabels = jiraLabels
      .map((label) => label.trim())
      .filter(Boolean);
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

    if (!reportTitle.trim()) missingItems.push("Report Title을 입력해주세요.");
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
      reportTitle: reportTitle.trim(),
      testSheets: parsedTestSheets,
      jiraIssueSheet: parsedJiraIssueSheet,
      jiraAnalysisPeriod: {
        startDateTime: jiraAnalysisStartDateTime ?? "",
        endDateTime: jiraAnalysisEndDateTime,
      },
      jiraLabels: validJiraLabels,
      labelMatchMode,
    };

    console.log("Feature Report Input:", reportInput);
    console.log(
      `Label Match Mode: ${
        labelMatchMode === "ANY" ? "ANY (OR)" : "ALL (AND)"
      }`
    );
    console.log(
      `Label Filter: ${
        validJiraLabels.length > 0 ? "Applied" : "Skipped (Period only)"
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
        const rcProgress = createRcProgressSummary(filteredJiraIssues, {
          reportTitle: reportInput.reportTitle,
          startDateTime: jiraAnalysisStartDateTime ?? "",
          endDateTime: jiraAnalysisEndDateTime,
        });
        const nextAnalysisSummary: Exclude<AnalysisSummaryState, null> = {
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
        };
        console.log("Remaining Count Summary:", jiraFilteredSummary.Remaining ?? 0);
        console.log("Remaining Issue List Length:", remainingIssues.length);
        console.log("Remaining Issue Sample:", remainingIssues.slice(0, 5));
        console.log("QA Issue Overview Summary:", qaIssueOverview);
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
          "Jira Reference Label이 Jira 시트의 Label 값과 일치하는지 확인해주세요.",
          "Jira Analysis Period 범위가 너무 좁지 않은지 확인해주세요.",
          'Jira 시트의 "만듦" 컬럼 날짜 형식이 정상인지 확인해주세요.',
        ],
      });
    } else {
      setMessage({
        type: "success",
        title: "Feature Report 입력값과 Google Sheet 데이터 확인이 완료되었습니다.",
        items: [
          `Report Title: ${reportInput.reportTitle}`,
          `Test Sheets: ${reportInput.testSheets.length}개`,
          "Jira Issue Sheet: 입력 완료",
          `Jira Reference Labels: ${reportInput.jiraLabels.length}개`,
          "Console에서 Test Sheet / Jira Issue Sheet parsed data preview를 확인할 수 있습니다.",
        ],
      });
    }
  };

  const handleGenerateReport = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await runGenerateReport();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiAnalysisTest = async () => {
    if (!analysisSummary || isAiAnalyzing) return;
    setIsAiAnalyzing(true);
    setAiAnalysisText("");

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qaSummary: analysisSummary.qaTotal,
          jiraFilteredSummary: analysisSummary.jiraFiltered,
          jiraStatusSummary: analysisSummary.jiraStatus,
          jiraPrioritySummary: analysisSummary.jiraPriority,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("AI Analysis Response Body:", errorBody);
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const data = (await response.json()) as { analysis?: string };
      setAiAnalysisText(data.analysis || "AI 분석 결과가 비어 있습니다.");
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAiAnalysisText("AI 분석을 불러오지 못했습니다.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleCreateResultSheet = async () => {
    if (!analysisSummary || isCreatingResultSheet) return;
    setIsCreatingResultSheet(true);
    setResultSheetMessage(null);

    try {
      const rcProgressForRequest =
        analysisSummary.rcProgress ?? createFallbackRcProgress(analysisSummary);
      const qaIssueOverviewForRequest =
        analysisSummary.qaIssueOverview ??
        createFallbackQaIssueOverview(analysisSummary);
      const didUseRcProgressFallback = !analysisSummary.rcProgress;
      const createResultSheetPayload = {
        spreadsheetId: analysisSummary.resultSpreadsheetId,
        reportTitle: reportTitle.trim(),
        qaSummary: analysisSummary.qaTotal,
        testSheets: analysisSummary.testSheets,
        jiraFilteredSummary: analysisSummary.jiraFiltered,
        jiraStatusSummary: analysisSummary.jiraStatus,
        jiraPrioritySummary: analysisSummary.jiraPriority,
        reportPreviewLines: createFeatureReportPreviewLines(analysisSummary),
        remainingIssues: analysisSummary.remainingIssues,
        rcProgress: rcProgressForRequest,
        qaIssueOverview: qaIssueOverviewForRequest,
        qaFollowUps: analysisSummary.qaFollowUps,
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

      const response = await fetch("/api/create-result-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createResultSheetPayload),
      });

      const data = (await response.json()) as {
        sheetName?: string;
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
        <div className="mb-12">
          <p className="mb-4 inline-flex rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
            AI 기반 QA 운영 지원 도구
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            AI QA Report Assistant
          </h1>
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
              <button className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black">
                Feature Report
              </button>
              <button
                disabled
                className="cursor-not-allowed rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm font-medium text-zinc-500"
              >
                Overall Report
              </button>
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              현재 단계에서는 Feature Report 화면을 우선 구성합니다. Overall
              Report는 이후 별도 화면 구조로 확장 예정입니다.
            </p>
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              Report Title
            </label>
            <p className="mb-3 text-sm leading-6 text-zinc-500">
              결과 리포트 제목에 사용할 피쳐명을 입력하세요.
              <br />
              예: 결제 QA 결과 리포트
            </p>
            <input
              type="text"
              value={reportTitle}
              onChange={(event) => setReportTitle(event.target.value)}
              placeholder="예: 결제 QA 결과 리포트"
              className="min-h-11 w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
            />
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
                      isExpanded={expandedTestSheetSelections[index] ?? false}
                      onToggleExpanded={() => toggleTestSheetSelectionExpanded(index)}
                      onCloseSelection={() => closeTestSheetSelection(index)}
                      onToggleSheet={(gid) => toggleSelectedTestSheetGid(index, gid)}
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
                onChange={(event) =>
                  setJiraIssueSheet({ ...jiraIssueSheet, url: event.target.value })
                }
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

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? "Generating Report..." : "Generate Feature QA Report"}
          </button>

          {message && <MessagePanel message={message} />}
        </div>

        {analysisSummary && (
          <section ref={analysisSummaryRef} className="mt-8 space-y-6">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-zinc-300">
                QA Summary
              </h2>
              <div className="space-y-4">
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

            <FeatureReportPreview analysisSummary={analysisSummary} />
            <AiAnalysisPreview
              analysisText={aiAnalysisText}
              isLoading={isAiAnalyzing}
              onAnalyze={handleAiAnalysisTest}
            />
            <RemainingIssueList issues={analysisSummary.remainingIssues} />
            <QaFollowUpList followUps={analysisSummary.qaFollowUps} />

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-zinc-100">
                  Result Sheet
                </h2>
                <button
                  type="button"
                  onClick={handleCreateResultSheet}
                  disabled={isCreatingResultSheet}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingResultSheet
                    ? "Creating Result Sheet..."
                    : "Create Result Sheet"}
                </button>
              </div>
              {resultSheetMessage && <MessagePanel message={resultSheetMessage} />}
            </section>
          </section>
        )}

        <p className="mt-6 text-center text-sm text-zinc-600">
          MVP v1 · Feature Report 우선 구현 · Google Spreadsheet 공유 링크 기반
          데이터 조회 예정
        </p>
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
