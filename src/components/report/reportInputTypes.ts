import type {
  LabelMatchMode,
  ReportType,
  SheetInput,
  SpreadsheetInfo,
  SpreadsheetSheetInfo,
} from "@/types/report";

export type QuickScenarioPreset = {
  featureName: string;
  version: string;
  rcVersion: string;
  spreadsheetUrl: string;
  testSheetTitles: string[];
  jiraSheetTitle: string;
  testSheetGroups?: Array<{
    spreadsheetUrl: string;
    testSheetTitles: string[];
    jiraSheetTitle?: string;
  }>;
  startDate: string;
  startHour: string;
  startMinute: string;
  endDate: string;
  endHour: string;
  endMinute: string;
  labels: string[];
  labelMatchMode: LabelMatchMode;
};

export type ReportTypeSelectorProps = {
  reportType: ReportType;
  onReportTypeChange: (reportType: ReportType) => void;
};

export type QuickScenarioSelectorProps = {
  isFeatureReport: boolean;
  quickScenarioPresets: Record<string, QuickScenarioPreset>;
  legacyQuickScenarioPresets: Record<string, QuickScenarioPreset>;
  applyingQuickScenario: string;
  onApplyQuickScenario: (scenarioName: string, preset: QuickScenarioPreset) => void;
};

export type ReportBasicInfoFormProps = {
  isFeatureReport: boolean;
  reportTitle: string;
  setReportTitle: (value: string) => void;
  reportVersion: string;
  setReportVersion: (value: string) => void;
  reportRcVersion: string;
  setReportRcVersion: (value: string) => void;
};

export type TestSheetInputListProps = {
  testSheets: SheetInput[];
  testSheetMetadataList: Array<SpreadsheetInfo | null>;
  selectedTestSheetGids: string[][];
  expandedTestSheetSelections: boolean[];
  maxTestSheets: number;
  updateTestSheet: (index: number, url: string) => void;
  finishEditingTestSheet: (index: number) => void;
  editTestSheet: (index: number) => void;
  removeTestSheet: (index: number) => void;
  addTestSheet: () => void;
  getAutoLinkedJiraSheetForTestSheet: (url: string) => SpreadsheetSheetInfo | null;
  toggleTestSheetSelectionExpanded: (index: number) => void;
  closeTestSheetSelection: (index: number) => void;
  toggleSelectedTestSheetGid: (index: number, sheet: SpreadsheetSheetInfo) => void;
};

export type JiraIssueSheetInputProps = {
  jiraIssueSheet: SheetInput;
  setJiraIssueSheet: (sheet: SheetInput) => void;
  setAutoLinkedJiraSheet: (
    sheet: { spreadsheetId: string; gid: string; title: string } | null
  ) => void;
};

export type JiraPeriodInputProps = {
  jiraAnalysisStartDate: string;
  setJiraAnalysisStartDate: (value: string) => void;
  jiraAnalysisStartHour: string;
  setJiraAnalysisStartHour: (value: string) => void;
  jiraAnalysisStartMinute: string;
  setJiraAnalysisStartMinute: (value: string) => void;
  jiraAnalysisEndDate: string;
  setJiraAnalysisEndDate: (value: string) => void;
  jiraAnalysisEndHour: string;
  setJiraAnalysisEndHour: (value: string) => void;
  jiraAnalysisEndMinute: string;
  setJiraAnalysisEndMinute: (value: string) => void;
  updateMinute: (value: string, setter: (value: string) => void) => void;
};

export type JiraLabelInputListProps = {
  isFeatureReport: boolean;
  labelMatchMode: LabelMatchMode;
  setLabelMatchMode: (value: LabelMatchMode) => void;
  jiraLabels: string[];
  updateJiraLabel: (index: number, value: string) => void;
  removeJiraLabel: (index: number) => void;
  addJiraLabel: () => void;
  maxJiraLabels: number;
};
