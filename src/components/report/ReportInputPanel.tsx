"use client";

import { AiAnalysisToggle } from "@/components/report/AiAnalysisToggle";
import { InputVisualIcon } from "@/components/report/InputVisualIcon";
import { JiraIssueSheetInput } from "@/components/report/JiraIssueSheetInput";
import { JiraLabelInputList } from "@/components/report/JiraLabelInputList";
import { JiraPeriodInput } from "@/components/report/JiraPeriodInput";
import { InputStepCard } from "@/components/report/InputStepCard";
import { InputSummaryCard } from "@/components/report/InputSummaryCard";
import { MessagePanel } from "@/components/report/MessagePanel";
import { QuickScenarioSelector } from "@/components/report/QuickScenarioSelector";
import { ReportGenerateAction } from "@/components/report/ReportGenerateAction";
import { ReportBasicInfoForm } from "@/components/report/ReportBasicInfoForm";
import { ReportTypeSelector } from "@/components/report/ReportTypeSelector";
import { TestSheetInputList } from "@/components/report/TestSheetInputList";
import type {
  AiAnalysisToggleProps,
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
  hasSelectedReportType: boolean;
  isFeatureReport: boolean;
  quickScenarioPresets: Record<string, QuickScenarioPreset>;
  legacyQuickScenarioPresets: Record<string, QuickScenarioPreset>;
  applyingQuickScenario: string;
  analysisMode: AiAnalysisToggleProps["analysisMode"];
  onReportTypeChange: ReportTypeSelectorProps["onReportTypeChange"];
  onApplyQuickScenario: (scenarioName: string, preset: QuickScenarioPreset) => void;
  onAnalysisModeChange: AiAnalysisToggleProps["onAnalysisModeChange"];
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
  hasSelectedReportType,
  isFeatureReport,
  quickScenarioPresets,
  legacyQuickScenarioPresets,
  applyingQuickScenario,
  analysisMode,
  onReportTypeChange,
  onApplyQuickScenario,
  onAnalysisModeChange,
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
  const connectedTestSheetCount = testSheets.filter((sheet) =>
    sheet.url.trim()
  ).length;
  const hasAutoLinkedJiraSheet = testSheets.some((sheet) =>
    getAutoLinkedJiraSheetForTestSheet(sheet.url)
  );

  return (
    <div className="space-y-6">
      <ReportTypeSelector
        reportType={reportType}
        hasSelectedReportType={hasSelectedReportType}
        onReportTypeChange={onReportTypeChange}
      />
      {hasSelectedReportType && (
        <>
          <QuickScenarioSelector
            isFeatureReport={isFeatureReport}
            quickScenarioPresets={quickScenarioPresets}
            legacyQuickScenarioPresets={legacyQuickScenarioPresets}
            applyingQuickScenario={applyingQuickScenario}
            onApplyQuickScenario={onApplyQuickScenario}
          />

          <InputStepCard
            step="STEP 1"
            title="리포트 정보"
            description="생성할 QA 리포트의 제목과 대상 버전을 설정합니다. 빠른 시나리오를 사용하면 자동으로 채워집니다."
          >
            <ReportBasicInfoForm
              isFeatureReport={isFeatureReport}
              reportTitle={reportTitle}
              setReportTitle={setReportTitle}
              reportVersion={reportVersion}
              setReportVersion={setReportVersion}
              reportRcVersion={reportRcVersion}
              setReportRcVersion={setReportRcVersion}
            />
          </InputStepCard>

      <InputStepCard
        step="STEP 2"
        title="데이터 소스"
        description="QA 테스트 케이스 시트와 Jira 이슈 시트를 연결합니다. 선택한 시트 기준으로 QA 요약과 Jira 요약이 생성됩니다."
      >
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            테스트 시트: {connectedTestSheetCount > 0 ? "연결됨" : "미연결"}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Jira 시트: {jiraIssueSheet.url.trim() ? "연결됨" : "미연결"}
          </span>
          {hasAutoLinkedJiraSheet && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              자동 연결됨
            </span>
          )}
        </div>
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
      </InputStepCard>

      <InputStepCard
        step="STEP 3"
        title="분석 기간"
        description="Jira 이슈를 분석할 기간을 설정합니다. 전체 QA 리포트는 기간 기준으로 전체 이슈 흐름을 집계합니다."
      >
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
      </InputStepCard>

      <InputStepCard
        step="STEP 4"
        title="Jira 필터"
        description={
          isFeatureReport
            ? "기능 QA 리포트는 라벨 기준으로 특정 기능의 Jira 이슈를 필터링합니다."
            : "전체 QA 리포트는 기본적으로 기간 기준으로 Jira 이슈를 분석하며, 라벨은 필요 시 보조 필터로 사용할 수 있습니다."
        }
      >
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
        {!isFeatureReport && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            전체 QA 리포트는 현재 입력한 Jira 분석 기간을 기준으로 이슈를 분석합니다.
          </div>
        )}
      </InputStepCard>

      <InputStepCard
        id="generate-report-section"
        className="scroll-mt-8"
        step="STEP 5"
        title="QA 리포트 생성"
        description="입력값을 기반으로 QA 요약, Jira 요약, 잔여 이슈, AI 분석 준비 데이터를 생성합니다."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <ReportGenerateAction
              isFeatureReport={isFeatureReport}
              isGenerating={isGenerating}
              onGenerateReport={handleGenerateReport}
            />
            <AiAnalysisToggle
              analysisMode={analysisMode}
              onAnalysisModeChange={onAnalysisModeChange}
            />
            {message && <MessagePanel message={message} />}
            <p className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-xs font-medium text-emerald-700">
              <InputVisualIcon variant="privacy" className="size-6 rounded-lg" />
              입력된 데이터는 리포트 분석 목적으로만 사용됩니다.
            </p>
          </div>
          <InputSummaryCard
            reportType={reportType}
            reportTitle={reportTitle}
            reportVersion={reportVersion}
            reportRcVersion={reportRcVersion}
            testSheets={testSheets}
            testSheetMetadataList={testSheetMetadataList}
            selectedTestSheetGids={selectedTestSheetGids}
            jiraIssueSheet={jiraIssueSheet}
            jiraAnalysisStartDate={jiraAnalysisStartDate}
            jiraAnalysisStartHour={jiraAnalysisStartHour}
            jiraAnalysisStartMinute={jiraAnalysisStartMinute}
            jiraAnalysisEndDate={jiraAnalysisEndDate}
            jiraAnalysisEndHour={jiraAnalysisEndHour}
            jiraAnalysisEndMinute={jiraAnalysisEndMinute}
            jiraLabels={jiraLabels}
            labelMatchMode={labelMatchMode}
          />
        </div>
      </InputStepCard>
        </>
      )}
    </div>
  );
}
