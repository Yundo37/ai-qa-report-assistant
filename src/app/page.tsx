"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReportAssistantPageView } from "@/components/layout/ReportAssistantPageView";
import {
  OVERALL_QUICK_SCENARIO_PRESETS,
  QUICK_SCENARIO_PRESETS,
} from "@/components/report/quickScenarioPresets";
import type {
  AnalysisMode,
  QuickScenarioPreset,
} from "@/components/report/reportInputTypes";
import { useAiAnalysisAction } from "@/hooks/useAiAnalysisAction";
import { useResultSheetAction } from "@/hooks/useResultSheetAction";
import { createGenerateInputValidation } from "@/lib/report/generateValidation";
import { createSheetUrlValidation } from "@/lib/report/sheetUrlValidation";
import { createBlockedImpactSummary } from "@/lib/report/blockedImpactBuilder";
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
  createBaseVersionIssueSummary,
  createVersionIssueSummary,
} from "@/lib/report/versionIssueSummaryBuilder";
import {
  createIssuePatternAnalysis,
  createIssuePatternSources,
} from "@/lib/report/issuePatternAnalysisBuilder";
import {
  createFallbackQaIssueOverview,
  createFallbackRcProgress,
} from "@/lib/report/reportFallbackBuilders";
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
  getJiraStatus,
  JIRA_CREATED_FIELDS,
  JIRA_LABEL_FIELDS,
} from "@/lib/jira";
import type {
  AnalysisSummaryState,
  AiExecutiveSummaryResult,
  CsvRecord,
  LabelMatchMode,
  MessageState,
  ReportType,
  SheetInput,
  SpreadsheetInfo,
  SpreadsheetSheetInfo,
} from "@/types/report";

