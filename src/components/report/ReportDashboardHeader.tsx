"use client";

import { useMemo } from "react";
import { MessagePanel } from "@/components/report/MessagePanel";
import type { AnalysisSummaryState, MessageState } from "@/types/report";

type ReportDashboardHeaderProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  reportScopeText: string;
  reportPeriodText: string;
  onCreateResultSheet: () => void;
  isCreatingResultSheet: boolean;
  resultSheetMessage: MessageState;
  resultSheetUrl: string;
};

export function ReportDashboardHeader({
  analysisSummary,
  reportScopeText,
  reportPeriodText,
  onCreateResultSheet,
  isCreatingResultSheet,
  resultSheetMessage,
  resultSheetUrl,
}: ReportDashboardHeaderProps) {
  const targetVersion =
    analysisSummary.inferredTargetVersion || reportScopeText || "-";
  const scopeLabel = reportPeriodText ? "QA Period" : "Target Scope";
  const scopeValue = reportPeriodText || reportScopeText || "-";
  const rcLabel = analysisSummary.rcProgress?.rcLabel || "-";
  const generatedAt = useMemo(
    () =>
      new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
    []
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/70 p-5 shadow-sm sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            QA Release Dashboard
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Overall QA Result Report
            </h1>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
              {rcLabel}
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Overall QA Result Report based on Google Spreadsheet QA data.
          </p>
          <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5">
              <dt className="text-xs font-medium text-slate-500">
                {scopeLabel}
              </dt>
              <dd className="mt-1 truncate font-semibold text-slate-900">
                {scopeValue}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5">
              <dt className="text-xs font-medium text-slate-500">Version</dt>
              <dd className="mt-1 truncate font-semibold text-slate-900">
                {targetVersion}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5">
              <dt className="text-xs font-medium text-slate-500">Generated</dt>
              <dd className="mt-1 truncate font-semibold text-slate-900">
                {generatedAt}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Export
          </p>
          <h2 className="mt-2 text-lg font-bold text-slate-950">
            Export to Google Sheet
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Exports the current Dashboard result as a Google Spreadsheet Result
            Report.
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
