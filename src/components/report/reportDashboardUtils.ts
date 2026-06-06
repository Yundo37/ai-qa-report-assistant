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
          label: "위험",
          tone: "risk",
          description: "High / Highest Remaining 이슈 확인이 필요합니다.",
        }
      : remaining > 0 || blocked > 0 || mediumRemaining > 0
        ? {
            label: "주의 필요",
            tone: "caution",
            description: "Remaining 또는 Blocked 항목을 확인해주세요.",
          }
        : {
            label: "안정",
            tone: "stable",
            description: "현재 상단 KPI 기준 주요 위험 신호가 낮습니다.",
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
