"use client";

import type { RefObject } from "react";
import { AiAnalysisPreview } from "@/components/report/AiAnalysisPreview";
import { FeatureReportPreview } from "@/components/report/FeatureReportPreview";
import { FeatureReportResultSection } from "@/components/report/FeatureReportResultSection";
import { JiraSummarySection } from "@/components/report/JiraSummarySection";
import { OverallReportPreview } from "@/components/report/OverallReportPreview";
import { OverallReportDashboard } from "@/components/report/OverallReportDashboard";
import { OverallReportResultSection } from "@/components/report/OverallReportResultSection";
import { QaFollowUpList } from "@/components/report/QaFollowUpList";
import { RemainingIssueList } from "@/components/report/RemainingIssueList";
import { ResultSheetActionPanel } from "@/components/report/ResultSheetActionPanel";
import type {
  AiExecutiveSummaryResult,
  AnalysisSummaryState,
  MessageState,
} from "@/types/report";

type AnalysisResultSectionProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  analysisSummaryRef: RefObject<HTMLElement | null>;
  aiAnalysisText: string;
  aiExecutiveSummary: AiExecutiveSummaryResult | null;
  isAiAnalyzing: boolean;
  onAnalyze: () => void;
  onCreateResultSheet: () => void;
  isCreatingResultSheet: boolean;
  resultSheetMessage: MessageState;
  resultSheetUrl: string;
  reportScopeText: string;
  reportPeriodText: string;
  reportVersionText: string;
  reportRcText: string;
  generatedAtText: string;
};

export function AnalysisResultSection({
  analysisSummary,
  analysisSummaryRef,
  aiAnalysisText,
  aiExecutiveSummary,
  isAiAnalyzing,
  onAnalyze,
  onCreateResultSheet,
  isCreatingResultSheet,
  resultSheetMessage,
  resultSheetUrl,
  reportScopeText,
  reportPeriodText,
  reportVersionText,
  reportRcText,
  generatedAtText,
}: AnalysisResultSectionProps) {
  if (analysisSummary.reportType === "OVERALL") {
    return (
      <section ref={analysisSummaryRef} className="mt-8 w-full overflow-x-auto">
        <div className="mx-auto w-full max-w-[1280px]">
          <OverallReportDashboard
            analysisSummary={analysisSummary}
            reportScopeText={reportScopeText}
            aiAnalysisText={aiAnalysisText}
            aiExecutiveSummary={aiExecutiveSummary}
            isAiAnalyzing={isAiAnalyzing}
            onAnalyze={onAnalyze}
            onCreateResultSheet={onCreateResultSheet}
            isCreatingResultSheet={isCreatingResultSheet}
            resultSheetMessage={resultSheetMessage}
            resultSheetUrl={resultSheetUrl}
            reportPeriodText={reportPeriodText}
            reportVersionText={reportVersionText}
            reportRcText={reportRcText}
            generatedAtText={generatedAtText}
          >
            <OverallReportResultSection
              analysisSummary={analysisSummary}
            />
            <JiraSummarySection analysisSummary={analysisSummary} />
            <OverallReportPreview analysisSummary={analysisSummary} />
            <RemainingIssueList issues={analysisSummary.remainingIssues} />
            <QaFollowUpList analysisSummary={analysisSummary} />
          </OverallReportDashboard>
        </div>
      </section>
    );
  }

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
      <FeatureReportResultSection
        analysisSummary={analysisSummary}
        reportScopeText={reportScopeText}
      />
      <JiraSummarySection analysisSummary={analysisSummary} />
      <FeatureReportPreview analysisSummary={analysisSummary} />
      <RemainingIssueList issues={analysisSummary.remainingIssues} />
      <QaFollowUpList analysisSummary={analysisSummary} />
    </section>
  );
}
