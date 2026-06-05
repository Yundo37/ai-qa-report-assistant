import { useCallback, useRef } from "react";
import {
  createFeatureReportPreviewLines,
  createOverallReportPreviewLinesUtf8,
} from "@/lib/reportPreview";
import type {
  AnalysisSummaryState,
  MessageState,
  QaIssueOverviewSummary,
  RcProgressSummary,
} from "@/types/report";

type UseResultSheetActionParams = {
  analysisSummary: AnalysisSummaryState;
  isCreatingResultSheet: boolean;
  setIsCreatingResultSheet: (value: boolean) => void;
  setResultSheetMessage: (message: MessageState) => void;
  setResultSheetUrl: (url: string) => void;
  reportTitle: string;
  reportVersion: string;
  reportRcVersion: string;
  jiraAnalysisStartDate: string;
  jiraAnalysisStartHour: string;
  jiraAnalysisStartMinute: string;
  jiraAnalysisEndDate: string;
  jiraAnalysisEndHour: string;
  jiraAnalysisEndMinute: string;
  aiAnalysisText: string;
  createReportTitle: (featureName: string) => string;
  buildAnalysisDateTime: (date: string, hour: string, minute: string) => string | null;
  createFallbackRcProgress: (
    analysisSummary: Exclude<AnalysisSummaryState, null>
  ) => RcProgressSummary;
  createFallbackQaIssueOverview: (
    analysisSummary: Exclude<AnalysisSummaryState, null>
  ) => QaIssueOverviewSummary;
};

const RESULT_SHEET_CREATE_COOLDOWN_MS = 5000;

export function useResultSheetAction({
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
}: UseResultSheetActionParams) {
  const lastSuccessfulResultSheetCreatedAtRef = useRef(0);

  return useCallback(async () => {
    if (!analysisSummary || isCreatingResultSheet) return;

    const now = Date.now();
    if (
      now - lastSuccessfulResultSheetCreatedAtRef.current <
      RESULT_SHEET_CREATE_COOLDOWN_MS
    ) {
      setResultSheetMessage({
        type: "error",
        title: "Result Sheet가 방금 생성되었습니다. 잠시 후 다시 시도해주세요.",
        items: [],
      });
      return;
    }

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
      lastSuccessfulResultSheetCreatedAtRef.current = Date.now();
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
  }, [
    aiAnalysisText,
    analysisSummary,
    buildAnalysisDateTime,
    createFallbackQaIssueOverview,
    createFallbackRcProgress,
    createReportTitle,
    isCreatingResultSheet,
    jiraAnalysisEndDate,
    jiraAnalysisEndHour,
    jiraAnalysisEndMinute,
    jiraAnalysisStartDate,
    jiraAnalysisStartHour,
    jiraAnalysisStartMinute,
    reportRcVersion,
    reportTitle,
    reportVersion,
    setIsCreatingResultSheet,
    setResultSheetMessage,
    setResultSheetUrl,
  ]);
}