const MAX_TEST_SHEETS = 50;
const MAX_JIRA_LABELS = 8;
type ResultSheetToastState = {
  type: "success" | "error";
  title: string;
  description: string;
  resultSheetUrl?: string;
};
export default function Home() {
  const [reportType, setReportType] = useState<ReportType>("OVERALL");
  const [hasSelectedReportType, setHasSelectedReportType] = useState(false);
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
  const [reportGeneratedAt, setReportGeneratedAt] = useState("");
  const [isInputDashboardVisible, setIsInputDashboardVisible] = useState(true);
  const [testSheetMetadataList, setTestSheetMetadataList] = useState<
    Array<SpreadsheetInfo | null>
  >([null]);
  const [selectedTestSheetGids, setSelectedTestSheetGids] = useState<
    string[][]
  >([[]]);
  const [expandedTestSheetSelections, setExpandedTestSheetSelections] =
    useState<boolean[]>([false]);
  const [applyingQuickScenario, setApplyingQuickScenario] = useState("");
  const [analysisMode, setAnalysisMode] =
    useState<AnalysisMode>("AI_ENHANCED");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState("");
  const [aiExecutiveSummary, setAiExecutiveSummary] =
    useState<AiExecutiveSummaryResult | null>(null);
  const [isCreatingResultSheet, setIsCreatingResultSheet] = useState(false);
  const [resultSheetUrl, setResultSheetUrl] = useState("");
  const [resultSheetMessage, setResultSheetMessage] =
    useState<MessageState>(null);
  const [resultSheetToast, setResultSheetToast] =
    useState<ResultSheetToastState | null>(null);
  const analysisSummaryRef = useRef<HTMLElement | null>(null);
  const overallReportCanvasRef = useRef<HTMLDivElement | null>(null);
  const featureReportCanvasRef = useRef<HTMLDivElement | null>(null);
  const aiAnalysisRequestIdRef = useRef(0);
  const didMountInputResetRef = useRef(false);
  const openedResultSheetUrlRef = useRef("");
  const resultSheetToastTimeoutRef = useRef<number | null>(null);

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
    setAiExecutiveSummary(null);
    setIsAiAnalyzing(false);
  }, []);

  const showResultSheetToast = useCallback((toast: ResultSheetToastState) => {
    if (resultSheetToastTimeoutRef.current) {
      window.clearTimeout(resultSheetToastTimeoutRef.current);
    }

    setResultSheetToast(toast);
    resultSheetToastTimeoutRef.current = window.setTimeout(() => {
      setResultSheetToast(null);
      resultSheetToastTimeoutRef.current = null;
    }, 5000);
  }, []);

  const dismissResultSheetToast = useCallback(() => {
    if (resultSheetToastTimeoutRef.current) {
      window.clearTimeout(resultSheetToastTimeoutRef.current);
      resultSheetToastTimeoutRef.current = null;
    }

    setResultSheetToast(null);
  }, []);

  useEffect(() => {
    return () => {
      if (resultSheetToastTimeoutRef.current) {
        window.clearTimeout(resultSheetToastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!analysisSummary) return;
    if (!resultSheetMessage) return;

    if (resultSheetMessage.type === "success") {
      const sheetUrl = resultSheetUrl.trim();
      let didOpenNewTab = false;

      if (sheetUrl && openedResultSheetUrlRef.current !== sheetUrl) {
        const openedWindow = window.open(
          sheetUrl,
          "_blank",
          "noopener,noreferrer"
        );
        didOpenNewTab = Boolean(openedWindow);
        openedResultSheetUrlRef.current = sheetUrl;
      }

      showResultSheetToast({
        type: "success",
        title:
          analysisSummary.reportType === "OVERALL"
            ? "Google Sheet 생성이 완료되었습니다."
            : "결과 시트 생성이 완료되었습니다.",
        description:
          sheetUrl && didOpenNewTab
            ? "새 탭에서 결과 리포트를 열었습니다."
            : "결과 리포트 열기 버튼을 눌러 확인해주세요.",
        resultSheetUrl: sheetUrl || undefined,
      });
      return;
    }

    showResultSheetToast({
      type: "error",
      title:
        analysisSummary.reportType === "OVERALL"
          ? "Google Sheet 생성에 실패했습니다."
          : "결과 시트 생성에 실패했습니다.",
      description:
        resultSheetMessage.items[0] || "설정 또는 권한을 확인해주세요.",
    });
  }, [
    analysisSummary,
    resultSheetMessage,
    resultSheetUrl,
    showResultSheetToast,
  ]);

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
    analysisMode,
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
    setReportGeneratedAt("");
    setIsInputDashboardVisible(true);
    clearAiAnalysisResult();
    setResultSheetMessage(null);
    setResultSheetUrl("");
    dismissResultSheetToast();
  };

  const handleStartNewReport = () => {
    const shouldStartNewReport = window.confirm(
      "새 리포트를 시작할까요?\n입력값과 생성된 리포트 결과가 모두 초기화됩니다."
    );

    if (!shouldStartNewReport) return;

    resetReportInputs();
    resetReportState();
    setHasSelectedReportType(false);
    setApplyingQuickScenario("");
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
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
    setAnalysisMode("AI_ENHANCED");
    setIsGenerating(false);
    setIsAiAnalyzing(false);
    setIsCreatingResultSheet(false);
  };

  const scrollToQuickScenarioSection = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById("quick-scenario-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  };

  const handleReportTypeChange = (nextReportType: ReportType) => {
    const didChangeReportType = reportType !== nextReportType;

    setHasSelectedReportType(true);

    if (didChangeReportType) {
      setReportType(nextReportType);
      resetReportInputs();
      resetReportState();
    }

    scrollToQuickScenarioSection();
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

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.getElementById("generate-report-section")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      });
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

  const runGenerateReport = async (): Promise<Exclude<AnalysisSummaryState, null> | null> => {
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
      return null;
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
      return null;
    }

    if (invalidParsedItems.length > 0) {
      setMessage({
        type: "error",
        title: "Google Spreadsheet URL 정보를 확인해주세요.",
        items: invalidParsedItems,
      });
      return null;
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
      return null;
    }

    let hasNoMatchingJiraIssues = false;
    let generatedAnalysisSummary: Exclude<AnalysisSummaryState, null> | null = null;

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
                jiraAnalysisStartDateTime: jiraAnalysisStartDateTime ?? "",
                jiraAnalysisEndDateTime,
              })
              : {
                  overallQaSummary: undefined,
                  overallTestSheets: undefined,
                  versionIssueSummary: undefined,
                  versionSummary: undefined,
                  issuePatternSources: undefined,
                  issuePatternAnalysis: undefined,
                };
        const blockedImpact = createBlockedImpactSummary({
          parsedTestSheetDataList,
          selectedTestSheets,
          jiraRecords: parsedJiraIssueData,
        });
        const { rcProgress } = createRcProgressBundle({
          filteredJiraIssues,
          reportTitle: reportInput.reportTitle,
          targetRcVersion: reportRcVersion,
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
          blockedImpact,
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

        setReportGeneratedAt(
          new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date())
        );
        setAnalysisSummary(nextAnalysisSummary);
        generatedAnalysisSummary = nextAnalysisSummary;
        setIsInputDashboardVisible(false);
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
      return null;
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

    return generatedAnalysisSummary;
  };

  const handleAiAnalysisTest = useAiAnalysisAction({
    analysisSummary,
    isAiAnalyzing,
    aiAnalysisRequestIdRef,
    setIsAiAnalyzing,
    setAiAnalysisText,
    setAiExecutiveSummary,
    reportTitle,
    createReportTitle,
  });

  const handleGenerateReport = async () => {
    if (isGenerating) return;
    clearAiAnalysisResult();
    setIsGenerating(true);
    try {
      const generatedAnalysisSummary = await runGenerateReport();

      if (analysisMode === "AI_ENHANCED" && generatedAnalysisSummary) {
        await handleAiAnalysisTest(generatedAnalysisSummary);
      }
    } finally {
      setIsGenerating(false);
    }
  };

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
  const reportPeriodText =
    jiraAnalysisStartDate.trim() && jiraAnalysisEndDate.trim()
      ? `${jiraAnalysisStartDate.trim()} ~ ${jiraAnalysisEndDate.trim()}`
      : "";
  const isFeatureReport = reportType === "FEATURE";
  const activeQuickScenarioPresets = isFeatureReport
    ? QUICK_SCENARIO_PRESETS
    : OVERALL_QUICK_SCENARIO_PRESETS;

  return (
    <ReportAssistantPageView
      reportType={reportType}
      hasSelectedReportType={hasSelectedReportType}
      isFeatureReport={isFeatureReport}
      quickScenarioPresets={activeQuickScenarioPresets}
      legacyQuickScenarioPresets={QUICK_SCENARIO_PRESETS}
      applyingQuickScenario={applyingQuickScenario}
      analysisMode={analysisMode}
      onReportTypeChange={handleReportTypeChange}
      onApplyQuickScenario={applyQuickScenario}
      onAnalysisModeChange={setAnalysisMode}
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
      overallReportCanvasRef={overallReportCanvasRef}
      featureReportCanvasRef={featureReportCanvasRef}
      aiAnalysisText={aiAnalysisText}
      aiExecutiveSummary={aiExecutiveSummary}
      isAiAnalyzing={isAiAnalyzing}
      onAnalyze={handleAiAnalysisTest}
      onCreateResultSheet={handleCreateResultSheet}
      onStartNewReport={handleStartNewReport}
      isCreatingResultSheet={isCreatingResultSheet}
      resultSheetToast={resultSheetToast}
      onDismissResultSheetToast={dismissResultSheetToast}
      reportScopeText={reportScopeText}
      reportPeriodText={reportPeriodText}
      generatedAtText={reportGeneratedAt}
      isInputDashboardVisible={isInputDashboardVisible}
      onHideInputDashboard={() => setIsInputDashboardVisible(false)}
    />
  );
}
