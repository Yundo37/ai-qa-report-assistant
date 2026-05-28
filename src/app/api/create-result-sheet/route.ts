import crypto from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

type CountSummary = Record<string, number>;

type TestSheetSummary = {
  title: string;
  rows: number;
  summary: CountSummary;
};

type RemainingIssue = {
  priority: string;
  key: string;
  summary: string;
  status: string;
  version?: string;
};

type RcPrioritySummary = {
  Highest: number;
  High: number;
  Medium: number;
  Low: number;
  Lowest: number;
};

type RcProgressItem = {
  rc: string;
  newIssues: number;
  fixedIssues: number;
  resolvedIssues?: number;
  remainingIssues: number;
  reopenedIssues: number;
  prioritySummary: RcPrioritySummary;
};

type RcProgressSummary = {
  rcLabel: string;
  newIssues: number;
  fixedIssues: number;
  resolvedIssues?: number;
  remainingIssues: number;
  reopenedIssues: number;
  items?: RcProgressItem[];
};

type QaIssueOverviewSection = {
  total: number;
  prioritySummary: RcPrioritySummary;
};

type QaIssueOverviewSummary = {
  created: QaIssueOverviewSection;
  resolved: QaIssueOverviewSection;
  remaining: QaIssueOverviewSection;
};

type CreateResultSheetRequest = {
  spreadsheetId?: string;
  reportTitle?: string;
  version?: string;
  rcVersion?: string;
  qaStartDateTime?: string;
  qaEndDateTime?: string | null;
  qaSummary?: CountSummary;
  testSheets?: TestSheetSummary[];
  jiraFilteredSummary?: CountSummary;
  jiraStatusSummary?: CountSummary;
  jiraPrioritySummary?: CountSummary;
  reportPreviewLines?: string[];
  remainingIssues?: RemainingIssue[];
  rcProgress?: RcProgressSummary;
  qaIssueOverview?: QaIssueOverviewSummary;
  qaFollowUps?: string[];
  aiAnalysisText?: string;
};

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type CopyToSheetResponse = {
  sheetId?: number;
  title?: string;
};

type ValueUpdate = {
  range: string;
  values: Array<Array<string | number>>;
};

type TemplateDynamicLayout = {
  issueStartRow: number;
  issueRows: number;
  highPriorityIssueRows: number;
  issueExtraRows: number;
  extraIssueRow: number;
  hasExtraIssueSummary: boolean;
  commentTitleRow: number;
  commentRows: number;
  commentExtraRows: number;
  commentCategoryOffsets: number[];
  qaSummaryRowHeights: number[];
  commentRowHeights: number[];
};

type SheetColor = {
  red: number;
  green: number;
  blue: number;
};

type GridRange = {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
};

type StyledRange = GridRange & {
  backgroundColor?: SheetColor;
  foregroundColor?: SheetColor;
  fontSize?: number;
  bold?: boolean;
  horizontalAlignment?: "LEFT" | "CENTER";
};

type DashboardSheet = {
  rows: Array<Array<string | number>>;
  merges: GridRange[];
  titleRows: number[];
  subtitleRows: number[];
  heroRange: StyledRange | null;
  heroBadgeRange: StyledRange | null;
  sectionRows: number[];
  kpiCards: StyledRange[];
  signalCards: StyledRange[];
  tableHeaders: GridRange[];
  tableRanges: GridRange[];
  mutedTextRanges: StyledRange[];
  strongTextRanges: StyledRange[];
  highRiskRows: StyledRange[];
  issueRiskRows: StyledRange[];
  warningBoxes: StyledRange[];
  infoBoxes: StyledRange[];
  tallRows: Array<{ row: number; pixelSize: number }>;
};

type SheetsRequest = Record<string, unknown>;

const COLUMN_COUNT = 12;
const COLOR = {
  background: { red: 0.025, green: 0.045, blue: 0.085 },
  header: { red: 0.045, green: 0.08, blue: 0.14 },
  panel: { red: 0.075, green: 0.105, blue: 0.16 },
  panel2: { red: 0.095, green: 0.13, blue: 0.19 },
  card: { red: 0.105, green: 0.145, blue: 0.21 },
  cardMuted: { red: 0.075, green: 0.1, blue: 0.15 },
  border: { red: 0.12, green: 0.17, blue: 0.24 },
  white: { red: 0.96, green: 0.98, blue: 1 },
  muted: { red: 0.62, green: 0.69, blue: 0.79 },
  mutedBlue: { red: 0.075, green: 0.16, blue: 0.29 },
  mutedGreen: { red: 0.08, green: 0.4, blue: 0.29 },
  mutedAmber: { red: 0.74, green: 0.43, blue: 0.08 },
  blockedAmber: { red: 0.68, green: 0.38, blue: 0.06 },
  remainingAmber: { red: 0.82, green: 0.52, blue: 0.08 },
  mutedRed: { red: 0.62, green: 0.13, blue: 0.16 },
  strongRed: { red: 0.9, green: 0.12, blue: 0.14 },
  softAmberPanel: { red: 0.26, green: 0.15, blue: 0.04 },
  softOrangePanel: { red: 0.21, green: 0.11, blue: 0.035 },
};

const TEMPLATE_SPREADSHEET_ID = "1B28oDAC73giOgrc4vq0hY9PS8LyycLymu1Kxe2dSPFA";
const TEMPLATE_QA_RESULT_SHEET_ID = 552320580;
const TEMPLATE_QA_RESULT_SHEET_NAME = "TEMPLATE_QA_RESULT";
const TEMPLATE_QA_SUMMARY_START_ROW = 13;
const TEMPLATE_QA_SUMMARY_MAX_LINES = 8;
const TEMPLATE_ISSUE_START_ROW = 41;
const TEMPLATE_ISSUE_BODY_CAPACITY = 3;
const TEMPLATE_COMMENT_BODY_CAPACITY = 6;

type QaJudgmentState = "안정" | "주의 필요" | "위험";

function base64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwt(credentials: ServiceAccountCredentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: credentials.token_uri || "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload)
  )}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(credentials.private_key);

  return `${unsignedToken}.${base64Url(signature)}`;
}

function normalizeServiceAccountCredentials(
  credentials: ServiceAccountCredentials
) {
  return {
    ...credentials,
    private_key: credentials.private_key.replace(/\\n/g, "\n"),
  };
}

async function loadServiceAccountCredentials() {
  const credentialJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (credentialJson) {
    try {
      return normalizeServiceAccountCredentials(
        JSON.parse(credentialJson) as ServiceAccountCredentials
      );
    } catch (error) {
      throw new Error(
        `GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialPath) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS is not configured."
    );
  }

  const resolvedPath = path.isAbsolute(credentialPath)
    ? credentialPath
    : path.join(/* turbopackIgnore: true */ process.cwd(), credentialPath);
  const credentialText = await readFile(resolvedPath, "utf8");

  return normalizeServiceAccountCredentials(
    JSON.parse(credentialText) as ServiceAccountCredentials
  );
}

async function getAccessToken() {
  const credentials = await loadServiceAccountCredentials();
  const tokenUri = credentials.token_uri || "https://oauth2.googleapis.com/token";
  const assertion = createJwt(credentials);
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = (await response.json()) as TokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Google access token request failed."
    );
  }

  return data.access_token;
}

function getSummaryCount(summary: CountSummary | undefined, key: string) {
  return summary?.[key] ?? 0;
}

function formatTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${year}${month}${day}_${hour}${minute}`;
}

function formatDisplayTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hour}:${minute}`;
}

function normalizeRcVersion(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "";
  if (/^\d+$/.test(trimmedValue)) return `RC${trimmedValue}`;

  return trimmedValue.replace(/\brc\s*(\d+)\b/gi, "RC$1");
}

function createHeroTargetVersionLabel(body: CreateResultSheetRequest) {
  const normalizedVersion = body.version?.trim() ?? "";
  const normalizedRcVersion = normalizeRcVersion(body.rcVersion ?? "");
  const userTargetVersion = [normalizedVersion, normalizedRcVersion]
    .filter(Boolean)
    .join(" ");

  return userTargetVersion || body.rcProgress?.rcLabel || "Version TBD";
}

function formatHeroDate(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) return "";

  const dateMatch = trimmedValue.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);

  if (!dateMatch) return trimmedValue;

  const [, year, month, day] = dateMatch;

  return `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`;
}

function createHeroQaPeriodLabel(body: CreateResultSheetRequest) {
  const startDate = formatHeroDate(body.qaStartDateTime);
  const endDate = formatHeroDate(body.qaEndDateTime) || "현재";

  if (!startDate) return `QA 기간 ${endDate}`;

  return `QA 기간 ${startDate} ~ ${endDate}`;
}

function sanitizeSheetTitle(title: string) {
  return (
    title
      .replace(/QA\s*결과\s*리포트/gi, "")
      .replace(/결과\s*리포트/gi, "")
      .replace(/Result\s*Report/gi, "")
      .replace(/QA\s*Dashboard/gi, "")
      .replace(/더미\s*결과/gi, "더미")
      .replace(/[\[\]\*\?\/\\:]/g, "")
      .replace(/\s+/g, "")
      .trim() || "Release"
  ).slice(0, 72);
}

function createSheetName(reportTitle: string) {
  const timestamp = formatTimestamp();
  const safeTitle = sanitizeSheetTitle(reportTitle || "Release");

  return `QA_${safeTitle}_${timestamp}`.slice(0, 100);
}

function createSheetUrl(spreadsheetId: string, sheetId: number) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`;
}

function quoteSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

function createSystemAnalysisState(
  highRemainingCount: number,
  blockedCount: number,
  remainingCount: number,
  reopenedCount: number
): QaJudgmentState {
  if (highRemainingCount >= 10 || blockedCount >= 10) {
    return "위험";
  }

  if (
    highRemainingCount > 0 ||
    blockedCount > 0 ||
    remainingCount > 0 ||
    reopenedCount > 0
  ) {
    return "주의 필요";
  }

  return "안정";
}

function getJudgmentColor(state: QaJudgmentState) {
  if (state === "위험") return COLOR.strongRed;
  if (state === "주의 필요") return COLOR.remainingAmber;
  return COLOR.mutedGreen;
}

function createSystemAnalysisLines({
  highRemainingCount,
  blockedCount,
  remainingCount,
  reopenedCount,
}: {
  highRemainingCount: number;
  blockedCount: number;
  remainingCount: number;
  reopenedCount: number;
}) {
  return [
    `시스템 분석 결과: ${createSystemAnalysisState(
      highRemainingCount,
      blockedCount,
      remainingCount,
      reopenedCount
    )}`,
    `High 우선순위 잔여 ${highRemainingCount}건`,
    `Blocked ${blockedCount}건 / 다시열림 ${reopenedCount}건`,
    remainingCount > 0
      ? "운영/QA 모니터링 필요"
      : "추가 모니터링 이슈 없음",
  ];
}

function sortRemainingIssues(issues: RemainingIssue[]) {
  const priorityOrder: Record<string, number> = {
    Highest: 0,
    High: 1,
    Medium: 2,
    Low: 3,
    Lowest: 4,
  };
  const statusOrder: Record<string, number> = {
    다시열림: 0,
    열림: 1,
    QA확인: 2,
    QA대기: 3,
    진행: 4,
    작업완료: 5,
    미해결: 6,
    수정보류: 7,
    수정불가: 8,
    재현불가: 9,
    배포완료: 10,
  };

  return [...issues].sort(
    (first, second) =>
      (priorityOrder[first.priority] ?? 99) -
        (priorityOrder[second.priority] ?? 99) ||
      (statusOrder[first.status.replace(/\s+/g, "")] ?? 99) -
        (statusOrder[second.status.replace(/\s+/g, "")] ?? 99)
  );
}

function isHighPriorityRemainingIssue(issue: RemainingIssue) {
  return issue.priority === "Highest" || issue.priority === "High";
}

// Legacy summary helper kept for the older non-template builder path.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createRemainingIssueSummaryText(issues: RemainingIssue[]) {
  const mediumCount = issues.filter((issue) => issue.priority === "Medium").length;
  const lowCount = issues.filter((issue) => issue.priority === "Low").length;
  const lowestCount = issues.filter((issue) => issue.priority === "Lowest").length;
  const otherCount = Math.max(
    issues.length - mediumCount - lowCount - lowestCount,
    0
  );
  const summaryParts = [
    mediumCount > 0 ? `Medium ${mediumCount}건` : "",
    lowCount > 0 ? `Low ${lowCount}건` : "",
    lowestCount > 0 ? `Lowest ${lowestCount}건` : "",
    otherCount > 0 ? `기타 ${otherCount}건` : "",
  ].filter(Boolean);

  return summaryParts.length > 0 ? ` (${summaryParts.join(" / ")})` : "";
}

