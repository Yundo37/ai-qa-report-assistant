import type { ReactNode } from "react";
import { AiExecutiveSummaryCard } from "@/components/report/AiExecutiveSummaryCard";
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
      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Detailed QA Data
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Overall 상세 데이터
          </h2>
        </div>
        {children}
      </section>
    </div>
  );
}
