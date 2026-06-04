"use client";

import { JiraIssueSheetInput } from "@/components/report/JiraIssueSheetInput";
import { JiraLabelInputList } from "@/components/report/JiraLabelInputList";
import { JiraPeriodInput } from "@/components/report/JiraPeriodInput";
import { MessagePanel } from "@/components/report/MessagePanel";
import { QuickScenarioSelector } from "@/components/report/QuickScenarioSelector";
import { ReportGenerateAction } from "@/components/report/ReportGenerateAction";
import { ReportBasicInfoForm } from "@/components/report/ReportBasicInfoForm";
import { ReportTypeSelector } from "@/components/report/ReportTypeSelector";
import { TestSheetInputList } from "@/components/report/TestSheetInputList";
import type {
  QuickScenarioPreset,
  ReportBasicInfoFormProps,
  ReportTypeSelectorProps,
} from "@/components/report/reportInputTypes";
import type {
  LabelMatchMode,
  MessageState,
  ReportType,
  SheetInput,
  SpreadsheetInfo,
  SpreadsheetSheetInfo,
} from "@/types/report";

export type ReportInputPanelProps = {
  reportType: ReportType;
  isFeatureReport: boolean;
  quickScenarioPresets: Record<string, QuickScenarioPreset>;
  legacyQuickScenarioPresets: Record<string, QuickScenarioPreset>;
  applyingQuickScenario: string;
  onReportTypeChange: ReportTypeSelectorProps["onReportTypeChange"];
  onApplyQuickScenario: (scenarioName: string, preset: QuickScenarioPreset) => void;
  reportTitle: string;
  setReportTitle: ReportBasicInfoFormProps["setReportTitle"];
  reportVersion: string;
  setReportVersion: ReportBasicInfoFormProps["setReportVersion"];
  reportRcVersion: string;
  setReportRcVersion: ReportBasicInfoFormProps["setReportRcVersion"];
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
  jiraIssueSheet: SheetInput;
  setJiraIssueSheet: (sheet: SheetInput) => void;
  setAutoLinkedJiraSheet: (
    sheet: { spreadsheetId: string; gid: string; title: string } | null
  ) => void;
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
  labelMatchMode: LabelMatchMode;
  setLabelMatchMode: (value: LabelMatchMode) => void;
  jiraLabels: string[];
  updateJiraLabel: (index: number, value: string) => void;
  removeJiraLabel: (index: number) => void;
  addJiraLabel: () => void;
  maxJiraLabels: number;
  onGenerateReport: () => void;
  isGenerating: boolean;
  message: MessageState;
};