function isMediumLowRemainingIssue(issue: RemainingIssue) {
  return (
    issue.priority === "Medium" ||
    issue.priority === "Low" ||
    issue.priority === "Lowest"
  );
}

function createMediumLowRemainingIssueSummaryText(issues: RemainingIssue[]) {
  const mediumCount = issues.filter((issue) => issue.priority === "Medium").length;
  const lowCount = issues.filter(
    (issue) => issue.priority === "Low" || issue.priority === "Lowest"
  ).length;

  return ` (Medium ${mediumCount}건 / Low ${lowCount}건)`;
}

function createFollowUpCategory(followUp: string) {
  const normalized = followUp.toLowerCase();

  if (/다음 업데이트|차기|다음|수정하기로 협의|수정|fix/.test(normalized)) {
    return "차기 수정 예정";
  }

  if (/정책 확정|운영 정책|정책|협의|운영|policy/.test(normalized)) {
    return "운영 정책 협의";
  }

  if (/재검증|확인|배포 후|배포|릴리즈|release|모니터링|monitor/.test(normalized)) {
    return "배포 후 확인";
  }

  return "기타 후속 조치";
}

function getAiInsightLines(body: CreateResultSheetRequest) {
  const lines =
    body.aiAnalysisText
      ?.trim()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean) ??
    body.reportPreviewLines?.map((line) => line.trim()).filter(Boolean) ??
    [];

  if (lines.length > 0) {
    return lines.slice(0, TEMPLATE_QA_SUMMARY_MAX_LINES);
  }

  return [
    "상태 동기화 관련 잔여 이슈가 집중되어 있어 배포 전 최종 확인이 필요합니다.",
    "CTA 노출 / 결과 상태 반영 영역은 운영 모니터링 항목으로 관리하는 것을 권장합니다.",
    "알림 재시도 / 캐시 반영 지연은 배포 후 QA와 운영이 함께 추적해야 합니다.",
  ];
}

function createEmptyDashboard(): DashboardSheet {
  return {
    rows: [],
    merges: [],
    titleRows: [],
    subtitleRows: [],
    heroRange: null,
    heroBadgeRange: null,
    sectionRows: [],
    kpiCards: [],
    signalCards: [],
    tableHeaders: [],
    tableRanges: [],
    mutedTextRanges: [],
    strongTextRanges: [],
    highRiskRows: [],
    issueRiskRows: [],
    warningBoxes: [],
    infoBoxes: [],
    tallRows: [],
  };
}

function createRow(entries: Array<[number, string | number]>) {
  const row = Array<string | number>(COLUMN_COUNT).fill("");
  entries.forEach(([index, value]) => {
    row[index] = value;
  });
  return row;
}

function addMerge(
  sheet: DashboardSheet,
  startRow: number,
  endRow: number,
  startColumn = 0,
  endColumn = COLUMN_COUNT
) {
  sheet.merges.push({ startRow, endRow, startColumn, endColumn });
}

function addMergedRow(
  sheet: DashboardSheet,
  value: string | number,
  startColumn = 0,
  endColumn = COLUMN_COUNT
) {
  const rowIndex = sheet.rows.length;
  sheet.rows.push(createRow([[startColumn, value]]));
  addMerge(sheet, rowIndex, rowIndex + 1, startColumn, endColumn);
  return rowIndex;
}

function addSpacer(sheet: DashboardSheet, height = 14) {
  const rowIndex = sheet.rows.length;
  sheet.rows.push([]);
  sheet.tallRows.push({ row: rowIndex, pixelSize: height });
}

function addSection(sheet: DashboardSheet, title: string) {
  addSpacer(sheet, 12);
  const rowIndex = addMergedRow(sheet, title);
  sheet.sectionRows.push(rowIndex);
  sheet.tallRows.push({ row: rowIndex, pixelSize: 26 });
}

function addKpiCard(
  sheet: DashboardSheet,
  label: string,
  value: string | number,
  startColumn: number,
  valueRow: number,
  backgroundColor: SheetColor,
  width = 4
) {
  sheet.rows[valueRow - 1][startColumn] = label;
  sheet.rows[valueRow][startColumn] = value;
  addMerge(sheet, valueRow - 1, valueRow, startColumn, startColumn + width);
  addMerge(sheet, valueRow, valueRow + 1, startColumn, startColumn + width);
  sheet.kpiCards.push({
    startRow: valueRow - 1,
    endRow: valueRow + 1,
    startColumn,
    endColumn: startColumn + width,
    backgroundColor,
    foregroundColor: COLOR.white,
  });
  sheet.mutedTextRanges.push({
    startRow: valueRow - 1,
    endRow: valueRow,
    startColumn,
    endColumn: startColumn + width,
    foregroundColor: COLOR.muted,
    fontSize: 10,
    bold: true,
  });
  sheet.strongTextRanges.push({
    startRow: valueRow,
    endRow: valueRow + 1,
    startColumn,
    endColumn: startColumn + width,
    foregroundColor: COLOR.white,
    fontSize: 14,
    bold: true,
  });
}

function addSignalCard(
  sheet: DashboardSheet,
  title: string,
  value: string | number,
  message: string,
  startColumn: number,
  startRow: number,
  backgroundColor: SheetColor,
  width = 3
) {
  void message;
  sheet.rows[startRow][startColumn] = title;
  sheet.rows[startRow + 1][startColumn] = value;
  const endColumn = Math.min(startColumn + width, COLUMN_COUNT);
  addMerge(sheet, startRow, startRow + 1, startColumn, endColumn);
  addMerge(sheet, startRow + 1, startRow + 2, startColumn, endColumn);
  sheet.signalCards.push({
    startRow,
    endRow: startRow + 2,
    startColumn,
    endColumn,
    backgroundColor,
    foregroundColor: COLOR.white,
  });
  sheet.mutedTextRanges.push({
    startRow,
    endRow: startRow + 1,
    startColumn,
    endColumn,
    foregroundColor: COLOR.muted,
    fontSize: 10,
    bold: true,
  });
  sheet.strongTextRanges.push({
    startRow: startRow + 1,
    endRow: startRow + 2,
    startColumn,
    endColumn,
    foregroundColor: COLOR.white,
    fontSize: 13,
    bold: true,
  });
}

function createEmptyPrioritySummary(): RcPrioritySummary {
  return {
    Highest: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Lowest: 0,
  };
}

function createPrioritySummaryFromCountSummary(summary?: CountSummary) {
  return {
    Highest: summary?.Highest ?? 0,
    High: summary?.High ?? 0,
    Medium: summary?.Medium ?? 0,
    Low: summary?.Low ?? 0,
    Lowest: summary?.Lowest ?? 0,
  };
}

function createPrioritySummaryFromRemainingIssues(issues: RemainingIssue[]) {
  const prioritySummary = createEmptyPrioritySummary();

  issues.forEach((issue) => {
    if (issue.priority in prioritySummary) {
      prioritySummary[issue.priority as keyof RcPrioritySummary] += 1;
    }
  });

  return prioritySummary;
}

function createFallbackQaIssueOverview(
  body: CreateResultSheetRequest
): QaIssueOverviewSummary {
  const remainingIssues = body.remainingIssues ?? [];

  return {
    created: {
      total: Math.max(
        getSummaryCount(body.jiraFilteredSummary, "Total") -
          getSummaryCount(body.jiraFilteredSummary, "Excluded / Non-Bug"),
        0
      ),
      prioritySummary: createPrioritySummaryFromCountSummary(
        body.jiraPrioritySummary
      ),
    },
    resolved: {
      total: getSummaryCount(body.jiraFilteredSummary, "Resolved"),
      prioritySummary: createEmptyPrioritySummary(),
    },
    remaining: {
      total: getSummaryCount(body.jiraFilteredSummary, "Remaining"),
      prioritySummary: createPrioritySummaryFromRemainingIssues(remainingIssues),
    },
  };
}

function getQaIssueOverview(body: CreateResultSheetRequest) {
  return body.qaIssueOverview ?? createFallbackQaIssueOverview(body);
}

function getPriorityColor(priority: keyof RcPrioritySummary) {
  if (priority === "Highest") return COLOR.strongRed;
  if (priority === "High") return COLOR.mutedRed;
  if (priority === "Medium") return COLOR.remainingAmber;
  return COLOR.cardMuted;
}

