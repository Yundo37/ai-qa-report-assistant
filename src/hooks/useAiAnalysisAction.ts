import { useCallback } from "react";
import type { AnalysisSummaryState } from "@/types/report";

type UseAiAnalysisActionParams = {
  analysisSummary: AnalysisSummaryState;
  isAiAnalyzing: boolean;
  aiAnalysisRequestIdRef: { current: number };
  setIsAiAnalyzing: (value: boolean) => void;
  setAiAnalysisText: (value: string) => void;
  reportTitle: string;
  createReportTitle: (featureName: string) => string;
};

const EMPTY_AI_ANALYSIS_MESSAGE =
  "AI \uBD84\uC11D \uACB0\uACFC\uAC00 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.";
const FAILED_AI_ANALYSIS_MESSAGE =
  "AI \uBD84\uC11D \uACB0\uACFC\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";

export function useAiAnalysisAction({
  analysisSummary,
  isAiAnalyzing,
  aiAnalysisRequestIdRef,
  setIsAiAnalyzing,
  setAiAnalysisText,
  reportTitle,
  createReportTitle,
}: UseAiAnalysisActionParams) {
  return useCallback(async (analysisSummaryOverride?: NonNullable<AnalysisSummaryState>) => {
    const targetAnalysisSummary = analysisSummaryOverride ?? analysisSummary;

    if (!targetAnalysisSummary || isAiAnalyzing) return;
    const requestId = aiAnalysisRequestIdRef.current + 1;
    aiAnalysisRequestIdRef.current = requestId;
    setIsAiAnalyzing(true);
    setAiAnalysisText("");

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qaSummary: targetAnalysisSummary.qaTotal,
          reportType: targetAnalysisSummary.reportType,
          jiraFilteredSummary: targetAnalysisSummary.jiraFiltered,
          jiraStatusSummary: targetAnalysisSummary.jiraStatus,
          jiraPrioritySummary: targetAnalysisSummary.jiraPriority,
          reportTitle: createReportTitle(reportTitle),
          testSheets: targetAnalysisSummary.testSheets,
          overallQaSummary: targetAnalysisSummary.overallQaSummary,
          overallTestSheets: targetAnalysisSummary.overallTestSheets,
          versionSummary: targetAnalysisSummary.versionSummary,
          versionIssueSummary: targetAnalysisSummary.versionIssueSummary,
          rcProgress: targetAnalysisSummary.rcProgress,
          qaIssueOverview: targetAnalysisSummary.qaIssueOverview,
          issuePatternSources: targetAnalysisSummary.issuePatternSources,
          issuePatternAnalysis: targetAnalysisSummary.issuePatternAnalysis,
          blockedImpact: targetAnalysisSummary.blockedImpact,
          remainingIssues: targetAnalysisSummary.remainingIssues,
          qaFollowUps: targetAnalysisSummary.qaFollowUps,
          qaAnalysisContext: targetAnalysisSummary.qaAnalysisContext,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("AI Analysis Response Body:", errorBody);
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const data = (await response.json()) as { analysis?: string };
      if (aiAnalysisRequestIdRef.current === requestId) {
        setAiAnalysisText(data.analysis || EMPTY_AI_ANALYSIS_MESSAGE);
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      if (aiAnalysisRequestIdRef.current === requestId) {
        setAiAnalysisText(FAILED_AI_ANALYSIS_MESSAGE);
      }
    } finally {
      if (aiAnalysisRequestIdRef.current === requestId) {
        setIsAiAnalyzing(false);
      }
    }
  }, [
    aiAnalysisRequestIdRef,
    analysisSummary,
    createReportTitle,
    isAiAnalyzing,
    reportTitle,
    setAiAnalysisText,
    setIsAiAnalyzing,
  ]);
}
