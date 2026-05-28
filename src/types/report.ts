export type SheetInput = {
  url: string;
  isEditing: boolean;
};

export type ParsedSheetUrl = {
  url: string;
  spreadsheetId: string | null;
  gid: string | null;
};

export type MessageState =
  | {
      type: "error";
      title: string;
      items: string[];
    }
  | {
      type: "success";
      title: string;
      items: string[];
    }
  | null;

export type CsvRecord = Record<string, string>;
export type CountSummary = Record<string, number>;
export type LabelMatchMode = "ANY" | "ALL";

export type SpreadsheetSheetInfo = {
  title: string;
  gid: string;
};

export type SpreadsheetInfo = {
  title: string;
  sheets: SpreadsheetSheetInfo[];
};

export type TestSheetSummary = {
  title: string;
  rows: number;
  summary: CountSummary;
};

export type RemainingIssue = {
  priority: string;
  key: string;
  summary: string;
  status: string;
  version: string;
};

export type RcPrioritySummary = {
  Highest: number;
  High: number;
  Medium: number;
  Low: number;
  Lowest: number;
};

export type RcProgressItem = {
  rc: string;
  newIssues: number;
  fixedIssues: number;
  resolvedIssues: number;
  remainingIssues: number;
  reopenedIssues: number;
  prioritySummary: RcPrioritySummary;
};

export type RcProgressSummary = {
  rcLabel: string;
  newIssues: number;
  fixedIssues: number;
  resolvedIssues: number;
  remainingIssues: number;
  reopenedIssues: number;
  items: RcProgressItem[];
};

export type QaIssueOverviewSection = {
  total: number;
  prioritySummary: RcPrioritySummary;
};

export type QaIssueOverviewSummary = {
  created: QaIssueOverviewSection;
  resolved: QaIssueOverviewSection;
  remaining: QaIssueOverviewSection;
};

export type QaAnalysisContext = {
  testSheetTitles: string[];
  scopeKeywords: string[];
  failPatterns: string[];
  blockedPatterns: string[];
};

export type AnalysisSummaryState = {
  resultSpreadsheetId: string;
  qaTotal: CountSummary;
  testSheets: TestSheetSummary[];
  jiraFiltered: CountSummary;
  jiraStatus: CountSummary;
  jiraPriority: CountSummary;
  jiraMatchedRows: number;
  remainingIssues: RemainingIssue[];
  rcProgress: RcProgressSummary;
  qaIssueOverview: QaIssueOverviewSummary;
  qaFollowUps: string[];
  inferredTargetVersion: string;
  qaAnalysisContext: QaAnalysisContext;
} | null;
