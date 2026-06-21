import type {
  AnalysisSummaryState,
  QaIssueOverviewSummary,
  RcProgressSummary,
} from "@/types/report";

export function createFallbackRcProgress(
  analysisSummary: Exclude<AnalysisSummaryState, null>
): RcProgressSummary {
  return {
    rcLabel: "현재 RC (legacy fallback)",
    newIssues: analysisSummary.jiraMatchedRows,
    fixedIssues: analysisSummary.jiraFiltered.Resolved ?? 0,
    resolvedIssues: analysisSummary.jiraFiltered.Resolved ?? 0,
    remainingIssues: analysisSummary.jiraFiltered.Remaining ?? 0,
    reopenedIssues: analysisSummary.jiraStatus["다시열림"] ?? 0,
    items: [
      {
        rc: "현재 RC (legacy fallback)",
        newIssues: analysisSummary.jiraMatchedRows,
        fixedIssues: analysisSummary.jiraFiltered.Resolved ?? 0,
        resolvedIssues: analysisSummary.jiraFiltered.Resolved ?? 0,
        remainingIssues: analysisSummary.jiraFiltered.Remaining ?? 0,
        reopenedIssues: analysisSummary.jiraStatus["다시열림"] ?? 0,
        prioritySummary: {
          Highest: analysisSummary.jiraPriority.Highest ?? 0,
          High: analysisSummary.jiraPriority.High ?? 0,
          Medium: analysisSummary.jiraPriority.Medium ?? 0,
          Low: analysisSummary.jiraPriority.Low ?? 0,
          Lowest: analysisSummary.jiraPriority.Lowest ?? 0,
        },
      },
    ],
  };
}

export function createFallbackQaIssueOverview(
  analysisSummary: Exclude<AnalysisSummaryState, null>
): QaIssueOverviewSummary {
  const remainingPrioritySummary = {
    Highest: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Lowest: 0,
  };

  analysisSummary.remainingIssues.forEach((issue) => {
    if (issue.priority in remainingPrioritySummary) {
      remainingPrioritySummary[
        issue.priority as keyof typeof remainingPrioritySummary
      ] += 1;
    }
  });

  return {
    created: {
      total: analysisSummary.jiraMatchedRows,
      prioritySummary: {
        Highest: analysisSummary.jiraPriority.Highest ?? 0,
        High: analysisSummary.jiraPriority.High ?? 0,
        Medium: analysisSummary.jiraPriority.Medium ?? 0,
        Low: analysisSummary.jiraPriority.Low ?? 0,
        Lowest: analysisSummary.jiraPriority.Lowest ?? 0,
      },
    },
    resolved: {
      total: analysisSummary.jiraFiltered.Resolved ?? 0,
      prioritySummary: {
        Highest: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Lowest: 0,
      },
    },
    remaining: {
      total: analysisSummary.jiraFiltered.Remaining ?? 0,
      prioritySummary: remainingPrioritySummary,
    },
  };
}