function addIssueOverviewCard(
  sheet: DashboardSheet,
  title: string,
  totalLabel: string,
  note: string,
  section: QaIssueOverviewSection,
  startColumn: number,
  endColumn: number,
  startRow: number,
  backgroundColor: SheetColor,
  emphasize = false
) {
  const priorities: Array<keyof RcPrioritySummary> = [
    "Highest",
    "High",
    "Medium",
    "Low",
  ];
  const width = endColumn - startColumn;
  const span = width / priorities.length;

  sheet.rows[startRow][startColumn] = title;
  addMerge(sheet, startRow, startRow + 1, startColumn, endColumn);
  sheet.strongTextRanges.push({
    startRow,
    endRow: startRow + 1,
    startColumn,
    endColumn,
    foregroundColor: COLOR.white,
    fontSize: 11,
    bold: true,
  });

  priorities.forEach((priority, index) => {
    const priorityStartColumn = startColumn + Math.floor(index * span);
    const priorityEndColumn =
      index === priorities.length - 1
        ? endColumn
        : startColumn + Math.floor((index + 1) * span);

    sheet.rows[startRow + 1][priorityStartColumn] = priority;
    sheet.rows[startRow + 2][priorityStartColumn] =
      section.prioritySummary[priority];
    addMerge(
      sheet,
      startRow + 1,
      startRow + 2,
      priorityStartColumn,
      priorityEndColumn
    );
    addMerge(
      sheet,
      startRow + 2,
      startRow + 3,
      priorityStartColumn,
      priorityEndColumn
    );
    sheet.highRiskRows.push({
      startRow: startRow + 1,
      endRow: startRow + 3,
      startColumn: priorityStartColumn,
      endColumn: priorityEndColumn,
      backgroundColor: getPriorityColor(priority),
      foregroundColor: COLOR.white,
      bold: priority === "Highest" || priority === "High",
    });
    sheet.mutedTextRanges.push({
      startRow: startRow + 1,
      endRow: startRow + 2,
      startColumn: priorityStartColumn,
      endColumn: priorityEndColumn,
      foregroundColor: COLOR.white,
      fontSize: 10,
      bold: true,
    });
    sheet.strongTextRanges.push({
      startRow: startRow + 2,
      endRow: startRow + 3,
      startColumn: priorityStartColumn,
      endColumn: priorityEndColumn,
      foregroundColor: COLOR.white,
      fontSize: emphasize ? 15 : 14,
      bold: true,
    });
  });

  sheet.rows[startRow + 3][startColumn] = `${totalLabel} ${section.total}건`;
  sheet.rows[startRow + 4][startColumn] = note;
  addMerge(sheet, startRow + 3, startRow + 4, startColumn, endColumn);
  addMerge(sheet, startRow + 4, startRow + 5, startColumn, endColumn);
  sheet.strongTextRanges.push({
    startRow: startRow + 3,
    endRow: startRow + 4,
    startColumn,
    endColumn,
    foregroundColor: COLOR.white,
    fontSize: emphasize ? 12 : 11,
    bold: true,
  });
  sheet.mutedTextRanges.push({
    startRow: startRow + 4,
    endRow: startRow + 5,
    startColumn,
    endColumn,
    foregroundColor: COLOR.muted,
    fontSize: 11,
  });
  sheet.signalCards.push({
    startRow,
    endRow: startRow + 5,
    startColumn,
    endColumn,
    backgroundColor,
    foregroundColor: COLOR.white,
  });
  sheet.tallRows.push({ row: startRow, pixelSize: 22 });
  sheet.tallRows.push({ row: startRow + 1, pixelSize: 20 });
  sheet.tallRows.push({ row: startRow + 2, pixelSize: emphasize ? 32 : 28 });
  sheet.tallRows.push({ row: startRow + 3, pixelSize: 22 });
  sheet.tallRows.push({ row: startRow + 4, pixelSize: 36 });
}

// Kept only as a reference for the pre-template renderer. Do not use as fallback.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createDashboardRows(body: CreateResultSheetRequest) {
  const sheet = createEmptyDashboard();
  const passCount = getSummaryCount(body.qaSummary, "Pass");
  const failCount = getSummaryCount(body.qaSummary, "Fail");
  const blockedCount = getSummaryCount(body.qaSummary, "Blocked");
  const nextEventCount = getSummaryCount(body.qaSummary, "NextEvent");
  const totalTc = passCount + failCount + blockedCount + nextEventCount;
  const remainingCount = getSummaryCount(body.jiraFilteredSummary, "Remaining");
  const highRemainingCount = getSummaryCount(
    body.jiraFilteredSummary,
    "High / Highest Remaining"
  );
  const deployedDoneCount = getSummaryCount(body.jiraStatusSummary, "배포완료");
  const reopenedCount = getSummaryCount(body.jiraStatusSummary, "다시열림");
  const qaIssueOverview = getQaIssueOverview(body);
  const systemAnalysisState = createSystemAnalysisState(
    highRemainingCount,
    blockedCount,
    remainingCount,
    reopenedCount
  );
  // TODO: QA가 최종 상태(안정/주의 필요/위험)를 직접 조정할 수 있도록 확장 예정.
  const qaFinalJudgment = systemAnalysisState;
  const systemAnalysisLines = createSystemAnalysisLines({
    highRemainingCount,
    blockedCount,
    remainingCount,
    reopenedCount,
  });

  console.log("Create Dashboard Rows qaIssueOverview:", qaIssueOverview);

  const releaseStatus = `QA 최종 판단\n${qaFinalJudgment}`;
  const sortedRemainingIssues = sortRemainingIssues(body.remainingIssues ?? []);
  const highPriorityRemainingIssues = sortedRemainingIssues.filter(
    isHighPriorityRemainingIssue
  );
  const summarizedRemainingIssues = sortedRemainingIssues.filter(
    isMediumLowRemainingIssue
  );
  const remainingExtraCount = summarizedRemainingIssues.length;
  const remainingExtraSummaryText =
    createMediumLowRemainingIssueSummaryText(summarizedRemainingIssues);
  const followUps =
    body.qaFollowUps && body.qaFollowUps.length > 0
      ? body.qaFollowUps
      : ["추출된 QA 코멘트 / 후속 조치가 없습니다."];
  const groupedFollowUps = followUps.reduce<Record<string, string[]>>(
    (groups, followUp) => {
      const category = createFollowUpCategory(followUp);
      groups[category] = [...(groups[category] ?? []), followUp];
      return groups;
    },
    {}
  );

  const heroStartRow = sheet.rows.length;
  sheet.rows.push(createRow([[0, releaseStatus], [4, "THEUS QA 릴리즈 대시보드"]]));
  sheet.rows.push(
    createRow([[4, body.reportTitle || "기능 QA 결과 리포트"]])
  );
  sheet.rows.push(
    createRow([[4, `2.0.0 RC2  |  최종 업데이트 ${formatDisplayTimestamp()}  |  QA 담당자 TBD`]])
  );
  sheet.rows.push(
    createRow([[4, systemAnalysisLines.join("\n")]])
  );
  addMerge(sheet, heroStartRow, heroStartRow + 4, 0, 4);
  for (let rowIndex = heroStartRow; rowIndex < heroStartRow + 4; rowIndex += 1) {
    addMerge(sheet, rowIndex, rowIndex + 1, 4, COLUMN_COUNT);
  }
  sheet.heroRange = {
    startRow: heroStartRow,
    endRow: heroStartRow + 4,
    startColumn: 0,
    endColumn: COLUMN_COUNT,
    backgroundColor: COLOR.header,
  };
  sheet.heroBadgeRange = {
    startRow: heroStartRow,
    endRow: heroStartRow + 4,
    startColumn: 0,
    endColumn: 4,
    backgroundColor: getJudgmentColor(qaFinalJudgment),
    foregroundColor: COLOR.white,
    fontSize: 20,
    bold: true,
  };
  sheet.titleRows.push(heroStartRow);
  sheet.subtitleRows.push(heroStartRow + 1, heroStartRow + 2, heroStartRow + 3);
  sheet.tallRows.push({ row: heroStartRow, pixelSize: 36 });
  sheet.tallRows.push({ row: heroStartRow + 1, pixelSize: 24 });
  sheet.tallRows.push({ row: heroStartRow + 2, pixelSize: 24 });
  sheet.tallRows.push({ row: heroStartRow + 3, pixelSize: 76 });

  addSection(sheet, "릴리즈 판단 사유");
  const reasonStartRow = sheet.rows.length;
  [
    highRemainingCount > 0
      ? "High 우선순위 잔여 이슈 확인 필요"
      : "High 우선순위 잔여 이슈 없음",
    `Fail ${failCount}건 / Blocked ${blockedCount}건 / 잔여 이슈 ${remainingCount}건`,
    "주요 기능 플로우는 검증 완료",
    "배포 후 운영/QA 모니터링 필요",
  ].forEach((reason) => {
    addMergedRow(sheet, `- ${reason}`);
  });
  sheet.infoBoxes.push({
    startRow: reasonStartRow,
    endRow: sheet.rows.length,
    startColumn: 0,
    endColumn: COLUMN_COUNT,
    backgroundColor: COLOR.panel,
  });

  addSection(sheet, "QA 상태 요약");
  const aiStartRow = sheet.rows.length;
  getAiInsightLines(body).forEach((line) => {
    const rowIndex = addMergedRow(sheet, `- ${line}`);
    sheet.tallRows.push({ row: rowIndex, pixelSize: 48 });
    sheet.mutedTextRanges.push({
      startRow: rowIndex,
      endRow: rowIndex + 1,
      startColumn: 0,
      endColumn: COLUMN_COUNT,
      foregroundColor: COLOR.muted,
      fontSize: 11,
      horizontalAlignment: "LEFT",
    });
  });
  sheet.infoBoxes.push({
    startRow: aiStartRow,
    endRow: sheet.rows.length,
    startColumn: 0,
    endColumn: COLUMN_COUNT,
    backgroundColor: { red: 0.08, green: 0.16, blue: 0.25 },
  });

  addSection(sheet, "핵심 KPI");
  const firstKpiLabelRow = sheet.rows.length;
  sheet.rows.push(createRow([]));
  const firstKpiValueRow = sheet.rows.length;
  sheet.rows.push(createRow([]));
  addKpiCard(sheet, "전체 TC", totalTc, 0, firstKpiValueRow, COLOR.card);
  addKpiCard(sheet, "Pass", passCount, 4, firstKpiValueRow, COLOR.mutedGreen);
  addKpiCard(sheet, "Fail", failCount, 8, firstKpiValueRow, failCount > 0 ? COLOR.mutedRed : COLOR.cardMuted);
  const secondKpiLabelRow = sheet.rows.length;
  sheet.rows.push(createRow([]));
  const secondKpiValueRow = sheet.rows.length;
  sheet.rows.push(createRow([]));
  addKpiCard(sheet, "Blocked", blockedCount, 0, secondKpiValueRow, blockedCount > 0 ? COLOR.blockedAmber : COLOR.cardMuted);
  addKpiCard(sheet, "잔여 이슈", remainingCount, 4, secondKpiValueRow, COLOR.remainingAmber);
  addKpiCard(sheet, "High Risk", highRemainingCount, 8, secondKpiValueRow, highRemainingCount > 0 ? COLOR.strongRed : COLOR.cardMuted);
  [firstKpiLabelRow, secondKpiLabelRow].forEach((row) =>
    sheet.tallRows.push({ row, pixelSize: 22 })
  );
  [firstKpiValueRow, secondKpiValueRow].forEach((row) =>
    sheet.tallRows.push({ row, pixelSize: 36 })
  );

  addSection(sheet, "QA 이슈 현황");
  const issueOverviewStartRow = sheet.rows.length;
  Array.from({ length: 5 }).forEach(() => sheet.rows.push(createRow([])));
  addIssueOverviewCard(
    sheet,
    "발생 이슈 현황",
    "대응 대상 이슈",
    "기획의도 / 버그아님 / 중복이슈 제외 기준",
    qaIssueOverview.created,
    0,
    4,
    issueOverviewStartRow,
    COLOR.panel
  );
  addIssueOverviewCard(
    sheet,
    "수정 완료 현황",
    "수정 완료 이슈",
    "QA승인 / 완료 / 닫음 상태 기준",
    qaIssueOverview.resolved,
    4,
    8,
    issueOverviewStartRow,
    COLOR.mutedGreen
  );
  addIssueOverviewCard(
    sheet,
    "잔여 이슈 현황",
    "현재 Remaining",
    "현재 미해결 상태 기준 (완료 / 제외 처리 제외)",
    qaIssueOverview.remaining,
    8,
    COLUMN_COUNT,
    issueOverviewStartRow,
    remainingCount > 0 ? COLOR.softAmberPanel : COLOR.cardMuted,
    true
  );

  addSection(sheet, "주요 리스크 현황");
  const signalStartRow = sheet.rows.length;
  sheet.rows.push(createRow([]));
  sheet.rows.push(createRow([]));
  addSignalCard(
    sheet,
    "High Risk 잔여",
    `${highRemainingCount}건`,
    highRemainingCount > 0 ? "릴리즈 전 확인 필요" : "추가 High Risk 신호 없음",
    0,
    signalStartRow,
    highRemainingCount > 0 ? COLOR.strongRed : COLOR.cardMuted,
    3
  );
  addSignalCard(
    sheet,
    "Remaining",
    `${remainingCount}건`,
    remainingCount > 0 ? "배포 후 모니터링 필요" : "잔여 이슈 없음",
    3,
    signalStartRow,
    COLOR.cardMuted,
    3
  );
  addSignalCard(
    sheet,
    "Blocked",
    `${blockedCount}건`,
    blockedCount > 0 ? "영향 범위 확인 필요" : "진행 차단 없음",
    6,
    signalStartRow,
    blockedCount > 0 ? COLOR.softOrangePanel : COLOR.cardMuted,
    3
  );
  addSignalCard(
    sheet,
    "배포완료 확인",
    `${deployedDoneCount}건`,
    deployedDoneCount > 0 ? "최종 반영 확인 필요" : "추가 확인 항목 없음",
    9,
    signalStartRow,
    COLOR.mutedBlue,
    3
  );
  sheet.tallRows.push({ row: signalStartRow, pixelSize: 22 });
  sheet.tallRows.push({ row: signalStartRow + 1, pixelSize: 30 });

  addSection(sheet, "우선 확인 필요 이슈");
  const issueHeaderRow = sheet.rows.length;
  sheet.rows.push(["우선순위", "이슈 키", "요약", "", "", "", "", "", "", "상태", "", ""]);
  addMerge(sheet, issueHeaderRow, issueHeaderRow + 1, 2, 9);
  addMerge(sheet, issueHeaderRow, issueHeaderRow + 1, 9, COLUMN_COUNT);
  sheet.tableHeaders.push({
    startRow: issueHeaderRow,
    endRow: issueHeaderRow + 1,
    startColumn: 0,
    endColumn: COLUMN_COUNT,
  });
  highPriorityRemainingIssues.forEach((issue) => {
    const rowIndex = sheet.rows.length;
    sheet.rows.push([
      issue.priority,
      issue.key,
      issue.summary,
      "",
      "",
      "",
      "",
      "",
      "",
      issue.status,
      "",
      "",
    ]);
    addMerge(sheet, rowIndex, rowIndex + 1, 2, 9);
    addMerge(sheet, rowIndex, rowIndex + 1, 9, COLUMN_COUNT);
    sheet.tallRows.push({ row: rowIndex, pixelSize: 32 });
    sheet.highRiskRows.push({
      startRow: rowIndex,
      endRow: rowIndex + 1,
      startColumn: 0,
      endColumn: 1,
      backgroundColor:
        issue.priority === "Highest" ? COLOR.strongRed : COLOR.mutedRed,
      foregroundColor: COLOR.white,
      bold: true,
    });
  });
  if (remainingExtraCount > 0) {
    const moreRow = addMergedRow(
      sheet,
      `+ 잔여 이슈 ${remainingExtraCount}건 추가 존재${remainingExtraSummaryText}`
    );
    sheet.tallRows.push({ row: moreRow, pixelSize: 28 });
    sheet.infoBoxes.push({
      startRow: moreRow,
      endRow: moreRow + 1,
      startColumn: 0,
      endColumn: COLUMN_COUNT,
      backgroundColor: COLOR.cardMuted,
    });
  }
  sheet.tableRanges.push({
    startRow: issueHeaderRow,
    endRow: sheet.rows.length,
    startColumn: 0,
    endColumn: COLUMN_COUNT,
  });

  addSection(sheet, "QA Comment / 협의 사항");
  const followUpStartRow = sheet.rows.length;
  ["차기 수정 예정", "운영 정책 협의", "배포 후 확인", "기타 후속 조치"].forEach(
    (category) => {
      const items = groupedFollowUps[category];
      if (!items || items.length === 0) return;
      const categoryRow = addMergedRow(sheet, `[ ${category} ]`);
      sheet.tallRows.push({ row: categoryRow, pixelSize: 30 });
      sheet.warningBoxes.push({
        startRow: categoryRow,
        endRow: categoryRow + 1,
        startColumn: 0,
        endColumn: COLUMN_COUNT,
        backgroundColor: COLOR.panel2,
      });
      items.forEach((item) => {
        const rowIndex = addMergedRow(sheet, `- ${item}`);
        sheet.tallRows.push({ row: rowIndex, pixelSize: 40 });
        sheet.mutedTextRanges.push({
          startRow: rowIndex,
          endRow: rowIndex + 1,
          startColumn: 0,
          endColumn: COLUMN_COUNT,
          foregroundColor: COLOR.muted,
          fontSize: 11,
          horizontalAlignment: "LEFT",
        });
      });
    }
  );
  if (sheet.rows.length === followUpStartRow) {
    addMergedRow(sheet, "- 추출된 QA 코멘트 / 후속 조치가 없습니다.");
  }
  sheet.infoBoxes.push({
    startRow: followUpStartRow,
    endRow: sheet.rows.length,
    startColumn: 0,
    endColumn: COLUMN_COUNT,
    backgroundColor: COLOR.panel,
  });

  return sheet;
}

