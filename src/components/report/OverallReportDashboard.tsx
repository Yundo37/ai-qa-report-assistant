import type { ReactNode } from "react";
import { AiExecutiveSummaryCard } from "@/components/report/AiExecutiveSummaryCard";
import { DetailedSummarySection } from "@/components/report/DetailedSummarySection";
import { FeatureQaSummaryTable } from "@/components/report/FeatureQaSummaryTable";
import { IssuePatternAnalysisCard } from "@/components/report/IssuePatternAnalysisCard";
import { QaFollowUpDashboardCard } from "@/components/report/QaFollowUpDashboardCard";
import { QaReleaseStatusCard } from "@/components/report/QaReleaseStatusCard";
import { RcProgressCard } from "@/components/report/RcProgressCard";
import { ReleaseRiskSummaryCard } from "@/components/report/ReleaseRiskSummaryCard";
import { RemainingIssuesDashboardCard } from "@/components/report/RemainingIssuesDashboardCard";
import { ReportDashboardHeader } from "@/components/report/ReportDashboardHeader";
import { ReportStatusKpiStrip } from "@/components/report/ReportStatusKpiStrip";
import type { AnalysisSummaryState, MessageState } from "@/types/report";

type OverallReportDashboardProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  reportScopeText: string;
  reportPeriodText: string;
  aiAnalysisText: string;
  isAiAnalyzing: boolean;
  onAnalyze: () => void;
  onCreateResultSheet: () => void;
  isCreatingResultSheet: boolean;
  resultSheetMessage: MessageState;
  resultSheetUrl: string;
  children: ReactNode;
};

export function OverallReportDashboard({
  analysisSummary,
  reportScopeText,
  reportPeriodText,
  aiAnalysisText,
  isAiAnalyzing,
  onAnalyze,
  onCreateResultSheet,
  isCreatingResultSheet,
  resultSheetMessage,
  resultSheetUrl,
  children,
}: OverallReportDashboardProps) {
  return (
    <div className="space-y-6">
      <ReportDashboardHeader
        analysisSummary={analysisSummary}
        reportScopeText={reportScopeText}
        reportPeriodText={reportPeriodText}
        onCreateResultSheet={onCreateResultSheet}
        isCreatingResultSheet={isCreatingResultSheet}
        resultSheetMessage={resultSheetMessage}
        resultSheetUrl={resultSheetUrl}
      />
      <QaReleaseStatusCard analysisSummary={analysisSummary} />
      <ReportStatusKpiStrip analysisSummary={analysisSummary} />
      <AiExecutiveSummaryCard
        analysisSummary={analysisSummary}
        analysisText={aiAnalysisText}
        isLoading={isAiAnalyzing}
        onAnalyze={onAnalyze}
      />
      <IssuePatternAnalysisCard analysisSummary={analysisSummary} />
      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="min-w-0">
          <ReleaseRiskSummaryCard analysisSummary={analysisSummary} />
        </div>
        <div className="min-w-0">
          <RcProgressCard rcProgress={analysisSummary.rcProgress} />
        </div>
        <div className="min-w-0">
          <FeatureQaSummaryTable analysisSummary={analysisSummary} />
        </div>
      </div>
      <div className="grid items-start gap-5 md:grid-cols-2">
        <div className="min-w-0">
          <RemainingIssuesDashboardCard issues={analysisSummary.remainingIssues} />
        </div>
        <div className="min-w-0">
          <QaFollowUpDashboardCard followUps={analysisSummary.qaFollowUps} />
        </div>
      </div>
      <DetailedSummarySection>{children}</DetailedSummarySection>
    </div>
  );
}
