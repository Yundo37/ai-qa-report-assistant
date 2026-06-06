"use client";

import { MessagePanel } from "@/components/report/MessagePanel";
import type { AnalysisSummaryState, MessageState } from "@/types/report";

type ReportDashboardHeaderProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  reportScopeText: string;
  onCreateResultSheet: () => void;
  isCreatingResultSheet: boolean;
  resultSheetMessage: MessageState;
  resultSheetUrl: string;
};

export function ReportDashboardHeader({
  analysisSummary,
  reportScopeText,
  onCreateResultSheet,
  isCreatingResultSheet,
  resultSheetMessage,
  resultSheetUrl,
}: ReportDashboardHeaderProps) {
  const targetVersion =
    analysisSummary.inferredTargetVersion || reportScopeText || "-";
  const rcLabel = analysisSummary.rcProgress?.rcLabel || "-";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Overall QA Result Report
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            QA Release Dashboard
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            현재 입력값으로 생성된 Overall QA 결과입니다. 웹 화면은 메인 QA
            Report로, Google Sheet는 Export / 공유용으로 사용할 수 있습니다.
          </p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-medium text-slate-500">
                Target Version
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {targetVersion}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-medium text-slate-500">RC</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {rcLabel}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-700">
                Generated
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Report Scope</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {reportScopeText}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-semibold text-slate-950">
            Google Sheet Export
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            현재 Dashboard 결과를 Google Spreadsheet 기반 Result Report로
            내보냅니다.
          </p>
          <button
            type="button"
            onClick={onCreateResultSheet}
            disabled={isCreatingResultSheet}
            className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingResultSheet
              ? "Exporting..."
              : "Export to Google Sheet"}
          </button>
          {resultSheetUrl && (
            <button
              type="button"
              onClick={() => window.open(resultSheetUrl, "_blank")}
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              Open Result Report
            </button>
          )}
          {resultSheetMessage && (
            <div className="mt-4">
              <MessagePanel message={resultSheetMessage} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