function gridRange(
  sheetId: number,
  startRowIndex: number,
  endRowIndex: number,
  startColumnIndex = 0,
  endColumnIndex = COLUMN_COUNT
) {
  return {
    sheetId,
    startRowIndex,
    endRowIndex,
    startColumnIndex,
    endColumnIndex,
  };
}

function createCellFormat(
  backgroundColor: SheetColor | undefined,
  foregroundColor = COLOR.white,
  bold = false,
  fontSize?: number,
  horizontalAlignment: "LEFT" | "CENTER" = "LEFT"
) {
  return {
    userEnteredFormat: {
      ...(backgroundColor ? { backgroundColor } : {}),
      horizontalAlignment,
      verticalAlignment: "MIDDLE",
      wrapStrategy: "WRAP",
      textFormat: {
        bold,
        ...(fontSize ? { fontSize } : {}),
        foregroundColor,
        fontFamily: "Arial",
      },
    },
  };
}

function pushRepeatCell(
  requests: SheetsRequest[],
  sheetId: number,
  range: GridRange,
  cell: Record<string, unknown>,
  fields =
    "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)"
) {
  requests.push({
    repeatCell: {
      range: gridRange(
        sheetId,
        range.startRow,
        range.endRow,
        range.startColumn,
        range.endColumn
      ),
      cell,
      fields,
    },
  });
}

