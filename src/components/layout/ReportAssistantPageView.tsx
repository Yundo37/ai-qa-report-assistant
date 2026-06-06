"use client";

import type { RefObject } from "react";
import { AppFooter } from "@/components/layout/AppFooter";
import { AnalysisResultSection } from "@/components/report/AnalysisResultSection";
import { InputHeroSection } from "@/components/report/InputHeroSection";
import {
  ReportInputPanel,
  type ReportInputPanelProps,
} from "@/components/report/ReportInputPanel";
import type { AnalysisSummaryState, MessageState } from "@/types/report";

type ReportAssistantPageViewProps = ReportInputPanelProps & {
  analysisSummary: AnalysisSummaryState;
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

export function ReportAssistantPageView({
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
  ...reportInputPanelProps
}: ReportAssistantPageViewProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6 lg:py-14">
        <InputHeroSection />
        <ReportInputPanel {...reportInputPanelProps} />
        {analysisSummary && (
          <AnalysisResultSection
            analysisSummary={analysisSummary}
            analysisSummaryRef={analysisSummaryRef}
            aiAnalysisText={aiAnalysisText}
            isAiAnalyzing={isAiAnalyzing}
            onAnalyze={onAnalyze}
            onCreateResultSheet={onCreateResultSheet}
            isCreatingResultSheet={isCreatingResultSheet}
            resultSheetMessage={resultSheetMessage}
            resultSheetUrl={resultSheetUrl}
            reportScopeText={reportScopeText}
          />
        )}
        <AppFooter />
      </section>
    </main>
  );
}
