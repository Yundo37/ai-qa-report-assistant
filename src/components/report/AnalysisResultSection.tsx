"use client";

import type { RefObject } from "react";
import { AiAnalysisPreview } from "@/components/report/AiAnalysisPreview";
import { FeatureReportPreview } from "@/components/report/FeatureReportPreview";
import { FeatureReportResultSection } from "@/components/report/FeatureReportResultSection";
import { JiraSummarySection } from "@/components/report/JiraSummarySection";
import { OverallReportPreview } from "@/components/report/OverallReportPreview";
import { OverallReportResultSection } from "@/components/report/OverallReportResultSection";
import { QaFollowUpList } from "@/components/report/QaFollowUpList";
import { RemainingIssueList } from "@/components/report/RemainingIssueList";
import { ResultSheetActionPanel } from "@/components/report/ResultSheetActionPanel";
import type { AnalysisSummaryState, MessageState } from "@/types/report";

type AnalysisResultSectionProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  analysisSummaryRef: RefObject<HTMLElement | null>;
  aiAnalysisText: string;
  isAiAnalyzing: boolean;
  onAnalyze: () => void;
  onCreateResultSheet: () => void;
  isCreatingResultSheet: boolean;
  resultSheetMessage: MessageState;
  resultSheetUrl: string;
  reportScopeText: string;
};

export function AnalysisResultSection({
  analysisSummary,
  analysisSummaryRef,
  aiAnalysisText,
  isAiAnalyzing,
  onAnalyze,
  onCreateResultSheet,
  isCreatingResultSheet,
  resultSheetMessage,
  resultSheetUrl,
  reportScopeText,
}: AnalysisResultSectionProps) {
  return (
    <section ref={analysisSummaryRef} className="mt-8 space-y-6">
      <AiAnalysisPreview
        analysisText={aiAnalysisText}
        isLoading={isAiAnalyzing}
        onAnalyze={onAnalyze}
      />
      <ResultSheetActionPanel
        reportType={analysisSummary.reportType}
        onCreateResultSheet={onCreateResultSheet}
        isCreatingResultSheet={isCreatingResultSheet}
        resultSheetMessage={resultSheetMessage}
        resultSheetUrl={resultSheetUrl}
      />
      {analysisSummary.reportType === "FEATURE" ? (
        <FeatureReportResultSection
          analysisSummary={analysisSummary}
          reportScopeText={reportScopeText}
        />
      ) : (
        <OverallReportResultSection
          analysisSummary={analysisSummary}
          reportScopeText={reportScopeText}
        />
      )}
      <JiraSummarySection analysisSummary={analysisSummary} />
      {analysisSummary.reportType === "FEATURE" ? (
        <FeatureReportPreview analysisSummary={analysisSummary} />
      ) : (
        <OverallReportPreview analysisSummary={analysisSummary} />
      )}
      <RemainingIssueList issues={analysisSummary.remainingIssues} />
      <QaFollowUpList followUps={analysisSummary.qaFollowUps} />
    </section>
  );
}
