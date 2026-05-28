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

export function createOverallReportPreviewLines(
  analysisSummary: Exclude<AnalysisSummaryState, null>
) {
  const totalTestRows = analysisSummary.testSheets.reduce(
    (totalRows, sheet) => totalRows + sheet.rows,
    0
  );
  const passCount = analysisSummary.qaTotal.Pass ?? 0;
  const failCount = analysisSummary.qaTotal.Fail ?? 0;
  const blockedCount = analysisSummary.qaTotal.Blocked ?? 0;
  const nextEventCount = analysisSummary.qaTotal.NextEvent ?? 0;
  const filteredJiraTotal = analysisSummary.jiraFiltered.Total ?? 0;
  const remainingJiraCount = analysisSummary.jiraFiltered.Remaining ?? 0;
  const highPriorityRemainingCount =
    analysisSummary.jiraFiltered["High / Highest Remaining"] ?? 0;
  const lines = [
    `?대쾲 Overall QA?먯꽌??珥?${totalTestRows}嫄댁쓽 ?뚯뒪?멸? ?섑뻾?섏뿀?쇰ŉ, Pass ${passCount}嫄? Fail ${failCount}嫄? Blocked ${blockedCount}嫄? NextEvent ${nextEventCount}嫄댁씠 ?뺤씤?섏뿀?듬땲??`,
    `遺꾩꽍 湲곌컙 ???꾩껜 Jira ?댁뒋??${filteredJiraTotal}嫄??뺤씤?섏뿀?쇰ŉ, ?꾩옱 Remaining ?댁뒋??${remainingJiraCount}嫄댁엯?덈떎.`,
  ];

  if (highPriorityRemainingCount > 0) {
    lines.push(
      "High / Highest Remaining ?댁뒋媛 ?뺤씤?섏뼱 ?꾩껜 QA 由ъ뒪??愿?먯뿉???곗꽑 ?뺤씤???꾩슂?⑸땲??"
    );
  }

  lines.push(
    "Feature蹂??곸꽭 ?먯씤怨?????댁슜? 媛쒕퀎 Feature Report?먯꽌 ?뺤씤?섎뒗 援ъ“濡?愿由ы빀?덈떎."
  );

  if (analysisSummary.qaFollowUps.length > 0) {
    lines.push("QA Comment / Follow-up ??ぉ? ?꾩냽 ?뺤씤 ??곸쑝濡?愿由ы빀?덈떎.");
  }

  return lines;
}

export function createOverallReportPreviewLinesUtf8(
  analysisSummary: Exclude<AnalysisSummaryState, null>
) {
  const totalTestRows = analysisSummary.testSheets.reduce(
    (totalRows, sheet) => totalRows + sheet.rows,
    0
  );
  const passCount = analysisSummary.qaTotal.Pass ?? 0;
  const failCount = analysisSummary.qaTotal.Fail ?? 0;
  const blockedCount = analysisSummary.qaTotal.Blocked ?? 0;
  const nextEventCount = analysisSummary.qaTotal.NextEvent ?? 0;
  const filteredJiraTotal = analysisSummary.jiraFiltered.Total ?? 0;
  const remainingJiraCount = analysisSummary.jiraFiltered.Remaining ?? 0;
  const highPriorityRemainingCount =
    analysisSummary.jiraFiltered["High / Highest Remaining"] ?? 0;
  const lines = [
    `이번 Overall QA에서는 총 ${totalTestRows}건의 테스트가 수행되었으며, Pass ${passCount}건, Fail ${failCount}건, Blocked ${blockedCount}건, NextEvent ${nextEventCount}건이 확인되었습니다.`,
    `릴리즈 범위 내 Jira 이슈는 총 ${filteredJiraTotal}건 확인되었으며, 현재 Remaining 이슈는 ${remainingJiraCount}건입니다.`,
  ];

  if (highPriorityRemainingCount > 0) {
    lines.push(
      `High / Highest Remaining 이슈가 ${highPriorityRemainingCount}건 확인되어 릴리즈 QA 리스크 관리가 필요합니다.`
    );
  }

  lines.push(
    "피쳐별 QA 현황과 RC 진행 이슈 현황을 기준으로 릴리즈 흐름을 확인해주세요."
  );

  if (analysisSummary.qaFollowUps.length > 0) {
    lines.push("QA Comment / Follow-up 항목도 함께 확인이 필요합니다.");
  }

  return lines;
}
