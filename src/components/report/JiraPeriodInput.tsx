import { DateTimeInputs } from "@/components/report/DateTimeInputs";
import type { JiraPeriodInputProps } from "@/components/report/reportInputTypes";

export function JiraPeriodInput({
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
}: JiraPeriodInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        Jira Analysis Period
      </label>
      <p className="mb-4 text-sm leading-6 text-slate-500">
        End DateTime을 비워두면 현재 시점까지 분석합니다.
      </p>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <DateTimeInputs
          label="Start DateTime"
          date={jiraAnalysisStartDate}
          hour={jiraAnalysisStartHour}
          minute={jiraAnalysisStartMinute}
          onDateChange={setJiraAnalysisStartDate}
          onHourChange={setJiraAnalysisStartHour}
          onMinuteChange={(value) => updateMinute(value, setJiraAnalysisStartMinute)}
        />
        <span className="hidden pb-3 text-sm text-slate-400 lg:block">~</span>
        <DateTimeInputs
          label="End DateTime"
          date={jiraAnalysisEndDate}
          hour={jiraAnalysisEndHour}
          minute={jiraAnalysisEndMinute}
          onDateChange={setJiraAnalysisEndDate}
          onHourChange={setJiraAnalysisEndHour}
          onMinuteChange={(value) => updateMinute(value, setJiraAnalysisEndMinute)}
        />
      </div>
    </div>
  );
}
