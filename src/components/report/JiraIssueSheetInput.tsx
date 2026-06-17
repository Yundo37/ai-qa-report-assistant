import { InputVisualIcon } from "@/components/report/InputVisualIcon";
import type { JiraIssueSheetInputProps } from "@/components/report/reportInputTypes";

export function JiraIssueSheetInput({
  jiraIssueSheet,
  setJiraIssueSheet,
  setAutoLinkedJiraSheet,
}: JiraIssueSheetInputProps) {
  return (
    <div className="border-t border-slate-200 pt-6">
      <div className="mb-2 flex items-center gap-2">
        <InputVisualIcon variant="jira-sheet" className="size-7 rounded-lg" />
        <label className="block text-sm font-semibold text-slate-800">
          Jira 이슈 시트
        </label>
      </div>
      <p className="mb-3 text-sm leading-6 text-slate-500">
        Jira for Cloud Google Sheets 앱을 통해 불러온 전체 이슈 시트 URL을
        입력하세요.
      </p>
      {jiraIssueSheet.isEditing ? (
        <input
          type="text"
          value={jiraIssueSheet.url}
          onChange={(event) => {
            setJiraIssueSheet({ ...jiraIssueSheet, url: event.target.value });
            setAutoLinkedJiraSheet(null);
          }}
          onBlur={() => {
            if (jiraIssueSheet.url.trim()) {
              setJiraIssueSheet({ ...jiraIssueSheet, isEditing: false });
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && jiraIssueSheet.url.trim()) {
              setJiraIssueSheet({ ...jiraIssueSheet, isEditing: false });
            }
          }}
          placeholder="https://docs.google.com/spreadsheets/..."
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      ) : (
        <div className="flex min-h-12 min-w-0 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4">
          <a
            href={jiraIssueSheet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm text-indigo-600 underline-offset-4 transition hover:text-indigo-800 hover:underline"
          >
            {jiraIssueSheet.url}
          </a>
          <button
            onClick={() =>
              setJiraIssueSheet({ ...jiraIssueSheet, isEditing: true })
            }
            title="Edit URL"
            className="ml-4 shrink-0 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
