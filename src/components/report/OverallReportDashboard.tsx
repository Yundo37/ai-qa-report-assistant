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
      <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <AiExecutiveSummaryCard
            analysisSummary={analysisSummary}
            analysisText={aiAnalysisText}
            isLoading={isAiAnalyzing}
            onAnalyze={onAnalyze}
          />
        </div>
        <div className="min-w-0">
          <EvidenceSnapshotCard analysisSummary={analysisSummary} />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="min-w-0">
          <ReleaseRiskSummaryCard analysisSummary={analysisSummary} />
        </div>
        <div className="min-w-0">
          <RcProgressCard rcProgress={analysisSummary.rcProgress} />
        </div>
      </div>
      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0">
          <FeatureQaSummaryTable analysisSummary={analysisSummary} />
        </div>
        <div className="min-w-0">
          <RemainingIssuesDashboardCard issues={analysisSummary.remainingIssues} />
        </div>
      </div>
      <QaFollowUpDashboardCard followUps={analysisSummary.qaFollowUps} />
      <DetailedSummarySection>{children}</DetailedSummarySection>
    </div>
  );
}
