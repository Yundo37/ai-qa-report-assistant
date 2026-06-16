"use client";

import type { RefObject } from "react";
import { AppFooter } from "@/components/layout/AppFooter";
import { AnalysisResultSection } from "@/components/report/AnalysisResultSection";
import { CollapsedInputSummaryBar } from "@/components/report/CollapsedInputSummaryBar";
import { InputHeroSection } from "@/components/report/InputHeroSection";
import {
  ReportInputPanel,
  type ReportInputPanelProps,
} from "@/components/report/ReportInputPanel";
import type {
  AiExecutiveSummaryResult,
  AnalysisSummaryState,
  MessageState,
} from "@/types/report";

type ReportAssistantPageViewProps = ReportInputPanelProps & {
  analysisSummary: AnalysisSummaryState;
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
  generatedAtText: string;
  isInputDashboardVisible: boolean;
  onShowInputDashboard: () => void;
  onHideInputDashboard: () => void;
};

export function ReportAssistantPageView({
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
  generatedAtText,
  isInputDashboardVisible,
  onShowInputDashboard,
  onHideInputDashboard,
  ...reportInputPanelProps
}: ReportAssistantPageViewProps) {
  const isOverallReportCanvas = analysisSummary?.reportType === "OVERALL";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-10 sm:px-6 lg:py-14">
        {isInputDashboardVisible ? (
          <div className="mx-auto w-full max-w-6xl">
            {analysisSummary && (
              <div className="mb-6 flex justify-end">
                <button
                  type="button"
                  onClick={onHideInputDashboard}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  입력 접기
                </button>
              </div>
            )}
            <InputHeroSection />
            <ReportInputPanel {...reportInputPanelProps} />
          </div>
        ) : (
          <div
            className={`w-full ${isOverallReportCanvas ? "overflow-x-auto" : ""}`}
          >
            <div
              className={`mx-auto w-full ${
                isOverallReportCanvas
                  ? "min-w-[1200px] max-w-[1440px]"
                  : "max-w-[1280px]"
              }`}
            >
              <CollapsedInputSummaryBar
                reportType={reportInputPanelProps.reportType}
                reportTitle={reportInputPanelProps.reportTitle}
                reportVersion={reportInputPanelProps.reportVersion}
                reportRcVersion={reportInputPanelProps.reportRcVersion}
                testSheets={reportInputPanelProps.testSheets}
                jiraIssueSheet={reportInputPanelProps.jiraIssueSheet}
                onEditInput={onShowInputDashboard}
              />
            </div>
          </div>
        )}
        {analysisSummary && (
          <AnalysisResultSection
            analysisSummary={analysisSummary}
            analysisSummaryRef={analysisSummaryRef}
            aiAnalysisText={aiAnalysisText}
            aiExecutiveSummary={aiExecutiveSummary}
            isAiAnalyzing={isAiAnalyzing}
            onAnalyze={onAnalyze}
            onCreateResultSheet={onCreateResultSheet}
            isCreatingResultSheet={isCreatingResultSheet}
            resultSheetMessage={resultSheetMessage}
            resultSheetUrl={resultSheetUrl}
            reportScopeText={reportScopeText}
            reportPeriodText={reportPeriodText}
            reportVersionText={reportInputPanelProps.reportVersion}
            reportRcText={reportInputPanelProps.reportRcVersion}
            generatedAtText={generatedAtText}
          />
        )}
        <AppFooter />
      </section>
    </main>
  );
}
