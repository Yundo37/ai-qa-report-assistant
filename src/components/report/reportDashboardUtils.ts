import { getQaReleaseStatusTone } from "@/lib/report/qaReleaseStatus";
import type { AnalysisSummaryState, RemainingIssue } from "@/types/report";

type DashboardStatus = {
  label: string;
  tone: "stable" | "caution" | "risk";
  description: string;
};

function getCount(value: number | undefined) {
  return typeof value === "number" ? value : 0;
}

function countRemainingIssuePriority(issues: RemainingIssue[]) {
  return issues.reduce(
    (summary, issue) => {
      if (issue.priority === "Highest") summary.Highest += 1;
      if (issue.priority === "High") summary.High += 1;
      if (issue.priority === "Medium") summary.Medium += 1;
      if (issue.priority === "Low") summary.Low += 1;
      if (issue.priority === "Lowest") summary.Lowest += 1;
      return summary;
    },
    { Highest: 0, High: 0, Medium: 0, Low: 0, Lowest: 0 }
  );
}

export function createOverallDashboardMetrics(
  analysisSummary: NonNullable<AnalysisSummaryState>
) {
  const qaSummary = analysisSummary.overallQaSummary;
  const pass = getCount(qaSummary?.Pass ?? analysisSummary.qaTotal.Pass);
  const fail = getCount(qaSummary?.Fail ?? analysisSummary.qaTotal.Fail);
  const blocked = getCount(
    qaSummary?.Blocked ?? analysisSummary.qaTotal.Blocked
  );
  const nextEvent = getCount(
    qaSummary?.NextEvent ?? analysisSummary.qaTotal.NextEvent
  );
  const notApplicable = getCount(
    qaSummary?.["N/A"] ?? analysisSummary.qaTotal["N/A"]
  );
  const totalTc = pass + fail + blocked + nextEvent + notApplicable;
  const passRateBase = pass + fail + blocked + nextEvent;
  const passRate =
    passRateBase > 0 ? Math.round((pass / passRateBase) * 100) : 0;
  const remaining =
    getCount(analysisSummary.jiraFiltered.Remaining) ||
    analysisSummary.remainingIssues.length;
  const remainingPrioritySummary =
    analysisSummary.qaIssueOverview?.remaining?.prioritySummary ??
    countRemainingIssuePriority(analysisSummary.remainingIssues);
  const highRisk =
    getCount(remainingPrioritySummary.Highest) +
    getCount(remainingPrioritySummary.High);
  const mediumRemaining = getCount(remainingPrioritySummary?.Medium);
  const blockedRate = totalTc > 0 ? blocked / totalTc : 0;
  const statusTone = getQaReleaseStatusTone({
    totalTc,
    blockedCount: blocked,
    remainingPriority: remainingPrioritySummary,
  });
  const statusByTone: Record<DashboardStatus["tone"], DashboardStatus> = {
    risk: {
      label: "Risk",
      tone: "risk",
      description: "High / Highest Remaining issues or high Blocked ratio require follow-up.",
    },
    caution: {
      label: "Attention Needed",
      tone: "caution",
      description: "Medium Remaining issues or Blocked ratio need review.",
    },
    stable: {
      label: "Stable",
      tone: "stable",
      description: "No major priority or blocked ratio signal in the top dashboard metrics.",
    },
  };
  const status = statusByTone[statusTone];

  return {
    status,
    totalTc,
    passRate,
    remaining,
    highRisk,
    mediumRemaining,
    blocked,
    blockedRate,
    nextEvent,
  };
}
