import type { ReactNode } from "react";
import { AiExecutiveSummaryCard } from "@/components/report/AiExecutiveSummaryCard";
import { DetailedSummarySection } from "@/components/report/DetailedSummarySection";
import { EvidenceSnapshotCard } from "@/components/report/EvidenceSnapshotCard";
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <AiExecutiveSummaryCard
          analysisText={aiAnalysisText}
          isLoading={isAiAnalyzing}
          onAnalyze={onAnalyze}
        />
        <EvidenceSnapshotCard analysisSummary={analysisSummary} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ReleaseRiskSummaryCard analysisSummary={analysisSummary} />
        <RcProgressCard rcProgress={analysisSummary.rcProgress} />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <div className="space-y-6">
          <FeatureQaSummaryTable analysisSummary={analysisSummary} />
          <QaFollowUpDashboardCard followUps={analysisSummary.qaFollowUps} />
        </div>
        <RemainingIssuesDashboardCard issues={analysisSummary.remainingIssues} />
      </div>
      <DetailedSummarySection>{children}</DetailedSummarySection>
    </div>
  );
}
