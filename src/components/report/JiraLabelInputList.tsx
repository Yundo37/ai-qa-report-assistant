import type { JiraLabelInputListProps } from "@/components/report/reportInputTypes";

export function JiraLabelInputList({
  isFeatureReport,
  labelMatchMode,
  setLabelMatchMode,
  jiraLabels,
  updateJiraLabel,
  removeJiraLabel,
  addJiraLabel,
  maxJiraLabels: MAX_JIRA_LABELS,
}: JiraLabelInputListProps) {
  if (!isFeatureReport) return null;

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="block text-sm font-semibold text-slate-800">
          Jira 참조 라벨
        </label>
        <div className="flex gap-2">
          {(["ANY", "ALL"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setLabelMatchMode(mode)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                labelMatchMode === mode
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-700"
              }`}
            >
              {mode} ({mode === "ANY" ? "OR" : "AND"})
            </button>
          ))}
        </div>
      </div>
      <p className="mb-4 text-sm leading-6 text-slate-500">
        Jira 이슈 시트에서 참고할 label 또는 keyword를 입력하세요. 입력한
        label 기준으로 관련 이슈를 분석합니다.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {jiraLabels.map((label, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={label}
              onChange={(event) => updateJiraLabel(index, event.target.value)}
              placeholder="예: 커뮤니티미션"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {jiraLabels.length > 1 && (
              <button
                onClick={() => removeJiraLabel(index)}
                className="min-h-11 rounded-xl border border-slate-300 px-3 text-xs font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600"
              >
                -
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <button
          onClick={addJiraLabel}
          disabled={jiraLabels.length >= MAX_JIRA_LABELS}
          className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + 라벨 추가
        </button>
        <span className="text-xs text-slate-500">
          {jiraLabels.length}/{MAX_JIRA_LABELS}
        </span>
      </div>
    </div>
  );
}
