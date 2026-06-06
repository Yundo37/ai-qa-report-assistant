import type { ReportInputPanelProps } from "@/components/report/ReportInputPanel";

type CollapsedInputSummaryBarProps = Pick<
  ReportInputPanelProps,
  | "reportType"
  | "reportTitle"
  | "reportVersion"
  | "reportRcVersion"
  | "testSheets"
  | "jiraIssueSheet"
> & {
  onEditInput: () => void;
};

export function CollapsedInputSummaryBar({
  reportType,
  reportTitle,
  reportVersion,
  reportRcVersion,
  testSheets,
  jiraIssueSheet,
  onEditInput,
}: CollapsedInputSummaryBarProps) {
  const connectedTestSheetCount = testSheets.filter((sheet) =>
    sheet.url.trim()
  ).length;
  const versionText =
    [reportVersion.trim(), reportRcVersion.trim()].filter(Boolean).join(" ") ||
    "-";

  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current Input
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="font-semibold text-slate-950">
              {reportType === "OVERALL" ? "Overall Report" : "Feature Report"}
            </span>
            <span className="text-slate-500">{versionText}</span>
            <span className="text-slate-500">
              Test Sheets {connectedTestSheetCount}
            </span>
            <span
              className={
                jiraIssueSheet.url.trim()
                  ? "text-emerald-700"
                  : "text-slate-400"
              }
            >
              Jira {jiraIssueSheet.url.trim() ? "Connected" : "Not connected"}
            </span>
          </div>
          {reportTitle.trim() && (
            <p className="mt-2 truncate text-sm text-slate-600">
              {reportTitle.trim()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onEditInput}
          className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          입력값 수정
        </button>
      </div>
    </section>
  );
}
