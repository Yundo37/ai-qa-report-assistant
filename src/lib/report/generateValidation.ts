import {
  buildAnalysisDateTime,
  createReportTitle,
} from "@/lib/report/reportFormatting";
import type { ReportType, SheetInput } from "@/types/report";

type CreateGenerateInputValidationParams = {
  testSheets: SheetInput[];
  reportType: ReportType;
  jiraLabels: string[];
  jiraIssueSheet: SheetInput;
  jiraAnalysisStartDate: string;
  jiraAnalysisStartHour: string;
  jiraAnalysisStartMinute: string;
  jiraAnalysisEndDate: string;
  jiraAnalysisEndHour: string;
  jiraAnalysisEndMinute: string;
  reportTitle: string;
};

export function createGenerateInputValidation({
  testSheets,
  reportType,
  jiraLabels,
  jiraIssueSheet,
  jiraAnalysisStartDate,
  jiraAnalysisStartHour,
  jiraAnalysisStartMinute,
  jiraAnalysisEndDate,
  jiraAnalysisEndHour,
  jiraAnalysisEndMinute,
  reportTitle,
}: CreateGenerateInputValidationParams) {
  const validTestSheetEntries = testSheets
    .map((sheet, index) => ({ url: sheet.url.trim(), index }))
    .filter((sheet) => Boolean(sheet.url));
  const validTestSheetUrls = validTestSheetEntries.map((sheet) => sheet.url);
  const validJiraLabels =
    reportType === "FEATURE"
      ? jiraLabels.map((label) => label.trim()).filter(Boolean)
      : [];
  const jiraIssueSheetUrl = jiraIssueSheet.url.trim();
  const jiraAnalysisStartDateTime = buildAnalysisDateTime(
    jiraAnalysisStartDate,
    jiraAnalysisStartHour,
    jiraAnalysisStartMinute
  );
  const jiraAnalysisEndDateTime = buildAnalysisDateTime(
    jiraAnalysisEndDate,
    jiraAnalysisEndHour,
    jiraAnalysisEndMinute
  );
  const missingItems: string[] = [];

  const reportName = reportTitle.trim();
  const generatedReportTitle =
    reportType === "FEATURE"
      ? createReportTitle(reportName)
      : reportName || "Overall QA Report";

  if (!reportName) {
    missingItems.push(
      reportType === "FEATURE"
        ? "Feature Name을 입력해주세요."
        : "Overall Report Title을 입력해주세요."
    );
  }
  if (validTestSheetUrls.length === 0) {
    missingItems.push("Test Sheets URL을 1개 이상 입력해주세요.");
  }
  if (!jiraIssueSheetUrl) missingItems.push("Jira Issue Sheet URL을 입력해주세요.");
  if (!jiraAnalysisStartDateTime) {
    missingItems.push("Jira Analysis Start DateTime을 입력해주세요.");
  }

  return {
    validTestSheetEntries,
    validTestSheetUrls,
    validJiraLabels,
    jiraIssueSheetUrl,
    jiraAnalysisStartDateTime,
    jiraAnalysisEndDateTime,
    reportName,
    generatedReportTitle,
    missingItems,
  };
}
