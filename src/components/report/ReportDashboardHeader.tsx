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
    <section className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/50 to-violet-50/80 p-5 shadow-lg shadow-indigo-100/50 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            QA Release Dashboard
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Overall QA Result Report
            </h1>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700 ring-1 ring-violet-200">
              {rcLabel}
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Overall QA Result Report based on Google Spreadsheet QA data.
          </p>
          <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-indigo-100 bg-white/85 px-3 py-2.5 shadow-sm">
              <dt className="text-xs font-medium text-slate-500">
                {scopeLabel}
              </dt>
              <dd className="mt-1 truncate font-semibold text-slate-900">
                {scopeValue}
              </dd>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-white/85 px-3 py-2.5 shadow-sm">
              <dt className="text-xs font-medium text-slate-500">Version</dt>
              <dd className="mt-1 truncate font-semibold text-slate-900">
                {targetVersion}
              </dd>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-white/85 px-3 py-2.5 shadow-sm">
              <dt className="text-xs font-medium text-slate-500">Generated</dt>
              <dd className="mt-1 truncate font-semibold text-slate-900">
                {generatedAt}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[1.75rem] border border-indigo-100 bg-white/85 p-4 shadow-sm">
          <div className="relative h-36 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-100 via-violet-100 to-white">
            <div className="absolute inset-4 rounded-full border border-indigo-200/70" />
            <div className="absolute inset-x-10 top-8 h-20 rounded-full border border-violet-200/70" />
            <div className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-black text-white shadow-xl shadow-indigo-300/70">
              AI
            </div>
            <span className="absolute left-7 top-8 size-2 rounded-full bg-violet-500" />
            <span className="absolute right-9 top-10 size-2 rounded-full bg-indigo-400" />
            <span className="absolute bottom-9 left-12 size-1.5 rounded-full bg-indigo-300" />
            <span className="absolute bottom-8 right-12 size-1.5 rounded-full bg-violet-300" />
          </div>

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
