"use client";

import type { RefObject } from "react";
import { FeatureReportDashboard } from "@/components/report/FeatureReportDashboard";
import { JiraSummarySection } from "@/components/report/JiraSummarySection";
import { OverallReportPreview } from "@/components/report/OverallReportPreview";
import { OverallReportDashboard } from "@/components/report/OverallReportDashboard";
import { OverallReportResultSection } from "@/components/report/OverallReportResultSection";
import { QaFollowUpList } from "@/components/report/QaFollowUpList";
import { RemainingIssueList } from "@/components/report/RemainingIssueList";
import type {
  AiExecutiveSummaryResult,
  AnalysisSummaryState,
} from "@/types/report";

type AnalysisResultSectionProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  analysisSummaryRef: RefObject<HTMLElement | null>;
  overallReportCanvasRef: RefObject<HTMLDivElement | null>;
  featureReportCanvasRef: RefObject<HTMLDivElement | null>;
  aiAnalysisText: string;
  aiExecutiveSummary: AiExecutiveSummaryResult | null;
  isAiAnalyzing: boolean;
  onAnalyze: () => void;
  reportScopeText: string;
  reportPeriodText: string;
  reportTitleText: string;
  reportVersionText: string;
  reportRcText: string;
  generatedAtText: string;
};

export function AnalysisResultSection({
  analysisSummary,
  analysisSummaryRef,
  overallReportCanvasRef,
  featureReportCanvasRef,
  aiAnalysisText,
  aiExecutiveSummary,
  isAiAnalyzing,
  onAnalyze,
  reportScopeText,
  reportPeriodText,
  reportTitleText,
  reportVersionText,
  reportRcText,
  generatedAtText,
}: AnalysisResultSectionProps) {
  if (analysisSummary.reportType === "OVERALL") {
    return (
      <section
        ref={analysisSummaryRef}
        className="mt-8 min-w-0 w-full overflow-x-auto pb-2"
      >
        <div
          ref={overallReportCanvasRef}
          className="mx-auto w-full min-w-[1080px] max-w-[1320px]"
        >
          <OverallReportDashboard
            analysisSummary={analysisSummary}
            reportScopeText={reportScopeText}
            aiAnalysisText={aiAnalysisText}
            aiExecutiveSummary={aiExecutiveSummary}
            isAiAnalyzing={isAiAnalyzing}
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
    <section
      ref={analysisSummaryRef}
      className="mt-8 min-w-0 w-full overflow-x-auto pb-2"
    >
      <div
        id="feature-report-canvas"
        ref={featureReportCanvasRef}
        className="mx-auto w-full min-w-[1080px] max-w-[1320px]"
      >
        <FeatureReportDashboard
          analysisSummary={analysisSummary}
          aiAnalysisText={aiAnalysisText}
          isAiAnalyzing={isAiAnalyzing}
          onAnalyze={onAnalyze}
          reportTitleText={reportTitleText}
          reportPeriodText={reportPeriodText}
          reportVersionText={reportVersionText}
          reportRcText={reportRcText}
          generatedAtText={generatedAtText}
        />
      </div>
    </section>
  );
}
