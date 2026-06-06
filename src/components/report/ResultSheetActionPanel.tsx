"use client";

import { MessagePanel } from "@/components/report/MessagePanel";
import type { MessageState, ReportType } from "@/types/report";

type ResultSheetActionPanelProps = {
  reportType: ReportType;
  onCreateResultSheet: () => void;
  isCreatingResultSheet: boolean;
  resultSheetMessage: MessageState;
  resultSheetUrl: string;
};

export function ResultSheetActionPanel({
  reportType,
  onCreateResultSheet,
  isCreatingResultSheet,
  resultSheetMessage,
  resultSheetUrl,
}: ResultSheetActionPanelProps) {
  const isOverallReport = reportType === "OVERALL";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-950">
            {isOverallReport ? "Google Sheet Export" : "Result Report"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {isOverallReport
              ? "전체 QA 결과를 Google Spreadsheet 기반 Overall QA Dashboard 결과 리포트로 내보냅니다."
              : "현재 분석 결과를 Google Spreadsheet 기반 Result Report로 생성합니다."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateResultSheet}
          disabled={isCreatingResultSheet}
          className="min-w-44 whitespace-nowrap rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 md:shrink-0"
        >
          {isCreatingResultSheet
            ? isOverallReport
              ? "Exporting..."
              : "Creating Result Report..."
            : isOverallReport
              ? "Export to Google Sheet"
              : "Create Result Report"}
        </button>
      </div>
      {resultSheetMessage && <MessagePanel message={resultSheetMessage} />}
      {resultSheetUrl && (
        <button
          type="button"
          onClick={() => window.open(resultSheetUrl, "_blank")}
          className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          Open Result Report
        </button>
      )}
    </section>
  );
}
