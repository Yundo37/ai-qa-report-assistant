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
    <div className="mb-10">
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="block text-sm font-semibold text-zinc-200">
      Jira Reference Labels
        </label>
        <div className="flex gap-2">
      {(["ANY", "ALL"] as const).map((mode) => (
        <button
        key={mode}
        type="button"
        onClick={() => setLabelMatchMode(mode)}
        className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
          labelMatchMode === mode
        ? "bg-white text-black"
        : "border border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
        }`}
        >
        {mode} ({mode === "ANY" ? "OR" : "AND"})
        </button>
      ))}
        </div>
      </div>
      <p className="mb-4 text-sm leading-6 text-zinc-500">
        Jira 이슈 시트에서 참고할 label 또는 keyword를 입력하세요.
        입력된 label 기준으로 관련 이슈를 분석합니다.
        <br />
        Label을 입력하지 않으면 Jira Analysis Period 기준으로만 이슈를
        분석합니다.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {jiraLabels.map((label, index) => (
      <div key={index} className="flex gap-2">
        <input
        type="text"
        value={label}
        onChange={(event) => updateJiraLabel(index, event.target.value)}
        placeholder="payment"
        className="min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
        />
        {jiraLabels.length > 1 && (
        <button
          onClick={() => removeJiraLabel(index)}
          className="min-h-11 rounded-xl border border-zinc-700 px-3 text-xs text-zinc-300 transition hover:border-red-400 hover:text-red-300"
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
      className="rounded-xl border border-dashed border-zinc-600 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
      + Add Label
        </button>
        <span className="text-xs text-zinc-500">
      {jiraLabels.length}/{MAX_JIRA_LABELS}
        </span>
      </div>
    </div>
  );
}
