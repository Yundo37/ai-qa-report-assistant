import type { ReactNode } from "react";
import { AiExecutiveSummaryCard } from "@/components/report/AiExecutiveSummaryCard";
import { DetailedSummarySection } from "@/components/report/DetailedSummarySection";
import { FeatureQaSummaryTable } from "@/components/report/FeatureQaSummaryTable";
import { QaFollowUpDashboardCard } from "@/components/report/QaFollowUpDashboardCard";
import { RcProgressCard } from "@/components/report/RcProgressCard";
import { ReleaseRiskSummaryCard } from "@/components/report/ReleaseRiskSummaryCard";
import { RemainingIssuesDashboardCard } from "@/components/report/RemainingIssuesDashboardCard";
import { ReportDashboardHeader } from "@/components/report/ReportDashboardHeader";
import { ReportStatusKpiStrip } from "@/components/report/ReportStatusKpiStrip";
import type { AnalysisSummaryState, MessageState } from "@/types/report";

type OverallReportDashboardProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  reportScopeText: string;
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
        onCreateResultSheet={onCreateResultSheet}
        isCreatingResultSheet={isCreatingResultSheet}
        resultSheetMessage={resultSheetMessage}
        resultSheetUrl={resultSheetUrl}
      />
      <ReportStatusKpiStrip analysisSummary={analysisSummary} />
      <AiExecutiveSummaryCard
        analysisText={aiAnalysisText}
        isLoading={isAiAnalyzing}
        onAnalyze={onAnalyze}
      />
      <ReleaseRiskSummaryCard analysisSummary={analysisSummary} />
      <RcProgressCard rcProgress={analysisSummary.rcProgress} />
      <FeatureQaSummaryTable analysisSummary={analysisSummary} />
      <RemainingIssuesDashboardCard issues={analysisSummary.remainingIssues} />
      <QaFollowUpDashboardCard followUps={analysisSummary.qaFollowUps} />
      <DetailedSummarySection>{children}</DetailedSummarySection>
    </div>
  );
}
