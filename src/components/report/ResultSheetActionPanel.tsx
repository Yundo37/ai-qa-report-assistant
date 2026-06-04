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
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-100">
            Result Report
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {reportType === "FEATURE"
              ? "현재 분석 결과를 Google Spreadsheet 기반 Result Report로 생성합니다."
              : "전체 QA 결과를 Google Spreadsheet 기반 Overall QA Dashboard 결과 리포트로 생성합니다."}
          </p>
          <p className="hidden">
            현재 분석 결과를 Google Spreadsheet 기반 Result Report로 생성합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateResultSheet}
          disabled={isCreatingResultSheet}
          className="min-w-44 whitespace-nowrap rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.18)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 md:shrink-0"
        >
          {isCreatingResultSheet
            ? "Creating Result Report..."
            : "Create Result Report"}
        </button>
      </div>
      {resultSheetMessage && <MessagePanel message={resultSheetMessage} />}
      {resultSheetUrl && (
        <button
          type="button"
          onClick={() => window.open(resultSheetUrl, "_blank")}
          className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Open Result Report
        </button>
      )}
    </section>
  );
}