// Kept only as a reference for the pre-template renderer. Do not use as fallback.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createFormatRequests(sheetId: number, sheet: DashboardSheet) {
  const usedRows = Math.max(sheet.rows.length, 1);
  const requests: SheetsRequest[] = [
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: {
            frozenRowCount: 0,
            hideGridlines: true,
          },
          tabColor: COLOR.header,
        },
        fields: "gridProperties.frozenRowCount,gridProperties.hideGridlines,tabColor",
      },
    },
    {
      repeatCell: {
        range: gridRange(sheetId, 0, usedRows, 0, COLUMN_COUNT),
        cell: createCellFormat(COLOR.background, COLOR.muted),
        fields:
          "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)",
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: 0,
          endIndex: usedRows,
        },
        properties: { pixelSize: 24 },
        fields: "pixelSize",
      },
    },
    ...Array.from({ length: COLUMN_COUNT }, () => 74).map((pixelSize, index) => ({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: index,
          endIndex: index + 1,
        },
        properties: { pixelSize },
        fields: "pixelSize",
      },
    })),
  ];

  sheet.merges.forEach((range) => {
    requests.push({
      mergeCells: {
        range: gridRange(
          sheetId,
          range.startRow,
          range.endRow,
          range.startColumn,
          range.endColumn
        ),
        mergeType: "MERGE_ALL",
      },
    });
  });

  if (sheet.heroRange) {
    pushRepeatCell(
      requests,
      sheetId,
      sheet.heroRange,
      createCellFormat(COLOR.header, COLOR.white, true, 14, "LEFT")
    );
  }

  if (sheet.heroBadgeRange) {
    pushRepeatCell(
      requests,
      sheetId,
      sheet.heroBadgeRange,
      createCellFormat(
        sheet.heroBadgeRange.backgroundColor,
        COLOR.white,
        true,
        sheet.heroBadgeRange.fontSize,
        "CENTER"
      )
    );
  }

  sheet.titleRows.forEach((row) => {
    pushRepeatCell(
      requests,
      sheetId,
      { startRow: row, endRow: row + 1, startColumn: 4, endColumn: COLUMN_COUNT },
      createCellFormat(COLOR.header, COLOR.white, true, 14, "LEFT")
    );
  });

  sheet.subtitleRows.forEach((row) => {
    pushRepeatCell(
      requests,
      sheetId,
      { startRow: row, endRow: row + 1, startColumn: 4, endColumn: COLUMN_COUNT },
      createCellFormat(COLOR.header, COLOR.muted, true, 11, "LEFT")
    );
  });

  sheet.sectionRows.forEach((row) => {
    pushRepeatCell(
      requests,
      sheetId,
      { startRow: row, endRow: row + 1, startColumn: 0, endColumn: COLUMN_COUNT },
      createCellFormat(COLOR.background, COLOR.white, true, 12, "LEFT")
    );
  });

  sheet.infoBoxes.forEach((range) => {
    pushRepeatCell(
      requests,
      sheetId,
      range,
      createCellFormat(range.backgroundColor ?? COLOR.panel, COLOR.white, false, 11)
    );
  });

  sheet.warningBoxes.forEach((range) => {
    pushRepeatCell(
      requests,
      sheetId,
      range,
      createCellFormat(range.backgroundColor ?? COLOR.panel2, COLOR.white, true, 11)
    );
  });

  sheet.kpiCards.forEach((range) => {
    pushRepeatCell(
      requests,
      sheetId,
      range,
      createCellFormat(range.backgroundColor, COLOR.white, true, 10, "CENTER")
    );
    requests.push({
      updateBorders: {
        range: gridRange(
          sheetId,
          range.startRow,
          range.endRow,
          range.startColumn,
          range.endColumn
        ),
        top: { style: "SOLID_THICK", width: 2, color: COLOR.background },
        bottom: { style: "SOLID_THICK", width: 2, color: COLOR.background },
        left: { style: "SOLID_THICK", width: 2, color: COLOR.background },
        right: { style: "SOLID_THICK", width: 2, color: COLOR.background },
        innerHorizontal: { style: "SOLID", width: 1, color: COLOR.background },
      },
    });
  });

  sheet.signalCards.forEach((range) => {
    pushRepeatCell(
      requests,
      sheetId,
      range,
      createCellFormat(range.backgroundColor, COLOR.white, true, 10, "CENTER")
    );
    requests.push({
      updateBorders: {
        range: gridRange(
          sheetId,
          range.startRow,
          range.endRow,
          range.startColumn,
          range.endColumn
        ),
        top: { style: "SOLID_THICK", width: 2, color: COLOR.background },
        bottom: { style: "SOLID_THICK", width: 2, color: COLOR.background },
        left: { style: "SOLID_THICK", width: 2, color: COLOR.background },
        right: { style: "SOLID_THICK", width: 2, color: COLOR.background },
      },
    });
  });

  sheet.tableHeaders.forEach((range) => {
    pushRepeatCell(
      requests,
      sheetId,
      range,
      createCellFormat(COLOR.panel2, COLOR.white, true, 10, "CENTER")
    );
  });

  sheet.tableRanges.forEach((range) => {
    if (range.endRow > range.startRow + 1) {
      pushRepeatCell(
        requests,
        sheetId,
        {
          startRow: range.startRow + 1,
          endRow: range.endRow,
          startColumn: range.startColumn,
          endColumn: range.endColumn,
        },
        createCellFormat(COLOR.panel, COLOR.muted, false, 11)
      );
    }
    requests.push({
      updateBorders: {
        range: gridRange(
          sheetId,
          range.startRow,
          range.endRow,
          range.startColumn,
          range.endColumn
        ),
        top: { style: "SOLID", width: 1, color: COLOR.border },
        bottom: { style: "SOLID", width: 1, color: COLOR.border },
        left: { style: "SOLID", width: 1, color: COLOR.border },
        right: { style: "SOLID", width: 1, color: COLOR.border },
      },
    });
  });

  sheet.highRiskRows.forEach((range) => {
    pushRepeatCell(
      requests,
      sheetId,
      range,
      createCellFormat(range.backgroundColor, COLOR.white, range.bold ?? true, 10)
    );
  });

  sheet.issueRiskRows.forEach((range) => {
    pushRepeatCell(
      requests,
      sheetId,
      range,
      createCellFormat(
        range.backgroundColor,
        range.foregroundColor ?? COLOR.white,
        range.bold ?? false,
        10
      )
    );
  });

  sheet.mutedTextRanges.forEach((range) => {
    pushRepeatCell(
      requests,
      sheetId,
      range,
      createCellFormat(
        undefined,
        range.foregroundColor ?? COLOR.muted,
        range.bold ?? false,
        range.fontSize,
        range.horizontalAlignment ?? "CENTER"
      ),
      "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)"
    );
  });

  sheet.strongTextRanges.forEach((range) => {
    pushRepeatCell(
      requests,
      sheetId,
      range,
      createCellFormat(
        undefined,
        range.foregroundColor ?? COLOR.white,
        range.bold ?? true,
        range.fontSize,
        range.horizontalAlignment ?? "CENTER"
      ),
      "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)"
    );
  });

  sheet.tallRows.forEach(({ row, pixelSize }) => {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: row,
          endIndex: row + 1,
        },
        properties: { pixelSize },
        fields: "pixelSize",
      },
    });
  });

  return requests;
}

function createTemplateSystemAnalysisState({
  highRemainingCount,
  blockedCount,
  remainingCount,
  reopenedCount,
  nextEventCount,
  remainingPrioritySummary,
}: {
  highRemainingCount: number;
  blockedCount: number;
  remainingCount: number;
  reopenedCount: number;
  nextEventCount: number;
  remainingPrioritySummary: RcPrioritySummary;
}): QaJudgmentState {
  const mediumRemainingCount = remainingPrioritySummary.Medium ?? 0;
  const lowRiskRemainingCount =
    (remainingPrioritySummary.Low ?? 0) +
    (remainingPrioritySummary.Lowest ?? 0);

  if (
    highRemainingCount > 0 ||
    blockedCount >= 5 ||
    reopenedCount >= 3 ||
    remainingCount >= 15
  ) {
    return "위험";
  }

  if (
    mediumRemainingCount > 0 ||
    blockedCount > 0 ||
    reopenedCount > 0 ||
    nextEventCount >= 5 ||
    remainingCount > lowRiskRemainingCount
  ) {
    return "주의 필요";
  }

  return "안정";
}

function createTemplateRiskMessage({
  state,
  remainingCount,
  remainingPrioritySummary,
}: {
  state: QaJudgmentState;
  remainingCount: number;
  remainingPrioritySummary: RcPrioritySummary;
}) {
  const lowRiskRemainingCount =
    (remainingPrioritySummary.Low ?? 0) +
    (remainingPrioritySummary.Lowest ?? 0);

  if (state === "위험") return "운영/QA 리스크 관리 필요";
  if (state === "주의 필요") return "배포 후 확인 및 운영 모니터링 필요";
  if (remainingCount > 0 && remainingCount === lowRiskRemainingCount) {
    return "Low Remaining만 존재 / 운영 영향 낮음";
  }

  return "추가 차단 리스크 없음";
}

function createTemplateJudgmentReasonLines({
  state,
  highRemainingCount,
  failCount,
  blockedCount,
  remainingCount,
  remainingPrioritySummary,
}: {
  state: QaJudgmentState;
  highRemainingCount: number;
  failCount: number;
  blockedCount: number;
  remainingCount: number;
  remainingPrioritySummary: RcPrioritySummary;
}) {
  const lowRiskRemainingCount =
    (remainingPrioritySummary.Low ?? 0) +
    (remainingPrioritySummary.Lowest ?? 0);
  const finalReason =
    state === "안정"
      ? remainingCount > 0 && remainingCount === lowRiskRemainingCount
        ? "Low Known Issue / 운영 영향 낮음"
        : "추가 차단 리스크 없음"
      : "배포 후 운영/QA 모니터링 필요";

  return [
    highRemainingCount > 0
      ? "High 우선순위 잔여 이슈 확인 필요"
      : "High 우선순위 잔여 이슈 없음",
    `Fail ${failCount}건 / Blocked ${blockedCount}건 / 잔여 이슈 ${remainingCount}건`,
    "주요 기능 플로우는 검증 완료",
    finalReason,
  ];
}

function createTemplateQaSummaryLines(
  body: CreateResultSheetRequest,
  highRemainingCount: number
) {
  const aiLines = body.aiAnalysisText
    ?.trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (aiLines && aiLines.length > 0) {
    return aiLines.slice(0, TEMPLATE_QA_SUMMARY_MAX_LINES);
  }

  const previewLines = body.reportPreviewLines
    ?.map((line) => line.trim())
    .filter(Boolean);

  if (previewLines && previewLines.length > 0) {
    return previewLines.slice(0, TEMPLATE_QA_SUMMARY_MAX_LINES);
  }

  const reportTitle = body.reportTitle?.trim() || "기능 QA";

  if (highRemainingCount > 0) {
    return [
      `${reportTitle} QA 결과를 안내드립니다.`,
      `현재 주요 잔여 이슈 ${highRemainingCount}건이 남아 있습니다.`,
      "세부 내용은 우선 확인 필요 이슈와 QA Comment / 협의 사항을 참고해 주세요.",
    ];
  }

  return [
    `${reportTitle} QA 결과를 안내드립니다.`,
    "현재 주요 잔여 이슈는 확인되지 않았습니다.",
    "배포 후 확인 항목은 QA Comment / 협의 사항 기준으로 관리해 주세요.",
  ];
}

function createPrioritySummaryFromIssues(issues: RemainingIssue[]) {
  const summary: RcPrioritySummary = {
    Highest: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Lowest: 0,
  };

  issues.forEach((issue) => {
    if (issue.priority in summary) {
      summary[issue.priority as keyof RcPrioritySummary] += 1;
    }
  });

  return summary;
}

function createTemplateIssueOverview(body: CreateResultSheetRequest) {
  return body.qaIssueOverview ?? createFallbackQaIssueOverview(body);
}

function createTemplateFollowUpCategory(followUp: string) {
  const normalized = followUp.toLowerCase();

  if (/다음 업데이트|차기|다음|수정하기로 협의|수정|fix/.test(normalized)) {
    return "차기 수정 예정";
  }

  if (/정책 확정|운영 정책|정책|협의|운영|policy/.test(normalized)) {
    return "운영 정책 협의";
  }

  if (/재검증|확인|배포 후|배포|릴리즈|release|모니터링|monitor/.test(normalized)) {
    return "배포 후 확인";
  }

  return "기타 후속 조치";
}

function isStableStateAutoFollowUp(followUp: string) {
  return /운영\s*모니터링\s*예정|low known issue|운영\s*영향\s*낮음/i.test(
    followUp
  );
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function estimateWrappedLineCount(text: string, charsPerLine: number) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return 1;
  }

  return normalizedText
    .split(/\r?\n/)
    .map((line) => Math.max(Math.ceil(line.length / charsPerLine), 1))
    .reduce((total, lines) => total + lines, 0);
}

