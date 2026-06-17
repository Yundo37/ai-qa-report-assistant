"use client";

import type { RefObject } from "react";
import { AppFooter } from "@/components/layout/AppFooter";
import { AnalysisResultSection } from "@/components/report/AnalysisResultSection";
import { InputHeroSection } from "@/components/report/InputHeroSection";
import { ReportActionRail } from "@/components/report/ReportActionRail";
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
  overallReportCanvasRef: RefObject<HTMLDivElement | null>;
  aiAnalysisText: string;
  aiExecutiveSummary: AiExecutiveSummaryResult | null;
  isAiAnalyzing: boolean;
  onAnalyze: () => void;
  onCreateResultSheet: () => void;
  onStartNewReport: () => void;
  isCreatingResultSheet: boolean;
  resultSheetMessage: MessageState;
  resultSheetUrl: string;
  resultSheetToast: {
    type: "success" | "error";
    title: string;
    description: string;
    resultSheetUrl?: string;
  } | null;
  onDismissResultSheetToast: () => void;
  reportScopeText: string;
  reportPeriodText: string;
  generatedAtText: string;
  isInputDashboardVisible: boolean;
  onHideInputDashboard: () => void;
};

export function ReportAssistantPageView({
  analysisSummary,
  analysisSummaryRef,
  overallReportCanvasRef,
  aiAnalysisText,
  aiExecutiveSummary,
  isAiAnalyzing,
  onAnalyze,
  onCreateResultSheet,
  onStartNewReport,
  isCreatingResultSheet,
  resultSheetMessage,
  resultSheetUrl,
  resultSheetToast,
  onDismissResultSheetToast,
  reportScopeText,
  reportPeriodText,
  generatedAtText,
  isInputDashboardVisible,
  onHideInputDashboard,
  ...reportInputPanelProps
}: ReportAssistantPageViewProps) {
  const isOverallReportCanvas = analysisSummary?.reportType === "OVERALL";
  const showActionRail =
    Boolean(analysisSummary) && isOverallReportCanvas && !isInputDashboardVisible;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {showActionRail && (
        <ReportActionRail
          reportCanvasRef={overallReportCanvasRef}
          reportVersionText={reportInputPanelProps.reportVersion}
          reportRcText={reportInputPanelProps.reportRcVersion}
          onStartNewReport={onStartNewReport}
          onCreateResultSheet={onCreateResultSheet}
          isCreatingResultSheet={isCreatingResultSheet}
        />
      )}
      {resultSheetToast && (
        <div className="fixed bottom-6 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-indigo-100 bg-white/95 p-4 text-sm shadow-2xl shadow-indigo-200/40 backdrop-blur sm:right-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className={`font-bold ${
                  resultSheetToast.type === "success"
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                {resultSheetToast.title}
              </p>
              <p className="mt-1 leading-5 text-slate-600">
                {resultSheetToast.description}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismissResultSheetToast}
              className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="알림 닫기"
              title="알림 닫기"
            >
              닫기
            </button>
          </div>
          {resultSheetToast.resultSheetUrl && (
            <button
              type="button"
              onClick={() =>
                window.open(
                  resultSheetToast.resultSheetUrl,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
            >
              결과 리포트 열기
            </button>
          )}
        </div>
      )}
      <section className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-10 sm:px-6 lg:py-14">
        {isInputDashboardVisible ? (
          <div className="w-full overflow-x-auto pb-2">
            <div className="mx-auto w-full min-w-[1024px] max-w-[1200px]">
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
          </div>
        ) : null}
        {analysisSummary && (
          <AnalysisResultSection
            analysisSummary={analysisSummary}
            analysisSummaryRef={analysisSummaryRef}
            overallReportCanvasRef={overallReportCanvasRef}
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
