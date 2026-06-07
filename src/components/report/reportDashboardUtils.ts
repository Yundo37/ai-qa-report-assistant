import type { AnalysisSummaryState, RemainingIssue } from "@/types/report";

type DashboardStatus = {
  label: string;
  tone: "stable" | "caution" | "risk";
  description: string;
};

function getCount(value: number | undefined) {
  return typeof value === "number" ? value : 0;
}

function countHighRiskRemainingIssues(issues: RemainingIssue[]) {
  return issues.filter(
    (issue) => issue.priority === "Highest" || issue.priority === "High"
  ).length;
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
    analysisSummary.qaIssueOverview?.remaining?.prioritySummary;
  const highRisk =
    getCount(remainingPrioritySummary?.Highest) +
      getCount(remainingPrioritySummary?.High) ||
    countHighRiskRemainingIssues(analysisSummary.remainingIssues);
  const mediumRemaining = getCount(remainingPrioritySummary?.Medium);
  const status: DashboardStatus =
    highRisk > 0
      ? {
          label: "Risk",
          tone: "risk",
          description: "High / Highest Remaining issues require follow-up.",
        }
      : remaining > 0 || blocked > 0 || mediumRemaining > 0
        ? {
            label: "Attention Needed",
            tone: "caution",
            description: "Remaining or Blocked items need review.",
          }
        : {
            label: "Stable",
            tone: "stable",
            description: "No major risk signal in the top dashboard metrics.",
          };

  return {
    status,
    totalTc,
    passRate,
    remaining,
    highRisk,
    blocked,
    nextEvent,
  };
}
