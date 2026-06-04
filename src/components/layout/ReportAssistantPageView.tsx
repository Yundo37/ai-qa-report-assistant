"use client";

import type { RefObject } from "react";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { AnalysisResultSection } from "@/components/report/AnalysisResultSection";
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
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
        <AppHeader />
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
