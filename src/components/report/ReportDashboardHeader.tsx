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
    <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/80 p-6 shadow-sm sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            QA Release Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Overall QA Result Report
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            QA Test Case, Jira Issue, Remaining Issue 데이터를 기반으로 생성된
            웹 중심 QA Release Dashboard입니다.
          </p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <dt className="text-xs font-medium text-slate-500">
                Target Version
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold text-slate-950">
                {targetVersion}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <dt className="text-xs font-medium text-slate-500">RC</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-slate-950">
                {rcLabel}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <dt className="text-xs font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-700">
                Generated
              </dd>
            </div>
          </dl>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-medium text-slate-500">Report Scope</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-950">
              {reportScopeText}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Export
          </p>
          <h2 className="mt-2 text-lg font-bold text-slate-950">
            Google Sheet Export
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            현재 Dashboard 결과를 Google Spreadsheet 기반 Result Report로
            내보냅니다.
          </p>
          <button
            type="button"
            onClick={onCreateResultSheet}
            disabled={isCreatingResultSheet}
            className="mt-4 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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
