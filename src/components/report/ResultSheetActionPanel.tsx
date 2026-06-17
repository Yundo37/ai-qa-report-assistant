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
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-950">
            {isOverallReport ? "Google Sheet Export" : "결과 시트 생성"}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            {isOverallReport
              ? "전체 QA 결과를 Google Spreadsheet 기반 Overall QA Dashboard 결과 리포트로 내보냅니다."
              : "현재 분석 결과를 Google Spreadsheet 기반 Result Report로 생성합니다."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateResultSheet}
          disabled={isCreatingResultSheet}
          className="min-w-40 max-w-full shrink-0 whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreatingResultSheet
            ? isOverallReport
              ? "Exporting..."
              : "결과 시트 생성 중..."
            : isOverallReport
              ? "Export to Google Sheet"
              : "결과 시트 생성"}
        </button>
      </div>
      {resultSheetMessage && <MessagePanel message={resultSheetMessage} />}
      {resultSheetUrl && (
        <button
          type="button"
          onClick={() => window.open(resultSheetUrl, "_blank")}
          className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          결과 리포트 열기
        </button>
      )}
    </section>
  );
}
