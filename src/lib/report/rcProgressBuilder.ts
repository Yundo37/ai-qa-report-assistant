import { createRcProgressSummary } from "@/lib/jira";
import type { CsvRecord } from "@/types/report";

type CreateRcProgressBundleParams = {
  filteredJiraIssues: CsvRecord[];
  reportTitle: string;
  startDateTime: string;
  endDateTime: string | null;
};

export function createRcProgressBundle({
  filteredJiraIssues,
  reportTitle,
  startDateTime,
  endDateTime,
}: CreateRcProgressBundleParams) {
  const rcProgress = createRcProgressSummary(filteredJiraIssues, {
    reportTitle,
    startDateTime,
    endDateTime,
  });

  return {
    rcProgress,
  };
}
