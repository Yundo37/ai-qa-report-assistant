import type { LabelMatchMode, ReportType, SheetInput } from "@/types/report";

type InputSummaryCardProps = {
  reportType: ReportType;
  reportTitle: string;
  reportVersion: string;
  reportRcVersion: string;
  testSheets: SheetInput[];
  jiraIssueSheet: SheetInput;
  jiraAnalysisStartDate: string;
  jiraAnalysisStartHour: string;
  jiraAnalysisStartMinute: string;
  jiraAnalysisEndDate: string;
  jiraAnalysisEndHour: string;
  jiraAnalysisEndMinute: string;
  jiraLabels: string[];
  labelMatchMode: LabelMatchMode;
};

function formatDateTime(date: string, hour: string, minute: string) {
  if (!date) return "-";

  return `${date} ${hour || "00"}:${minute || "00"}`;
}

export function InputSummaryCard({
  reportType,
  reportTitle,
  reportVersion,
  reportRcVersion,
  testSheets,
  jiraIssueSheet,
  jiraAnalysisStartDate,
  jiraAnalysisStartHour,
  jiraAnalysisStartMinute,
  jiraAnalysisEndDate,
  jiraAnalysisEndHour,
  jiraAnalysisEndMinute,
  jiraLabels,
  labelMatchMode,
}: InputSummaryCardProps) {
  const connectedTestSheetCount = testSheets.filter((sheet) =>
    sheet.url.trim()
  ).length;
  const filledLabels = jiraLabels.filter((label) => label.trim());
  const labelSummary =
    filledLabels.length > 0
      ? `${filledLabels.length} labels (${labelMatchMode})`
      : "Period only";

  const rows = [
    {
      label: "Report Type",
      value: reportType === "OVERALL" ? "Overall Report" : "Feature Report",
    },
    { label: "Title", value: reportTitle.trim() || "-" },
    {
      label: "Version / RC",
      value:
        [reportVersion.trim(), reportRcVersion.trim()].filter(Boolean).join(" ") ||
        "-",
    },
    { label: "Test Sheets", value: `${connectedTestSheetCount}` },
    {
      label: "Jira Sheet",
      value: jiraIssueSheet.url.trim() ? "Connected" : "Not connected",
    },
    {
      label: "Period",
      value: `${formatDateTime(
        jiraAnalysisStartDate,
        jiraAnalysisStartHour,
        jiraAnalysisStartMinute
      )} ~ ${formatDateTime(
        jiraAnalysisEndDate,
        jiraAnalysisEndHour,
        jiraAnalysisEndMinute
      )}`,
    },
    { label: "Labels", value: labelSummary },
  ];

  return (
    <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-semibold text-slate-950">Input Summary</h3>
      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-4 text-sm">
            <dt className="w-28 shrink-0 text-slate-500">{row.label}</dt>
            <dd className="min-w-0 flex-1 break-words font-medium text-slate-800">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