export function ReportInputPanel({
  reportType,
  isFeatureReport,
  quickScenarioPresets,
  legacyQuickScenarioPresets,
  applyingQuickScenario,
  onReportTypeChange,
  onApplyQuickScenario,
  reportTitle,
  setReportTitle,
  reportVersion,
  setReportVersion,
  reportRcVersion,
  setReportRcVersion,
  testSheets,
  testSheetMetadataList,
  selectedTestSheetGids,
  expandedTestSheetSelections,
  maxTestSheets,
  updateTestSheet,
  finishEditingTestSheet,
  editTestSheet,
  removeTestSheet,
  addTestSheet,
  getAutoLinkedJiraSheetForTestSheet,
  toggleTestSheetSelectionExpanded,
  closeTestSheetSelection,
  toggleSelectedTestSheetGid,
  jiraIssueSheet,
  setJiraIssueSheet,
  setAutoLinkedJiraSheet,
  jiraAnalysisStartDate,
  setJiraAnalysisStartDate,
  jiraAnalysisStartHour,
  setJiraAnalysisStartHour,
  jiraAnalysisStartMinute,
  setJiraAnalysisStartMinute,
  jiraAnalysisEndDate,
  setJiraAnalysisEndDate,
  jiraAnalysisEndHour,
  setJiraAnalysisEndHour,
  jiraAnalysisEndMinute,
  setJiraAnalysisEndMinute,
  updateMinute,
  labelMatchMode,
  setLabelMatchMode,
  jiraLabels,
  updateJiraLabel,
  removeJiraLabel,
  addJiraLabel,
  maxJiraLabels,
  onGenerateReport: handleGenerateReport,
  isGenerating,
  message,
}: ReportInputPanelProps) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
      <ReportTypeSelector
        reportType={reportType}
        onReportTypeChange={onReportTypeChange}
      />
      <QuickScenarioSelector
        isFeatureReport={isFeatureReport}
        quickScenarioPresets={quickScenarioPresets}
        legacyQuickScenarioPresets={legacyQuickScenarioPresets}
        applyingQuickScenario={applyingQuickScenario}
        onApplyQuickScenario={onApplyQuickScenario}
      />
      <ReportBasicInfoForm
        isFeatureReport={isFeatureReport}
        reportTitle={reportTitle}
        setReportTitle={setReportTitle}
        reportVersion={reportVersion}
        setReportVersion={setReportVersion}
        reportRcVersion={reportRcVersion}
        setReportRcVersion={setReportRcVersion}
      />
      <TestSheetInputList
        testSheets={testSheets}
        testSheetMetadataList={testSheetMetadataList}
        selectedTestSheetGids={selectedTestSheetGids}
        expandedTestSheetSelections={expandedTestSheetSelections}
        maxTestSheets={maxTestSheets}
        updateTestSheet={updateTestSheet}
        finishEditingTestSheet={finishEditingTestSheet}
        editTestSheet={editTestSheet}
        removeTestSheet={removeTestSheet}
        addTestSheet={addTestSheet}
        getAutoLinkedJiraSheetForTestSheet={getAutoLinkedJiraSheetForTestSheet}
        toggleTestSheetSelectionExpanded={toggleTestSheetSelectionExpanded}
        closeTestSheetSelection={closeTestSheetSelection}
        toggleSelectedTestSheetGid={toggleSelectedTestSheetGid}
      />
      <JiraIssueSheetInput
        jiraIssueSheet={jiraIssueSheet}
        setJiraIssueSheet={setJiraIssueSheet}
        setAutoLinkedJiraSheet={setAutoLinkedJiraSheet}
      />
      <JiraPeriodInput
        jiraAnalysisStartDate={jiraAnalysisStartDate}
        setJiraAnalysisStartDate={setJiraAnalysisStartDate}
        jiraAnalysisStartHour={jiraAnalysisStartHour}
        setJiraAnalysisStartHour={setJiraAnalysisStartHour}
        jiraAnalysisStartMinute={jiraAnalysisStartMinute}
        setJiraAnalysisStartMinute={setJiraAnalysisStartMinute}
        jiraAnalysisEndDate={jiraAnalysisEndDate}
        setJiraAnalysisEndDate={setJiraAnalysisEndDate}
        jiraAnalysisEndHour={jiraAnalysisEndHour}
        setJiraAnalysisEndHour={setJiraAnalysisEndHour}
        jiraAnalysisEndMinute={jiraAnalysisEndMinute}
        setJiraAnalysisEndMinute={setJiraAnalysisEndMinute}
        updateMinute={updateMinute}
      />
      <JiraLabelInputList
        isFeatureReport={isFeatureReport}
        labelMatchMode={labelMatchMode}
        setLabelMatchMode={setLabelMatchMode}
        jiraLabels={jiraLabels}
        updateJiraLabel={updateJiraLabel}
        removeJiraLabel={removeJiraLabel}
        addJiraLabel={addJiraLabel}
        maxJiraLabels={maxJiraLabels}
      />

      <ReportGenerateAction
        isFeatureReport={isFeatureReport}
        isGenerating={isGenerating}
        onGenerateReport={handleGenerateReport}
      />

      {message && <MessagePanel message={message} />}
    </div>
  );
}
