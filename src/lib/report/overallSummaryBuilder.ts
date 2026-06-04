import { createOverallQaSummary } from "@/lib/report/overallQaSummary";
import type {
  CsvRecord,
  IssuePatternAnalysisItem,
  IssuePatternSource,
  RemainingIssue,
  VersionIssueSummaryItem,
} from "@/types/report";

type SelectedTestSheet = {
  title: string;
};

type CreateOverallSummaryBundleParams = {
  allParsedTestSheetData: CsvRecord[];
  parsedTestSheetDataList: CsvRecord[][];
  selectedTestSheets: SelectedTestSheet[];
  filteredJiraIssues: CsvRecord[];
  parsedJiraIssueData: CsvRecord[];
  remainingIssues: RemainingIssue[];
  qaFollowUps: string[];
  createVersionIssueSummary: (records: CsvRecord[]) => VersionIssueSummaryItem[];
  createBaseVersionIssueSummary: (records: CsvRecord[]) => VersionIssueSummaryItem[];
  createIssuePatternSources: (records: CsvRecord[]) => IssuePatternSource[];
  createIssuePatternAnalysis: (
    jiraRecords: CsvRecord[],
    remainingIssues: RemainingIssue[],
    qaFollowUps: string[]
  ) => IssuePatternAnalysisItem[];
};

export function createOverallSummaryBundle({
  allParsedTestSheetData,
  parsedTestSheetDataList,
  selectedTestSheets,
  filteredJiraIssues,
  parsedJiraIssueData,
  remainingIssues,
  qaFollowUps,
  createVersionIssueSummary,
  createBaseVersionIssueSummary,
  createIssuePatternSources,
  createIssuePatternAnalysis,
}: CreateOverallSummaryBundleParams) {
  const overallQaSummary = createOverallQaSummary(allParsedTestSheetData);
  const overallTestSheets = parsedTestSheetDataList.map(
    (parsedTestSheetData, index) => ({
      title: selectedTestSheets[index].title,
      rows: parsedTestSheetData.length,
      summary: createOverallQaSummary(parsedTestSheetData),
    })
  );
  const versionIssueSummary = createVersionIssueSummary(filteredJiraIssues);
  const versionSummary = createBaseVersionIssueSummary(parsedJiraIssueData);
  const issuePatternSources = createIssuePatternSources(parsedJiraIssueData);
  const issuePatternAnalysis = createIssuePatternAnalysis(
    parsedJiraIssueData,
    remainingIssues,
    qaFollowUps
  );

  return {
    overallQaSummary,
    overallTestSheets,
    versionIssueSummary,
    versionSummary,
    issuePatternSources,
    issuePatternAnalysis,
  };
}