function estimateWrappedRowHeight(
  text: string,
  charsPerLine: number,
  minHeight: number,
  maxHeight: number
) {
  const lineCount = estimateWrappedLineCount(text, charsPerLine);
  return clampNumber(22 + lineCount * 16, minHeight, maxHeight);
}

function estimateQaSummaryRowHeight(text: string) {
  const lineCount = estimateWrappedLineCount(text, 94);

  if (lineCount <= 1) {
    return 34;
  }

  if (lineCount === 2) {
    return 48;
  }

  return 58;
}

function createTemplateValues(
  sheetName: string,
  body: CreateResultSheetRequest
) {
  const passCount = getSummaryCount(body.qaSummary, "Pass");
  const failCount = getSummaryCount(body.qaSummary, "Fail");
  const blockedCount = getSummaryCount(body.qaSummary, "Blocked");
  const nextEventCount = getSummaryCount(body.qaSummary, "NextEvent");
  const totalTc = passCount + failCount + blockedCount + nextEventCount;
  const remainingCount = getSummaryCount(body.jiraFilteredSummary, "Remaining");
  const highRemainingCount = getSummaryCount(
    body.jiraFilteredSummary,
    "High / Highest Remaining"
  );
  const reopenedCount = getSummaryCount(body.jiraStatusSummary, "다시열림");
  const issueOverview = createTemplateIssueOverview(body);
  const remainingPrioritySummary = createPrioritySummaryFromIssues(
    body.remainingIssues ?? []
  );
  const effectiveRemainingPrioritySummary: RcPrioritySummary = {
    Highest: Math.max(
      issueOverview.remaining.prioritySummary.Highest ?? 0,
      remainingPrioritySummary.Highest ?? 0
    ),
    High: Math.max(
      issueOverview.remaining.prioritySummary.High ?? 0,
      remainingPrioritySummary.High ?? 0
    ),
    Medium: Math.max(
      issueOverview.remaining.prioritySummary.Medium ?? 0,
      remainingPrioritySummary.Medium ?? 0
    ),
    Low: Math.max(
      issueOverview.remaining.prioritySummary.Low ?? 0,
      remainingPrioritySummary.Low ?? 0
    ),
    Lowest: Math.max(
      issueOverview.remaining.prioritySummary.Lowest ?? 0,
      remainingPrioritySummary.Lowest ?? 0
    ),
  };
  const state = createTemplateSystemAnalysisState({
    highRemainingCount,
    blockedCount,
    remainingCount,
    reopenedCount,
    nextEventCount,
    remainingPrioritySummary: effectiveRemainingPrioritySummary,
  });
  const systemRiskMessage = createTemplateRiskMessage({
    state,
    remainingCount,
    remainingPrioritySummary: effectiveRemainingPrioritySummary,
  });
  const judgmentReasonLines = createTemplateJudgmentReasonLines({
    state,
    highRemainingCount,
    failCount,
    blockedCount,
    remainingCount,
    remainingPrioritySummary: effectiveRemainingPrioritySummary,
  });
  const qaSummaryLines = createTemplateQaSummaryLines(body, highRemainingCount);
  const sortedRemainingIssues = sortRemainingIssues(body.remainingIssues ?? []);
  const highPriorityRemainingIssues = sortedRemainingIssues.filter(
    isHighPriorityRemainingIssue
  );
  const summarizedRemainingIssues = sortedRemainingIssues.filter(
    isMediumLowRemainingIssue
  );
  const remainingExtraCount = summarizedRemainingIssues.length;
  const remainingExtraSummaryText =
    createMediumLowRemainingIssueSummaryText(summarizedRemainingIssues);
  const hasExtraIssueSummary = remainingExtraCount > 0;
  const rawFollowUps =
    body.qaFollowUps && body.qaFollowUps.length > 0
      ? body.qaFollowUps
      : [];
  const followUps =
    state === "안정"
      ? rawFollowUps.filter((followUp) => !isStableStateAutoFollowUp(followUp))
      : rawFollowUps;
  const groupedFollowUps = followUps.reduce<Record<string, string[]>>(
    (groups, followUp) => {
      const category = createTemplateFollowUpCategory(followUp);
      groups[category] = [...(groups[category] ?? []), followUp];
      return groups;
    },
    {}
  );
  const issueStartRow = TEMPLATE_ISSUE_START_ROW;
  const highIssueRows = highPriorityRemainingIssues.map((issue) => [
    issue.priority,
    issue.key,
    issue.summary,
    issue.status,
  ]);
  const baseIssueRows = Math.max(highIssueRows.length, 1);
  const issueRows = baseIssueRows + (hasExtraIssueSummary ? 1 : 0);
  const issueExtraRows = Math.max(
    issueRows - TEMPLATE_ISSUE_BODY_CAPACITY,
    0
  );
  const extraIssueRow = issueStartRow + baseIssueRows;
  const commentRows: Array<Array<string>> = [];
  const commentCategoryOffsets: number[] = [];
  const commentCategories = [
    "차기 수정 예정",
    "운영 정책 협의",
    "배포 후 확인",
    "기타 후속 조치",
  ];

  if (followUps.length === 0) {
    commentRows.push(["- 특이사항 없습니다."]);
  } else {
    commentCategories.forEach((category) => {
      const items = groupedFollowUps[category];

      if (!items || items.length === 0) return;

      commentCategoryOffsets.push(commentRows.length);
      commentRows.push([`[ ${category} ]`]);
      items.forEach((item) => commentRows.push([`- ${item}`]));
    });
  }

  const actualCommentRows = Math.max(commentRows.length, 1);
  const commentExtraRows = Math.max(
    actualCommentRows - TEMPLATE_COMMENT_BODY_CAPACITY,
    0
  );
  const commentTitleRow =
    highPriorityRemainingIssues.length > 0 || hasExtraIssueSummary
      ? hasExtraIssueSummary
        ? extraIssueRow + 1
        : issueStartRow + baseIssueRows
      : issueStartRow + 2;
  const dynamicLayout: TemplateDynamicLayout = {
    issueStartRow,
    issueRows,
    highPriorityIssueRows: highPriorityRemainingIssues.length,
    issueExtraRows,
    extraIssueRow,
    hasExtraIssueSummary,
    commentTitleRow,
    commentRows: actualCommentRows,
    commentExtraRows,
    commentCategoryOffsets,
    qaSummaryRowHeights: Array.from(
      { length: TEMPLATE_QA_SUMMARY_MAX_LINES },
      (_, index) =>
        qaSummaryLines[index] ? estimateQaSummaryRowHeight(qaSummaryLines[index]) : 6
    ),
    commentRowHeights:
      commentRows.length > 0
        ? commentRows.map((row, index) =>
            commentCategoryOffsets.includes(index)
              ? 30
              : estimateWrappedRowHeight(row[0] ?? "", 86, 32, 72)
          )
        : [32],
  };

  const priorityValues = (section: QaIssueOverviewSection) => [
    section.prioritySummary.Highest,
    section.prioritySummary.High,
    section.prioritySummary.Medium,
    section.prioritySummary.Low,
  ];
  const highIssueEndRow = issueStartRow + highPriorityRemainingIssues.length - 1;
  const extraIssueSummaryText = `+ 잔여 이슈 ${remainingExtraCount}건 추가 존재${remainingExtraSummaryText}`;
  const issueValueUpdates: ValueUpdate[] =
    highPriorityRemainingIssues.length > 0
      ? [
          {
            range: `${quoteSheetName(sheetName)}!A${issueStartRow}:A${
              highIssueEndRow
            }`,
            values: highPriorityRemainingIssues.map((issue) => [issue.priority]),
          },
          {
            range: `${quoteSheetName(sheetName)}!B${issueStartRow}:B${
              highIssueEndRow
            }`,
            values: highPriorityRemainingIssues.map((issue) => [issue.key]),
          },
          {
            range: `${quoteSheetName(sheetName)}!C${issueStartRow}:C${
              highIssueEndRow
            }`,
            values: highPriorityRemainingIssues.map((issue) => [issue.summary]),
          },
          {
            range: `${quoteSheetName(sheetName)}!J${issueStartRow}:J${
              highIssueEndRow
            }`,
            values: highPriorityRemainingIssues.map((issue) => [issue.status]),
          },
        ]
      : [
          {
            range: `${quoteSheetName(sheetName)}!A${issueStartRow}`,
            values: [["High / Highest 우선 확인 필요 이슈가 없습니다."]],
          },
        ];

  if (hasExtraIssueSummary) {
    issueValueUpdates.push({
      range: `${quoteSheetName(sheetName)}!A${extraIssueRow}`,
      values: [[extraIssueSummaryText]],
    });
  }

  return {
    sheetName,
    copiedSheetState: state,
    highPriorityRemainingIssues,
    totalRemainingIssuesCount: sortedRemainingIssues.length,
    remainingExtraCount,
    remainingExtraSummaryText,
    extraIssueSummaryText: hasExtraIssueSummary ? extraIssueSummaryText : "",
    dynamicLayout,
    updates: [
      { range: `${quoteSheetName(sheetName)}!A1`, values: [[state]] },
      { range: `${quoteSheetName(sheetName)}!E1`, values: [["QA 릴리즈 대시보드"]] },
      {
        range: `${quoteSheetName(sheetName)}!E2`,
        values: [[body.reportTitle?.trim() || "기능 QA 결과 리포트"]],
      },
      {
        range: `${quoteSheetName(sheetName)}!E3`,
        values: [[`${createHeroTargetVersionLabel(body)} | ${createHeroQaPeriodLabel(body)}`]],
      },
      {
        range: `${quoteSheetName(sheetName)}!E4`,
        values: [[`최종 업데이트 ${formatDisplayTimestamp()} | QA 담당자 TBD`]],
      },
      {
        range: `${quoteSheetName(sheetName)}!E5`,
        values: [
          [
            [
              `시스템 분석 결과: ${state}`,
              `High 우선순위 잔여 ${highRemainingCount}건`,
              `Blocked ${blockedCount}건 / NextEvent ${nextEventCount}건`,
              systemRiskMessage,
            ].join("\n"),
          ],
        ],
      },
      {
        range: `${quoteSheetName(sheetName)}!A7:A10`,
        values: judgmentReasonLines.map((line) => [`- ${line}`]),
      },
      {
        range: `${quoteSheetName(sheetName)}!A13:A20`,
        values: Array.from(
          { length: TEMPLATE_QA_SUMMARY_MAX_LINES },
          (_, index) => [qaSummaryLines[index]?.trim() ?? ""]
        ),
      },
      {
        range: `${quoteSheetName(sheetName)}!A24`,
        values: [[totalTc]],
      },
      {
        range: `${quoteSheetName(sheetName)}!E24`,
        values: [[passCount]],
      },
      {
        range: `${quoteSheetName(sheetName)}!I24`,
        values: [[failCount]],
      },
      {
        range: `${quoteSheetName(sheetName)}!A25`,
        values: [["Blocked"]],
      },
      {
        range: `${quoteSheetName(sheetName)}!E25`,
        values: [["잔여 이슈"]],
      },
      {
        range: `${quoteSheetName(sheetName)}!I25`,
        values: [["High Risk"]],
      },
      {
        range: `${quoteSheetName(sheetName)}!A26`,
        values: [[blockedCount]],
      },
      {
        range: `${quoteSheetName(sheetName)}!E26`,
        values: [[remainingCount]],
      },
      {
        range: `${quoteSheetName(sheetName)}!I26`,
        values: [[highRemainingCount]],
      },
      {
        range: `${quoteSheetName(sheetName)}!A31:D31`,
        values: [priorityValues(issueOverview.created)],
      },
      {
        range: `${quoteSheetName(sheetName)}!E31:H31`,
        values: [priorityValues(issueOverview.resolved)],
      },
      {
        range: `${quoteSheetName(sheetName)}!I31:L31`,
        values: [priorityValues(issueOverview.remaining)],
      },
      {
        range: `${quoteSheetName(sheetName)}!A32`,
        values: [[`대응 대상 이슈 ${issueOverview.created.total}건`]],
      },
      {
        range: `${quoteSheetName(sheetName)}!E32`,
        values: [[`수정 완료 이슈 ${issueOverview.resolved.total}건`]],
      },
      {
        range: `${quoteSheetName(sheetName)}!I32`,
        values: [[`현재 Remaining ${issueOverview.remaining.total}건`]],
      },
      {
        range: `${quoteSheetName(sheetName)}!A37`,
        values: [[`${highRemainingCount}건`]],
      },
      {
        range: `${quoteSheetName(sheetName)}!D37`,
        values: [[`${remainingCount}건`]],
      },
      {
        range: `${quoteSheetName(sheetName)}!G37`,
        values: [[`${blockedCount}건`]],
      },
      {
        range: `${quoteSheetName(sheetName)}!J37`,
        values: [[`${nextEventCount}건`]],
      },
      ...issueValueUpdates,
      {
        range: `${quoteSheetName(sheetName)}!A${commentTitleRow}`,
        values: [["QA Comment / 협의 사항"]],
      },
      {
        range: `${quoteSheetName(sheetName)}!A${commentTitleRow + 1}:A${
          commentTitleRow + Math.max(commentRows.length, 1)
        }`,
        values: commentRows.length > 0 ? commentRows : [["- 특이사항 없습니다."]],
      },
      {
        range: `${quoteSheetName(sheetName)}!A31`,
        values: [[issueOverview.created.prioritySummary.Highest]],
      },
      {
        range: `${quoteSheetName(sheetName)}!B31`,
        values: [[issueOverview.created.prioritySummary.High]],
      },
      {
        range: `${quoteSheetName(sheetName)}!C31`,
        values: [[issueOverview.created.prioritySummary.Medium]],
      },
      {
        range: `${quoteSheetName(sheetName)}!D31`,
        values: [[issueOverview.created.prioritySummary.Low]],
      },
      {
        range: `${quoteSheetName(sheetName)}!I31`,
        values: [[remainingPrioritySummary.Highest]],
      },
      {
        range: `${quoteSheetName(sheetName)}!J31`,
        values: [[remainingPrioritySummary.High]],
      },
      {
        range: `${quoteSheetName(sheetName)}!K31`,
        values: [[remainingPrioritySummary.Medium]],
      },
      {
        range: `${quoteSheetName(sheetName)}!L31`,
        values: [[remainingPrioritySummary.Low]],
      },
    ] satisfies ValueUpdate[],
  };
}

