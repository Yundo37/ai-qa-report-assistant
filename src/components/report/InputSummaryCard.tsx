import { isJiraSheetTitle } from "@/lib/report/reportFormatting";
import { parseGoogleSheetUrl } from "@/lib/googleSheet";
import type {
  LabelMatchMode,
  ReportType,
  SheetInput,
  SpreadsheetInfo,
} from "@/types/report";

type InputSummaryCardProps = {
  reportType: ReportType;
  reportTitle: string;
  reportVersion: string;
  reportRcVersion: string;
  testSheets: SheetInput[];
  testSheetMetadataList: Array<SpreadsheetInfo | null>;
  selectedTestSheetGids: string[][];
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
  testSheetMetadataList,
  selectedTestSheetGids,
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
  const selectedTestSheetCount = testSheets.reduce(
    (totalCount, testSheet, index) => {
      const gids = selectedTestSheetGids[index] ?? [];
      const metadata = testSheetMetadataList[index];
      const testSheetGids = gids.filter((gid) => {
        const sheetTitle = metadata?.sheets.find((sheet) => sheet.gid === gid)
          ?.title;

        return !sheetTitle || !isJiraSheetTitle(sheetTitle);
      });

      if (testSheetGids.length > 0 || metadata) {
        return totalCount + testSheetGids.length;
      }

      const parsedSheet = parseGoogleSheetUrl(testSheet.url);
      if (parsedSheet.spreadsheetId && parsedSheet.gid) {
        return totalCount + 1;
      }

      return totalCount + testSheetGids.length;
    },
    0
  );
  const filledLabels = jiraLabels.filter((label) => label.trim());
  const labelSummary =
    filledLabels.length > 0
      ? `${filledLabels.length}개 라벨 (${labelMatchMode})`
      : "기간 기준";

  const rows = [
    {
      label: "리포트 유형",
      value: reportType === "OVERALL" ? "전체 QA 리포트" : "기능 QA 리포트",
    },
    { label: "제목", value: reportTitle.trim() || "-" },
    {
      label: "버전 / RC",
      value:
        [reportVersion.trim(), reportRcVersion.trim()].filter(Boolean).join(" ") ||
        "-",
    },
    { label: "테스트 시트", value: `${selectedTestSheetCount}` },
    {
      label: "Jira 시트",
      value: jiraIssueSheet.url.trim() ? "연결됨" : "미연결",
    },
    {
      label: "기간",
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
    { label: "라벨", value: labelSummary },
  ];

  return (
    <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-semibold text-slate-950">입력 요약</h3>
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
