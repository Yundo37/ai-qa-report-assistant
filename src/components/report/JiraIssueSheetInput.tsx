import type { JiraIssueSheetInputProps } from "@/components/report/reportInputTypes";

export function JiraIssueSheetInput({
  jiraIssueSheet,
  setJiraIssueSheet,
  setAutoLinkedJiraSheet,
}: JiraIssueSheetInputProps) {
  return (
    <div className="mb-8">
      <label className="mb-2 block text-sm font-semibold text-zinc-200">
        Jira Issue Sheet
      </label>
      <p className="mb-3 text-sm leading-6 text-zinc-500">
        Jira for Cloud Google Sheets 등을 통해 불러온 전체 이슈 시트 URL을
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
      className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
        />
      ) : (
        <div className="flex min-h-12 min-w-0 items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4">
      <a
        href={jiraIssueSheet.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-sm text-blue-400 underline-offset-4 transition hover:text-blue-300 hover:underline"
      >
        {jiraIssueSheet.url}
      </a>
      <button
        onClick={() =>
        setJiraIssueSheet({ ...jiraIssueSheet, isEditing: true })
        }
        title="Edit URL"
        className="ml-4 shrink-0 text-zinc-500 transition hover:text-zinc-300"
      >
        ✎
      </button>
        </div>
      )}
    </div>
  );
}
