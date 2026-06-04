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

export function useAiAnalysisAction({
  analysisSummary,
  isAiAnalyzing,
  aiAnalysisRequestIdRef,
  setIsAiAnalyzing,
  setAiAnalysisText,
  reportTitle,
  createReportTitle,
}: UseAiAnalysisActionParams) {
  return useCallback(async () => {
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
        setAiAnalysisText(data.analysis || "AI 遺꾩꽍 寃곌낵媛 鍮꾩뼱 ?덉뒿?덈떎.");
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      if (aiAnalysisRequestIdRef.current === requestId) {
        setAiAnalysisText("AI 遺꾩꽍??遺덈윭?ㅼ? 紐삵뻽?듬땲??");
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