async function readGoogleError(response: Response) {
  const errorBody = await response.text();
  return errorBody || `${response.status} ${response.statusText}`;
}

async function copyTemplateSheet(
  accessToken: string,
  destinationSpreadsheetId: string
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${TEMPLATE_SPREADSHEET_ID}/sheets/${TEMPLATE_QA_RESULT_SHEET_ID}:copyTo`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destinationSpreadsheetId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Template sheet copyTo request failed: ${await readGoogleError(response)}`
    );
  }

  const copiedSheet = (await response.json()) as CopyToSheetResponse;

  if (typeof copiedSheet.sheetId !== "number") {
    throw new Error("Template sheet copyTo response did not include sheetId.");
  }

  return copiedSheet.sheetId;
}

async function renameCopiedSheet(
  accessToken: string,
  spreadsheetId: string,
  copiedSheetId: number,
  sheetName: string
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: copiedSheetId,
                title: sheetName,
              },
              fields: "title",
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Copied template sheet rename request failed: ${await readGoogleError(
        response
      )}`
    );
  }
}

function createRowInsertRequest(
  sheetId: number,
  startIndex: number,
  rowCount: number
) {
  return {
    insertDimension: {
      range: {
        sheetId,
        dimension: "ROWS",
        startIndex,
        endIndex: startIndex + rowCount,
      },
      inheritFromBefore: true,
    },
  };
}

function createMergeRequest(
  sheetId: number,
  rowIndex: number,
  startColumnIndex = 0,
  endColumnIndex = COLUMN_COUNT
) {
  return {
    mergeCells: {
      range: gridRange(
        sheetId,
        rowIndex,
        rowIndex + 1,
        startColumnIndex,
        endColumnIndex
      ),
      mergeType: "MERGE_ALL",
    },
  };
}

function createRowHeightRequest(
  sheetId: number,
  rowIndex: number,
  pixelSize: number
) {
  return {
    updateDimensionProperties: {
      range: {
        sheetId,
        dimension: "ROWS",
        startIndex: rowIndex,
        endIndex: rowIndex + 1,
      },
      properties: { pixelSize },
      fields: "pixelSize",
    },
  };
}

function createTemplateRepeatCellRequest(
  sheetId: number,
  startRowIndex: number,
  endRowIndex: number,
  startColumnIndex: number,
  endColumnIndex: number,
  backgroundColor: SheetColor,
  foregroundColor = COLOR.muted,
  bold = false,
  fontSize = 11,
  horizontalAlignment: "LEFT" | "CENTER" = "LEFT"
) {
  return {
    repeatCell: {
      range: gridRange(
        sheetId,
        startRowIndex,
        endRowIndex,
        startColumnIndex,
        endColumnIndex
      ),
      cell: createCellFormat(
        backgroundColor,
        foregroundColor,
        bold,
        fontSize,
        horizontalAlignment
      ),
      fields:
        "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)",
    },
  };
}

function createCopyPasteFormatRequest(
  sheetId: number,
  sourceRowIndex: number,
  destinationStartRowIndex: number,
  destinationEndRowIndex: number
) {
  return {
    copyPaste: {
      source: gridRange(sheetId, sourceRowIndex, sourceRowIndex + 1, 0, COLUMN_COUNT),
      destination: gridRange(
        sheetId,
        destinationStartRowIndex,
        destinationEndRowIndex,
        0,
        COLUMN_COUNT
      ),
      pasteType: "PASTE_FORMAT",
      pasteOrientation: "NORMAL",
    },
  };
}

async function prepareCopiedTemplateDynamicRows(
  accessToken: string,
  spreadsheetId: string,
  copiedSheetId: number,
  layout: TemplateDynamicLayout
) {
  const requests: SheetsRequest[] = [];

  if (layout.issueExtraRows > 0) {
    const insertAtIndex =
      TEMPLATE_ISSUE_START_ROW - 1 + TEMPLATE_ISSUE_BODY_CAPACITY;
    requests.push(
      createRowInsertRequest(copiedSheetId, insertAtIndex, layout.issueExtraRows),
      createCopyPasteFormatRequest(
        copiedSheetId,
        insertAtIndex - 1,
        insertAtIndex,
        insertAtIndex + layout.issueExtraRows
      )
    );

    for (let offset = 0; offset < layout.issueExtraRows; offset += 1) {
      const rowIndex = insertAtIndex + offset;
      requests.push(
        {
          unmergeCells: {
            range: gridRange(copiedSheetId, rowIndex, rowIndex + 1, 0, COLUMN_COUNT),
          },
        },
        createMergeRequest(copiedSheetId, rowIndex, 2, 9),
        createMergeRequest(copiedSheetId, rowIndex, 9, COLUMN_COUNT)
      );
    }
  }

  if (layout.commentExtraRows > 0) {
    const insertAtIndex =
      layout.commentTitleRow - 1 + 1 + TEMPLATE_COMMENT_BODY_CAPACITY;
    requests.push(
      createRowInsertRequest(
        copiedSheetId,
        insertAtIndex,
        layout.commentExtraRows
      ),
      createCopyPasteFormatRequest(
        copiedSheetId,
        insertAtIndex - 1,
        insertAtIndex,
        insertAtIndex + layout.commentExtraRows
      )
    );

    for (let offset = 0; offset < layout.commentExtraRows; offset += 1) {
      const rowIndex = insertAtIndex + offset;
      requests.push(
        {
          unmergeCells: {
            range: gridRange(copiedSheetId, rowIndex, rowIndex + 1, 0, COLUMN_COUNT),
          },
        },
        createMergeRequest(copiedSheetId, rowIndex)
      );
    }
  }

  for (let row = 0; row < TEMPLATE_QA_SUMMARY_MAX_LINES; row += 1) {
    const rowIndex = TEMPLATE_QA_SUMMARY_START_ROW - 1 + row;
    const hasSummaryLine = (layout.qaSummaryRowHeights[row] ?? 6) > 8;

    requests.push(
      createRowHeightRequest(
        copiedSheetId,
        rowIndex,
        layout.qaSummaryRowHeights[row] ?? 6
      ),
      createTemplateRepeatCellRequest(
        copiedSheetId,
        rowIndex,
        rowIndex + 1,
        0,
        COLUMN_COUNT,
        hasSummaryLine ? COLOR.mutedBlue : COLOR.background,
        COLOR.muted,
        false,
        11,
        "LEFT"
      )
    );
  }

  for (let offset = 0; offset < layout.issueRows; offset += 1) {
    const rowIndex = layout.issueStartRow - 1 + offset;
    const isHighPriorityIssueRow = offset < layout.highPriorityIssueRows;
    requests.push(
      createRowHeightRequest(copiedSheetId, rowIndex, 40),
      createTemplateRepeatCellRequest(
        copiedSheetId,
        rowIndex,
        rowIndex + 1,
        0,
        COLUMN_COUNT,
        COLOR.panel,
        COLOR.muted,
        false,
        11,
        "LEFT"
      )
    );

    if (!isHighPriorityIssueRow) {
      continue;
    }

    requests.push(
      createTemplateRepeatCellRequest(
        copiedSheetId,
        rowIndex,
        rowIndex + 1,
        0,
        1,
        COLOR.mutedRed,
        COLOR.white,
        true,
        10,
        "CENTER"
      )
    );
  }

  if (layout.highPriorityIssueRows === 0) {
    requests.push(
      {
        unmergeCells: {
          range: gridRange(
            copiedSheetId,
            layout.issueStartRow - 1,
            layout.issueStartRow,
            0,
            COLUMN_COUNT
          ),
        },
      },
      createMergeRequest(copiedSheetId, layout.issueStartRow - 1),
      createRowHeightRequest(copiedSheetId, layout.issueStartRow - 2, 8),
      createRowHeightRequest(copiedSheetId, layout.issueStartRow - 1, 32),
      createRowHeightRequest(copiedSheetId, layout.issueStartRow, 6),
      createTemplateRepeatCellRequest(
        copiedSheetId,
        layout.issueStartRow,
        layout.issueStartRow + 1,
        0,
        COLUMN_COUNT,
        COLOR.background,
        COLOR.muted,
        false,
        11,
        "LEFT"
      )
    );
  }

  if (layout.hasExtraIssueSummary) {
    const rowIndex = layout.extraIssueRow - 1;
    requests.push(
      {
        unmergeCells: {
          range: gridRange(copiedSheetId, rowIndex, rowIndex + 1, 0, COLUMN_COUNT),
        },
      },
      createMergeRequest(copiedSheetId, rowIndex),
      createRowHeightRequest(copiedSheetId, rowIndex, 30),
      createTemplateRepeatCellRequest(
        copiedSheetId,
        rowIndex,
        rowIndex + 1,
        0,
        COLUMN_COUNT,
        COLOR.cardMuted,
        COLOR.muted,
        false,
        11,
        "LEFT"
      )
    );
  }

  requests.push(
    {
      unmergeCells: {
        range: gridRange(
          copiedSheetId,
          layout.commentTitleRow - 1,
          layout.commentTitleRow,
          0,
          COLUMN_COUNT
        ),
      },
    },
    createMergeRequest(copiedSheetId, layout.commentTitleRow - 1),
    createRowHeightRequest(copiedSheetId, layout.commentTitleRow - 1, 30),
    createTemplateRepeatCellRequest(
      copiedSheetId,
      layout.commentTitleRow - 1,
      layout.commentTitleRow,
      0,
      COLUMN_COUNT,
      COLOR.background,
      COLOR.white,
      true,
      12,
      "LEFT"
    )
  );

  for (let offset = 0; offset < layout.commentRows; offset += 1) {
    const rowIndex = layout.commentTitleRow + offset;
    const isCategoryRow = layout.commentCategoryOffsets.includes(offset);
    requests.push(
      {
        unmergeCells: {
          range: gridRange(copiedSheetId, rowIndex, rowIndex + 1, 0, COLUMN_COUNT),
        },
      },
      createMergeRequest(copiedSheetId, rowIndex),
      createRowHeightRequest(
        copiedSheetId,
        rowIndex,
        layout.commentRowHeights[offset] ?? (isCategoryRow ? 30 : 36)
      ),
      createTemplateRepeatCellRequest(
        copiedSheetId,
        rowIndex,
        rowIndex + 1,
        0,
        COLUMN_COUNT,
        isCategoryRow ? COLOR.panel2 : COLOR.panel,
        isCategoryRow ? COLOR.white : COLOR.muted,
        isCategoryRow,
        11,
        "LEFT"
      )
    );
  }

  const cleanupStartRowIndex = layout.commentTitleRow + layout.commentRows;
  const cleanupEndRowIndex = 120;

  if (cleanupStartRowIndex < cleanupEndRowIndex) {
    requests.push(
      {
        unmergeCells: {
          range: gridRange(
            copiedSheetId,
            cleanupStartRowIndex,
            cleanupEndRowIndex,
            0,
            COLUMN_COUNT
          ),
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId: copiedSheetId,
            dimension: "ROWS",
            startIndex: cleanupStartRowIndex,
            endIndex: cleanupEndRowIndex,
          },
          properties: { pixelSize: 4 },
          fields: "pixelSize",
        },
      },
      createTemplateRepeatCellRequest(
        copiedSheetId,
        cleanupStartRowIndex,
        cleanupEndRowIndex,
        0,
        COLUMN_COUNT,
        COLOR.background,
        COLOR.muted,
        false,
        11,
        "LEFT"
      )
    );
  }

  if (requests.length === 0) {
    return;
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Copied template dynamic row preparation failed: ${await readGoogleError(
        response
      )}`
    );
  }
}

