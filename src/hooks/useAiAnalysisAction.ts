import { useCallback } from "react";
import { sanitizeAiExecutiveSummary } from "@/lib/report/aiExecutiveSummarySanitizer";
import {
  sanitizeExecutiveSummaryTone,
  sanitizeReportTone,
} from "@/lib/report/reportToneSanitizer";
import type {
  AiExecutiveSummaryResult,
  AnalysisSummaryState,
} from "@/types/report";

type UseAiAnalysisActionParams = {
  analysisSummary: AnalysisSummaryState;
  isAiAnalyzing: boolean;
  aiAnalysisRequestIdRef: { current: number };
  setIsAiAnalyzing: (value: boolean) => void;
  setAiAnalysisText: (value: string) => void;
  setAiExecutiveSummary: (value: AiExecutiveSummaryResult | null) => void;
  reportTitle: string;
  createReportTitle: (featureName: string) => string;
};

const EMPTY_AI_ANALYSIS_MESSAGE =
  "AI \uBD84\uC11D \uACB0\uACFC\uAC00 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAiExecutiveSummaryResult(
  value: unknown
): value is AiExecutiveSummaryResult {
  if (!isRecord(value)) return false;
  const releaseJudgment = value.releaseJudgment;
  const patternInsight = value.patternInsight;

  return (
    isRecord(releaseJudgment) &&
    typeof releaseJudgment.title === "string" &&
    typeof releaseJudgment.description === "string" &&
    Array.isArray(value.riskSignals) &&
    isRecord(patternInsight) &&
    typeof patternInsight.title === "string" &&
    typeof patternInsight.description === "string" &&
    Array.isArray(value.qaCheckpoints)
  );
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOverallInsightCards(
  value: unknown
): AiExecutiveSummaryResult["overallInsightCards"] {
  if (!Array.isArray(value)) return undefined;

  const items = value.reduce<
    NonNullable<AiExecutiveSummaryResult["overallInsightCards"]>
  >((cards, item) => {
    if (!isRecord(item)) return cards;

    const title = toTrimmedString(item.title);
    const headline = toTrimmedString(item.headline);
    const description = toTrimmedString(item.description);
    const tone =
      item.tone === "stable" ||
      item.tone === "caution" ||
      item.tone === "risk" ||
      item.tone === "neutral"
        ? item.tone
        : "neutral";

    if (!title || !headline || !description) return cards;

    cards.push({ title, headline, description, tone });

    return cards;
  }, []).slice(0, 4);

  return items.length > 0 ? items : undefined;
}

function normalizeAnalysisSections(
  value: unknown
): AiExecutiveSummaryResult["analysisSections"] {
  if (!Array.isArray(value)) return undefined;

  const sections = value.reduce<
    NonNullable<AiExecutiveSummaryResult["analysisSections"]>
  >((items, item) => {
    if (!isRecord(item)) return items;

    const title = toTrimmedString(item.title);
    const body = toTrimmedString(item.body);

    if (!title || !body) return items;

    items.push({ title, body });

    return items;
  }, []).slice(0, 4);

  return sections.length > 0 ? sections : undefined;
}

function normalizePriorityCheckItems(
  value: unknown
): AiExecutiveSummaryResult["priorityCheckItems"] {
  if (!Array.isArray(value)) return undefined;

  const items = value.reduce<
    NonNullable<AiExecutiveSummaryResult["priorityCheckItems"]>
  >((checkItems, item) => {
    if (!isRecord(item)) return checkItems;

    const title = toTrimmedString(item.title);
    const reason = toTrimmedString(item.reason);
    const evidence = toTrimmedString(item.evidence);
    const priority =
      item.priority === "high" ||
      item.priority === "medium" ||
      item.priority === "low"
        ? item.priority
        : undefined;

    if (!title || !reason) return checkItems;

    checkItems.push({
      title,
      reason,
      evidence: evidence || undefined,
      priority,
    });

    return checkItems;
  }, []).slice(0, 4);

  return items.length > 0 ? items : undefined;
}

function normalizeAiAnalysisResponse(data: unknown) {
  if (typeof data === "string") {
    return {
      analysis: data,
      executiveSummary: null,
      overallInsightCards: undefined,
      analysisSections: undefined,
      priorityCheckItems: undefined,
    };
  }

  if (!isRecord(data)) {
    return {
      analysis: "",
      executiveSummary: null,
      overallInsightCards: undefined,
      analysisSections: undefined,
      priorityCheckItems: undefined,
    };
  }

  return {
    analysis: typeof data.analysis === "string" ? data.analysis : "",
    executiveSummary: isAiExecutiveSummaryResult(data.executiveSummary)
      ? data.executiveSummary
      : null,
    overallInsightCards: normalizeOverallInsightCards(data.overallInsightCards),
    analysisSections: normalizeAnalysisSections(data.analysisSections),
    priorityCheckItems: normalizePriorityCheckItems(data.priorityCheckItems),
  };
}

export function useAiAnalysisAction({
  analysisSummary,
  isAiAnalyzing,
  aiAnalysisRequestIdRef,
  setIsAiAnalyzing,
  setAiAnalysisText,
  setAiExecutiveSummary,
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
    setAiExecutiveSummary(null);

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

      const data = await response.json();
      const normalizedResponse = normalizeAiAnalysisResponse(data);
      if (normalizedResponse.analysis && !normalizedResponse.executiveSummary) {
        console.warn("AI analysis response did not include executiveSummary.");
      }
      const sanitizedExecutiveSummary = normalizedResponse.executiveSummary
        ? sanitizeAiExecutiveSummary({
            executiveSummary: normalizedResponse.executiveSummary,
            analysisSummary: targetAnalysisSummary,
          })
        : null;
      if (normalizedResponse.executiveSummary && !sanitizedExecutiveSummary) {
        console.warn("AI executiveSummary was rejected by sanitizer.");
      }
      const sanitizedAnalysisText = sanitizeReportTone(
        normalizedResponse.analysis || EMPTY_AI_ANALYSIS_MESSAGE
      );
      const toneSanitizedExecutiveSummary = sanitizedExecutiveSummary
        ? sanitizeExecutiveSummaryTone(sanitizedExecutiveSummary)
        : null;
      const structuredExecutiveSummary = toneSanitizedExecutiveSummary
        ? {
            ...toneSanitizedExecutiveSummary,
            overallInsightCards: normalizedResponse.overallInsightCards,
            analysisSections: normalizedResponse.analysisSections,
            priorityCheckItems: normalizedResponse.priorityCheckItems,
          }
        : null;

      if (aiAnalysisRequestIdRef.current === requestId) {
        setAiAnalysisText(sanitizedAnalysisText);
        setAiExecutiveSummary(structuredExecutiveSummary);
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      if (aiAnalysisRequestIdRef.current === requestId) {
        setAiAnalysisText("");
        setAiExecutiveSummary(null);
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
    setAiExecutiveSummary,
    setAiAnalysisText,
    setIsAiAnalyzing,
  ]);
}
