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
export type ReportType = "FEATURE" | "OVERALL";
export type AiExecutiveSummaryTone =
  | "stable"
  | "attention"
  | "risk"
  | "neutral";
export type AiOverallInsightTone = "stable" | "caution" | "risk" | "neutral";

export type AiOverallInsightCard = {
  title: string;
  headline: string;
  description: string;
  tone?: AiOverallInsightTone;
};

export type AiAnalysisSection = {
  title: string;
  body: string;
};

export type AiPriorityCheckItem = {
  title: string;
  reason: string;
  evidence?: string;
  priority?: "high" | "medium" | "low";
};

export type AiExecutiveSummaryResult = {
  releaseJudgment: {
    title: string;
    description: string;
  };
  riskSignals: Array<{
    label: string;
    value?: string | number;
    description: string;
    tone: AiExecutiveSummaryTone;
  }>;
  patternInsight: {
    title: string;
    description: string;
    items?: Array<{
      label: string;
      value?: string | number;
    }>;
  };
  qaCheckpoints: string[];
  overallInsightCards?: AiOverallInsightCard[];
  analysisSections?: AiAnalysisSection[];
  priorityCheckItems?: AiPriorityCheckItem[];
};

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

export type OverallQaSummary = {
  Total: number;
  Pass: number;
  Fail: number;
  Blocked: number;
  NextEvent: number;
  "N/A": number;
};

export type OverallTestSheetSummary = {
  title: string;
  rows: number;
  summary: OverallQaSummary;
};

export type VersionIssueSummaryItem = {
  version: string;
  highHighest: number;
  medium: number;
  low: number;
  total: number;
};

export type IssuePatternSource = {
  key: string;
  summary: string;
  priority: string;
  status: string;
  version: string;
};

export type IssuePatternAnalysisItem = {
  name: string;
  keywords: string[];
  count: number;
  versions: string[];
  sourceTypes: string[];
  trendBasis: "rc" | "version" | "period";
  trend: Array<{
    label: string;
    title: string;
    count: number;
  }>;
};

export type BlockedImpactTestCase = {
  tid: string;
  sheetTitle: string;
  category1: string;
  category2: string;
  category3: string;
  item: string;
  comment: string;
};

export type BlockedImpactItem = {
  jiraKey: string;
  jiraSummary: string;
  displayLabel: string;
  priority: string;
  status: string;
  version?: string;
  blockedCaseCount: number;
  affectedSheets: string[];
  affectedCategories: string[];
  affectedTestCases: BlockedImpactTestCase[];
};

export type BlockedImpactWarning = {
  jiraKey: string;
  jiraSummary: string;
  displayLabel: string;
  status: string;
  reason: string;
  blockedCaseCount: number;
};

export type BlockedImpactSummary = {
  totalBlockedCases: number;
  blockedCauseIssueCount: number;
  topBlockedIssues: BlockedImpactItem[];
  warnings: BlockedImpactWarning[];
};

export type QaAnalysisContext = {
  testSheetTitles: string[];
  scopeKeywords: string[];
  failPatterns: string[];
  blockedPatterns: string[];
};

export type AnalysisSummaryState = {
  reportType: ReportType;
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
  overallQaSummary?: OverallQaSummary;
  overallTestSheets?: OverallTestSheetSummary[];
  versionSummary?: VersionIssueSummaryItem[];
  versionIssueSummary?: VersionIssueSummaryItem[];
  issuePatternSources?: IssuePatternSource[];
  issuePatternAnalysis?: IssuePatternAnalysisItem[];
  blockedImpact?: BlockedImpactSummary;
} | null;