async function clearCopiedTemplateValues(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  hasHighPriorityIssues: boolean
) {
  const quotedSheetName = quoteSheetName(sheetName);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ranges: [
          `${quotedSheetName}!E2:E5`,
          `${quotedSheetName}!A7:A10`,
          `${quotedSheetName}!A13:A20`,
          `${quotedSheetName}!A24:I26`,
          `${quotedSheetName}!A31:L32`,
          `${quotedSheetName}!A37:J37`,
          ...(!hasHighPriorityIssues
            ? [`${quotedSheetName}!A${TEMPLATE_ISSUE_START_ROW - 1}:L${TEMPLATE_ISSUE_START_ROW - 1}`]
            : []),
          `${quotedSheetName}!A${TEMPLATE_ISSUE_START_ROW}:L120`,
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Copied template values clear request failed: ${await readGoogleError(
        response
      )}`
    );
  }
}

async function updateCopiedTemplateValues(
  accessToken: string,
  spreadsheetId: string,
  updates: ValueUpdate[]
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: updates,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Copied template values update request failed: ${await readGoogleError(
        response
      )}`
    );
  }
}

function columnName(index: number) {
  let name = "";
  let value = index + 1;

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

async function clearCopiedTemplateErrorValues(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  layout: TemplateDynamicLayout
) {
  const startRow = layout.issueStartRow;
  const endRow = layout.commentTitleRow + layout.commentRows + 3;
  const range = `${quoteSheetName(sheetName)}!A${startRow}:L${endRow}`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueRenderOption=FORMATTED_VALUE`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Copied template error scan request failed: ${await readGoogleError(
        response
      )}`
    );
  }

  const data = (await response.json()) as { values?: string[][] };
  const errorRanges =
    data.values?.flatMap((row, rowOffset) =>
      row.flatMap((value, columnIndex) => {
        const normalizedValue = String(value ?? "");

        if (
          !normalizedValue.includes("#ERROR!") &&
          !normalizedValue.includes("#REF!")
        ) {
          return [];
        }

        const cell = `${columnName(columnIndex)}${startRow + rowOffset}`;
        return [`${quoteSheetName(sheetName)}!${cell}`];
      })
    ) ?? [];

  if (errorRanges.length === 0) {
    return;
  }

  const clearResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ranges: errorRanges,
      }),
    }
  );

  if (!clearResponse.ok) {
    throw new Error(
      `Copied template error clear request failed: ${await readGoogleError(
        clearResponse
      )}`
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateResultSheetRequest;
    const sourceSpreadsheetId = body.spreadsheetId?.trim();
    const resultSpreadsheetId = process.env.RESULT_SPREADSHEET_ID?.trim();
    const spreadsheetId = resultSpreadsheetId || sourceSpreadsheetId;

    console.log("Create Result Sheet API received rcProgress:", body.rcProgress);
    console.log("Create Result Sheet API received rcProgress field:", {
      hasRcProgress: Boolean(body.rcProgress),
      rcLabel: body.rcProgress?.rcLabel,
      newIssues: body.rcProgress?.newIssues,
      fixedIssues: body.rcProgress?.fixedIssues,
      resolvedIssues: body.rcProgress?.resolvedIssues,
      remainingIssues: body.rcProgress?.remainingIssues,
      reopenedIssues: body.rcProgress?.reopenedIssues,
    });
    console.log(
      "Create Result Sheet API received qaIssueOverview:",
      body.qaIssueOverview
    );

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "RESULT_SPREADSHEET_ID or spreadsheetId is required." },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const sheetName = createSheetName(body.reportTitle ?? "");
    const copiedSheetId = await copyTemplateSheet(accessToken, spreadsheetId);
    const templateValues = createTemplateValues(sheetName, body);

    await renameCopiedSheet(accessToken, spreadsheetId, copiedSheetId, sheetName);
    await prepareCopiedTemplateDynamicRows(
      accessToken,
      spreadsheetId,
      copiedSheetId,
      templateValues.dynamicLayout
    );
    await clearCopiedTemplateValues(
      accessToken,
      spreadsheetId,
      sheetName,
      templateValues.highPriorityRemainingIssues.length > 0
    );
    await updateCopiedTemplateValues(
      accessToken,
      spreadsheetId,
      templateValues.updates
    );
    await clearCopiedTemplateErrorValues(
      accessToken,
      spreadsheetId,
      sheetName,
      templateValues.dynamicLayout
    );

    console.log("Create Result Sheet copied template:", {
      templateSpreadsheetId: TEMPLATE_SPREADSHEET_ID,
      templateSheetName: TEMPLATE_QA_RESULT_SHEET_NAME,
      templateSheetId: TEMPLATE_QA_RESULT_SHEET_ID,
      sourceSpreadsheetId,
      resultSpreadsheetId: spreadsheetId,
      copiedSheetId,
      sheetName,
      copiedSheetState: templateValues.copiedSheetState,
      highPriorityRemainingCount:
        templateValues.highPriorityRemainingIssues.length,
      totalRemainingIssuesCount: templateValues.totalRemainingIssuesCount,
      remainingExtraCount: templateValues.remainingExtraCount,
      remainingExtraSummaryText: templateValues.remainingExtraSummaryText,
      extraIssueSummaryText: templateValues.extraIssueSummaryText,
      commentTitleRow: templateValues.dynamicLayout.commentTitleRow,
      summaryRowIndex: templateValues.dynamicLayout.extraIssueRow,
      summaryWriteRange:
        templateValues.remainingExtraCount > 0
          ? `${quoteSheetName(sheetName)}!A${templateValues.dynamicLayout.extraIssueRow}`
          : "",
    });

    return NextResponse.json({
      sheetName,
      sheetId: copiedSheetId,
      spreadsheetId,
      sheetUrl: createSheetUrl(spreadsheetId, copiedSheetId),
    });
  } catch (error) {
    console.error("Create result sheet route error:", error);

    return NextResponse.json(
      {
        error: "Create result sheet route failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
