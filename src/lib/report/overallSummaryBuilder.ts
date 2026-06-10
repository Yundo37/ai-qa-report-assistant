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
    qaFollowUps: string[],
    options?: {
      startDateTime?: string;
      endDateTime?: string | null;
    }
  ) => IssuePatternAnalysisItem[];
  jiraAnalysisStartDateTime?: string;
  jiraAnalysisEndDateTime?: string | null;
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
  jiraAnalysisStartDateTime,
  jiraAnalysisEndDateTime,
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
    filteredJiraIssues,
    remainingIssues,
    qaFollowUps,
    {
      startDateTime: jiraAnalysisStartDateTime,
      endDateTime: jiraAnalysisEndDateTime,
    }
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
