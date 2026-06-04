import { createJiraFilteredSummary, createQaIssueOverviewSummary, createRemainingIssues, JIRA_PRIORITY_FIELDS, JIRA_STATUS_FIELDS } from "@/lib/jira";
import { logSummary } from "@/lib/report/logging";
import { inferTargetVersionFromJiraIssues } from "@/lib/report/versionInference";
import { createFieldSummaryByFields } from "@/lib/qaSummary";
import type { CsvRecord } from "@/types/report";

type CreateJiraSummaryBundleParams = {
  filteredJiraIssues: CsvRecord[];
};

export function createJiraSummaryBundle({
  filteredJiraIssues,
}: CreateJiraSummaryBundleParams) {
  const jiraStatusSummary = createFieldSummaryByFields(
    filteredJiraIssues,
    JIRA_STATUS_FIELDS
  );
  const jiraPrioritySummary = createFieldSummaryByFields(
    filteredJiraIssues,
    JIRA_PRIORITY_FIELDS
  );
  const jiraFilteredSummary =
    createJiraFilteredSummary(filteredJiraIssues);
  const remainingIssues = createRemainingIssues(filteredJiraIssues);
  const qaIssueOverview = createQaIssueOverviewSummary(filteredJiraIssues);
  const inferredTargetVersion =
    inferTargetVersionFromJiraIssues(filteredJiraIssues);

  logSummary("Jira Filtered Summary", jiraFilteredSummary);
  logSummary("Jira Status Summary", jiraStatusSummary);
  logSummary("Jira Priority Summary", jiraPrioritySummary);

  return {
    jiraStatusSummary,
    jiraPrioritySummary,
    jiraFilteredSummary,
    remainingIssues,
    qaIssueOverview,
    inferredTargetVersion,
  };
}
