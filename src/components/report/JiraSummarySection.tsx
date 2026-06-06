import { SummaryCard } from "@/components/report/SummaryCard";
import type { AnalysisSummaryState } from "@/types/report";

type JiraSummarySectionProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
};

export function JiraSummarySection({ analysisSummary }: JiraSummarySectionProps) {
  const emptyMessage =
    analysisSummary.jiraMatchedRows === 0
      ? "No matching Jira issues found."
      : undefined;

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-slate-800">
        Jira Summary
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SummaryCard
          title="Jira Filtered Summary"
          summary={analysisSummary.jiraFiltered}
          emptyMessage={emptyMessage}
        />
        <SummaryCard
          title="Jira Status Summary"
          summary={analysisSummary.jiraStatus}
          emptyMessage={emptyMessage}
        />
        <SummaryCard
          title="Jira Priority Summary"
          summary={analysisSummary.jiraPriority}
          emptyMessage={emptyMessage}
        />
      </div>
    </div>
  );
}
