import type { AnalysisSummaryState } from "@/types/report";

export function createFeatureReportPreviewLines(
  analysisSummary: Exclude<AnalysisSummaryState, null>
) {
  const totalTestRows = analysisSummary.testSheets.reduce(
    (totalRows, sheet) => totalRows + sheet.rows,
    0
  );
  const failCount = analysisSummary.qaTotal.Fail ?? 0;
  const blockedCount = analysisSummary.qaTotal.Blocked ?? 0;
  const passCount = analysisSummary.qaTotal.Pass ?? 0;
  const nextEventCount = analysisSummary.qaTotal.NextEvent ?? 0;
  const filteredJiraTotal = analysisSummary.jiraFiltered.Total ?? 0;
  const remainingJiraCount = analysisSummary.jiraFiltered.Remaining ?? 0;
  const resolvedJiraCount = analysisSummary.jiraFiltered.Resolved ?? 0;
  const excludedJiraCount =
    analysisSummary.jiraFiltered["Excluded / Non-Bug"] ?? 0;
  const highPriorityRemainingCount =
    analysisSummary.jiraFiltered["High / Highest Remaining"] ?? 0;
  const lines = [
    `이번 Feature QA에서는 총 ${totalTestRows}건의 테스트가 수행되었으며, Pass ${passCount}건, Fail ${failCount}건, Blocked ${blockedCount}건, NextEvent ${nextEventCount}건이 확인되었습니다.`,
    `Feature 관련 Jira 이슈는 총 ${filteredJiraTotal}건 확인되었으며, 현재 잔여(Remaining) 상태 이슈는 ${remainingJiraCount}건입니다.`,
    `해결 완료(Resolved) 상태 이슈는 ${resolvedJiraCount}건이며, 기획 의도 및 중복 이슈 등 제외성(Excluded / Non-Bug) 이슈는 ${excludedJiraCount}건으로 분류되었습니다.`,
  ];

  if (remainingJiraCount > 0) {
    lines.push(
      "잔여 이슈에 대한 추가 확인과 후속 처리가 필요하며, 배포 후 모니터링 항목으로 관리가 필요합니다.",
      "잔여 이슈 상세는 잔여 이슈 목록 (Remaining Issue List)을 참고해주세요."
    );
  }

  if (highPriorityRemainingCount > 0) {
    lines.push(
      "High 우선순위 잔여 이슈가 존재하여 배포 전 추가 확인이 필요합니다."
    );
  }

  if (analysisSummary.qaFollowUps.length > 0) {
    lines.push("QA 코멘트 / 후속 조치 항목이 확인되었습니다.");
  }

  return lines;
}
