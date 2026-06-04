export function normalizeMinute(minute: string) {
  return minute.trim().padStart(2, "0");
}

export function buildAnalysisDateTime(date: string, hour: string, minute: string) {
  if (!date.trim()) return null;
  return `${date} ${hour}:${normalizeMinute(minute)}`;
}

export function createReportTitle(featureName: string) {
  return `${featureName.trim()} QA 결과 리포트`;
}

export function isJiraSheetTitle(title: string) {
  return /jira|지라/i.test(title);
}

export function buildGoogleSpreadsheetTabUrl(spreadsheetId: string, gid: string) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${gid}`;
}
