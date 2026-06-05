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

type OverallQaSummary = {
  Total: number;
  Pass: number;
  Fail: number;
  Blocked: number;
  NextEvent: number;
  "N/A": number;
};

type OverallTestSheetSummary = {
  title: string;
  rows: number;
  summary: OverallQaSummary;
};

type VersionIssueSummaryItem = {
  version: string;
  highHighest: number;
  medium: number;
  low: number;
  total: number;
};

type CreateOverallResultSheetRequest = {
  spreadsheetId?: string;
  reportTitle?: string;
  version?: string;
  rcVersion?: string;
  qaStartDateTime?: string;
  qaEndDateTime?: string | null;
  qaSummary?: CountSummary;
  testSheets?: TestSheetSummary[];
  overallTestSheets?: OverallTestSheetSummary[];
  jiraFilteredSummary?: CountSummary;
  jiraStatusSummary?: CountSummary;
  remainingIssues?: RemainingIssue[];
  rcProgress?: RcProgressSummary;
  qaIssueOverview?: QaIssueOverviewSummary;
  qaFollowUps?: string[];
  versionSummary?: VersionIssueSummaryItem[];
  versionIssueSummary?: VersionIssueSummaryItem[];
  reportPreviewLines?: string[];
  aiAnalysisText?: string;
};

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type CopyToSheetResponse = {
  sheetId?: number;
  title?: string;
};

type ValueUpdate = {
  range: string;
  values: Array<Array<string | number>>;
};

type SheetsRequest = Record<string, unknown>;

const TEMPLATE_SPREADSHEET_ID = "1B28oDAC73giOgrc4vq0hY9PS8LyycLymu1Kxe2dSPFA";
const TEMPLATE_QA_OVERALL_RESULT_SHEET_ID = 1733423286;
const TEMPLATE_QA_OVERALL_RESULT_SHEET_NAME = "TEMPLATE_QA_OVERALL_RESULT";
const COLUMN_COUNT = 12;
const COLOR = {
  background: { red: 0.025, green: 0.045, blue: 0.085 },
  panel: { red: 0.075, green: 0.105, blue: 0.16 },
  panel2: { red: 0.095, green: 0.13, blue: 0.19 },
  white: { red: 0.96, green: 0.98, blue: 1 },
  muted: { red: 0.62, green: 0.69, blue: 0.79 },
};

const ISSUE_START_ROW = 35;
const ISSUE_BODY_CAPACITY = 3;
const SUMMARY_START_ROW = 13;
const SUMMARY_BODY_CAPACITY = 8;
const SUMMARY_MIN_ROWS = 3;
const SUMMARY_MAX_ROWS = 8;
const FEATURE_START_ROW = 42;
const FEATURE_BODY_CAPACITY = 1;
const RC_START_ROW = 45;
const RC_BODY_CAPACITY = 1;
const VERSION_START_ROW = 48;
const VERSION_BODY_CAPACITY = 5;
const QA_COMMENT_TITLE_ROW = 56;
const QA_COMMENT_BODY_CAPACITY = 1;
const QA_COMMENT_CLEANUP_ROWS = 120;

function base64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwt(credentials: ServiceAccountCredentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
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
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return normalizeServiceAccountCredentials(
      JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) as ServiceAccountCredentials
    );
  }

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialPath) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS is not configured."
    );
  }

  const resolvedPath = path.isAbsolute(credentialPath)
    ? credentialPath
    : path.join(process.cwd(), credentialPath);
  const credentialText = await readFile(resolvedPath, "utf8");

  return normalizeServiceAccountCredentials(
    JSON.parse(credentialText) as ServiceAccountCredentials
  );
}

async function getAccessToken() {
  const credentials = await loadServiceAccountCredentials();
  const tokenUri = credentials.token_uri || "https://oauth2.googleapis.com/token";
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: createJwt(credentials),
    }),
  });
  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Google access token request failed."
    );
  }

  return data.access_token;
}

async function readGoogleError(response: Response) {
  return (await response.text()) || `${response.status} ${response.statusText}`;
}

function quoteSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`;
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

function getSummaryCount(summary: CountSummary | undefined, key: string) {
  return summary?.[key] ?? 0;
}

function getPrioritySummaryValue(
  summary: RcPrioritySummary | undefined,
  key: keyof RcPrioritySummary
) {
  return summary?.[key] ?? 0;
}

function formatTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hour}${minute}${second}`;
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

function formatDisplayDate(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) return "";

  const dateMatch = trimmedValue.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);

  if (!dateMatch) return trimmedValue;

  const [, year, month, day] = dateMatch;
  return `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`;
}

function normalizeRcVersion(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) return "";
  if (/^\d+$/.test(trimmedValue)) return `RC${trimmedValue}`;

  return trimmedValue.replace(/\brc\s*(\d+)\b/gi, "RC$1");
}

function createHeroReportTitle(body: CreateOverallResultSheetRequest) {
  const normalizedVersion = body.version?.trim() ?? "";
  const normalizedReportTitle = body.reportTitle?.trim() ?? "";
  const titleWithoutReportSuffix = normalizedReportTitle
    .replace(/\s*QA\s*결과\s*리포트\s*$/i, "")
    .trim();
  const titleCore =
    normalizedVersion &&
    titleWithoutReportSuffix
      .toLowerCase()
      .startsWith(normalizedVersion.toLowerCase())
      ? titleWithoutReportSuffix
      : [normalizedVersion, titleWithoutReportSuffix].filter(Boolean).join(" ");

  return `${titleCore || "릴리즈 전체"} QA 결과 리포트`;
}

function createHeroQaPeriodLabel(body: CreateOverallResultSheetRequest) {
  const startDate = formatDisplayDate(body.qaStartDateTime);
  const endDate = formatDisplayDate(body.qaEndDateTime) || "현재";

  if (!startDate) return `QA 기간 ${endDate}`;

  return `QA 기간 ${startDate} ~ ${endDate}`;
}

function createHeroMetaLabel(body: CreateOverallResultSheetRequest) {
  return [normalizeRcVersion(body.rcVersion), createHeroQaPeriodLabel(body)]
    .filter(Boolean)
    .join(" | ");
}

function sanitizeSheetTitle(title: string) {
  return (
    title
      .replace(/QA\s*결과\s*리포트/gi, "")
      .replace(/결과\s*리포트/gi, "")
      .replace(/Result\s*Report/gi, "")
      .replace(/QA\s*Dashboard/gi, "")
      .replace(/[\[\]\*\?\/\\:]/g, "")
      .replace(/\s+/g, "")
      .trim() || "Overall"
  ).slice(0, 72);
}

function createSheetName(reportTitle: string) {
  return `QA_Overall_${sanitizeSheetTitle(reportTitle)}_${formatTimestamp()}`.slice(
    0,
    100
  );
}

function createSheetUrl(spreadsheetId: string, sheetId: number) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`;
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

function createPrioritySummaryFromRemainingIssues(issues: RemainingIssue[]) {
  return issues.reduce<RcPrioritySummary>((summary, issue) => {
    if (issue.priority in summary) {
      summary[issue.priority as keyof RcPrioritySummary] += 1;
    }

    return summary;
  }, createEmptyPrioritySummary());
}

function createFallbackQaIssueOverview(
  body: CreateOverallResultSheetRequest
): QaIssueOverviewSummary {
  const remainingPrioritySummary = createPrioritySummaryFromRemainingIssues(
    body.remainingIssues ?? []
  );

  return {
    created: {
      total: getSummaryCount(body.jiraFilteredSummary, "Total"),
      prioritySummary: createEmptyPrioritySummary(),
    },
    resolved: {
      total: getSummaryCount(body.jiraFilteredSummary, "Resolved"),
      prioritySummary: createEmptyPrioritySummary(),
    },
    remaining: {
      total: getSummaryCount(body.jiraFilteredSummary, "Remaining"),
      prioritySummary: remainingPrioritySummary,
    },
  };
}

function createSystemState({
  highRemainingCount,
  blockedCount,
  remainingCount,
  nextEventCount,
}: {
  highRemainingCount: number;
  blockedCount: number;
  remainingCount: number;
  nextEventCount: number;
}) {
  if (highRemainingCount >= 5 || blockedCount >= 5) return "위험";
  if (highRemainingCount > 0 || blockedCount > 0 || remainingCount > 0) {
    return "주의 필요";
  }
  if (nextEventCount > 0) return "모니터링 필요";
  return "안정";
}

function createJudgmentReasonLines({
  state,
  highRemainingCount,
  failCount,
  blockedCount,
  remainingCount,
  nextEventCount,
}: {
  state: string;
  highRemainingCount: number;
  failCount: number;
  blockedCount: number;
  remainingCount: number;
  nextEventCount: number;
}) {
  return [
    `릴리즈 상태는 ${state}로 판단됩니다.`,
    `High Risk 잔여 ${highRemainingCount}건, Remaining ${remainingCount}건입니다.`,
    `QA Fail ${failCount}건, Blocked ${blockedCount}건, NextEvent ${nextEventCount}건입니다.`,
    "상세 리스크는 우선 확인 필요 이슈와 QA Comment를 함께 확인해주세요.",
  ];
}

// Retained only to avoid touching older fallback wording while the UTF-8
// fallback below is used for new Overall result generation.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createQaSummaryLines({
  totalTc,
  passCount,
  failCount,
  blockedCount,
  nextEventCount,
  remainingCount,
  highRemainingCount,
}: {
  totalTc: number;
  passCount: number;
  failCount: number;
  blockedCount: number;
  nextEventCount: number;
  remainingCount: number;
  highRemainingCount: number;
}) {
  return [
    `전체 QA 대상 ${totalTc}건 중 Pass ${passCount}건, Fail ${failCount}건입니다.`,
    `Blocked ${blockedCount}건, NextEvent ${nextEventCount}건이 남아 있습니다.`,
    `Jira Remaining ${remainingCount}건 중 High Risk 잔여는 ${highRemainingCount}건입니다.`,
    "피쳐별 QA 현황과 RC 진행 이슈 현황을 기준으로 릴리즈 흐름을 확인해주세요.",
  ];
}

function createQaSummaryLinesUtf8({
  totalTc,
  passCount,
  failCount,
  blockedCount,
  nextEventCount,
  remainingCount,
  highRemainingCount,
}: {
  totalTc: number;
  passCount: number;
  failCount: number;
  blockedCount: number;
  nextEventCount: number;
  remainingCount: number;
  highRemainingCount: number;
}) {
  return [
    `전체 QA 대상 ${totalTc}건 중 Pass ${passCount}건, Fail ${failCount}건입니다.`,
    `Blocked ${blockedCount}건, NextEvent ${nextEventCount}건이 남아 있습니다.`,
    `Jira Remaining ${remainingCount}건 중 High Risk 잔여는 ${highRemainingCount}건입니다.`,
    "피쳐별 QA 현황과 RC 진행 이슈 현황을 기준으로 릴리즈 흐름을 확인해주세요.",
  ];
}

function getQaSummaryMetrics(body: CreateOverallResultSheetRequest) {
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

  return {
    totalTc,
    passCount,
    failCount,
    blockedCount,
    nextEventCount,
    remainingCount,
    highRemainingCount,
  };
}

function createOverallReleaseQaSummaryLines(body: CreateOverallResultSheetRequest) {
  const metrics = getQaSummaryMetrics(body);

  return createReleaseQaSummaryLines(body, createQaSummaryLinesUtf8(metrics));
}

function getSummaryDisplayRowCount(summaryLines: string[]) {
  return Math.min(
    Math.max(summaryLines.length, SUMMARY_MIN_ROWS),
    SUMMARY_MAX_ROWS
  );
}

function estimateSummaryRowHeight(line: string) {
  if (!line.trim()) {
    return 10;
  }

  const paragraphs = line
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return 34;
  }

  const visualLineCount = paragraphs.reduce((sum, paragraph) => {
    const explicitLineCount = paragraph.split("\n").length;
    const wrappedLineCount = Math.ceil(paragraph.length / 132);

    return sum + Math.max(explicitLineCount, wrappedLineCount, 1);
  }, 0);
  const paragraphGapHeight = Math.max(paragraphs.length - 1, 0) * 10;
  const estimatedHeight = 18 + visualLineCount * 18 + paragraphGapHeight;

  return Math.min(Math.max(36, estimatedHeight), 120);
}

function createSummaryRowHeights(summaryLines: string[], rowCount: number) {
  return Array.from({ length: rowCount }, (_, index) =>
    estimateSummaryRowHeight(summaryLines[index] ?? "")
  );
}

function normalizeAiAnalysisTextForSheet(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

function createAiAnalysisDisplayRows(value: string) {
  const paragraphs = normalizeAiAnalysisTextForSheet(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    return paragraphs;
  }

  return paragraphs.flatMap((paragraph, index) =>
    index === paragraphs.length - 1 ? [paragraph] : [paragraph, ""]
  );
}

function createReleaseQaSummaryLines(
  body: CreateOverallResultSheetRequest,
  fallbackLines: string[]
) {
  const aiSummaryRows = body.aiAnalysisText
    ? createAiAnalysisDisplayRows(body.aiAnalysisText)
    : [];

  if (aiSummaryRows.length > 0) {
    return aiSummaryRows.slice(0, SUMMARY_MAX_ROWS);
  }

  const previewLines =
    body.reportPreviewLines?.map(normalizeCommentText).filter(Boolean) ?? [];

  if (previewLines.length > 0) {
    return previewLines.slice(0, 8);
  }

  return fallbackLines;
}

function priorityRank(priority: string) {
  const order: Record<string, number> = {
    Highest: 0,
    High: 1,
    Medium: 2,
    Low: 3,
    Lowest: 4,
  };

  return order[priority] ?? 99;
}

function sortRemainingIssues(issues: RemainingIssue[]) {
  return [...issues].sort(
    (first, second) =>
      priorityRank(first.priority) - priorityRank(second.priority) ||
      first.key.localeCompare(second.key)
  );
}

function isHighPriorityRemainingIssue(issue: RemainingIssue) {
  return issue.priority === "Highest" || issue.priority === "High";
}

function createAdditionalRemainingIssueSummary(issues: RemainingIssue[]) {
  const mediumRemainingCount = issues.filter(
    (issue) => issue.priority === "Medium"
  ).length;
  const lowRemainingCount = issues.filter(
    (issue) => issue.priority === "Low" || issue.priority === "Lowest"
  ).length;
  const totalAdditionalRemaining = mediumRemainingCount + lowRemainingCount;

  if (totalAdditionalRemaining === 0) return "";

  return `* 잔여 이슈 ${totalAdditionalRemaining}건 추가 존재 (Medium ${mediumRemainingCount}건 / Low ${lowRemainingCount}건)`;
}

function isJiraSheetTitle(title: string) {
  return /jira|지라/i.test(title);
}

function createFeatureRows(body: CreateOverallResultSheetRequest) {
  const sourceSheets =
    body.overallTestSheets && body.overallTestSheets.length > 0
      ? body.overallTestSheets
      : body.testSheets?.map((sheet) => ({
          title: sheet.title,
          rows: sheet.rows,
          summary: {
            Total: sheet.rows,
            Pass: getSummaryCount(sheet.summary, "Pass"),
            Fail: getSummaryCount(sheet.summary, "Fail"),
            Blocked: getSummaryCount(sheet.summary, "Blocked"),
            NextEvent: getSummaryCount(sheet.summary, "NextEvent"),
            "N/A": getSummaryCount(sheet.summary, "N/A"),
          },
        })) ?? [];

  return sourceSheets
    .filter((sheet) => !isJiraSheetTitle(sheet.title))
    .map((sheet) => {
      const pass = sheet.summary.Pass ?? 0;
      const fail = sheet.summary.Fail ?? 0;
      const blocked = sheet.summary.Blocked ?? 0;
      const nextEvent = sheet.summary.NextEvent ?? 0;
      const coverageBase = pass + fail + blocked + nextEvent;
      const coverage =
        coverageBase > 0 ? `${Math.round((pass / coverageBase) * 100)}%` : "0%";

      return [sheet.title, pass, fail, blocked, nextEvent, coverage];
    });
}

function createRcRows(body: CreateOverallResultSheetRequest) {
  const items = body.rcProgress?.items ?? [];

  return items.slice(-8).map((item) => {
    const highRisk =
      getPrioritySummaryValue(item.prioritySummary, "Highest") +
      getPrioritySummaryValue(item.prioritySummary, "High");
    const medium = getPrioritySummaryValue(item.prioritySummary, "Medium");
    const low =
      getPrioritySummaryValue(item.prioritySummary, "Low") +
      getPrioritySummaryValue(item.prioritySummary, "Lowest");

    return [item.rc, highRisk, medium, low, highRisk + medium + low];
  });
}

function createVersionRows(body: CreateOverallResultSheetRequest) {
  const sourceItems =
    body.versionSummary && body.versionSummary.length > 0
      ? body.versionSummary
      : body.versionIssueSummary ?? [];

  return sourceItems.slice(-VERSION_BODY_CAPACITY).map((item) => [
    item.version,
    item.total,
  ]);
}

function normalizeCommentText(value: string) {
  return value
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createCommentCategory(comment: string) {
  const normalized = comment.toLowerCase();

  if (
    /다음|차기|수정|fix|update|업데이트|next/.test(normalized)
  ) {
    return "차기 수정 예정";
  }

  if (
    /정책|운영|협의|기획|policy|decision|agree/.test(normalized)
  ) {
    return "운영 정책 협의";
  }

  if (
    /배포|릴리즈|모니터링|확인|release|monitor/.test(normalized)
  ) {
    return "배포 후 확인";
  }

  return "기타 후속 조치";
}

function createCommentRows(body: CreateOverallResultSheetRequest) {
  const followUps =
    body.qaFollowUps
      ?.map(normalizeCommentText)
      .filter(Boolean) ?? [];

  if (followUps.length > 0) {
    const groupedFollowUps = followUps.reduce<Record<string, string[]>>(
      (groups, followUp) => {
        const category = createCommentCategory(followUp);
        groups[category] = [...(groups[category] ?? []), followUp];
        return groups;
      },
      {}
    );
    const categories = [
      "차기 수정 예정",
      "운영 정책 협의",
      "배포 후 확인",
      "기타 후속 조치",
    ];
    const rows: Array<Array<string | number>> = [];

    categories.forEach((category) => {
      const items = groupedFollowUps[category];

      if (!items || items.length === 0) return;

      rows.push([`[ ${category} ]`]);
      items.forEach((item) => rows.push([`- ${item}`]));
    });

    return rows;
  }

  if (body.aiAnalysisText?.trim()) {
    return body.aiAnalysisText
      .trim()
      .split(/\r?\n/)
      .map(normalizeCommentText)
      .filter(Boolean)
      .slice(0, 6)
      .map((line) => [`- ${line.trim()}`]);
  }

  return [["- 특이사항 없습니다."]];
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

function createRowDeleteRequest(
  sheetId: number,
  startIndex: number,
  rowCount: number
) {
  return {
    deleteDimension: {
      range: {
        sheetId,
        dimension: "ROWS",
        startIndex,
        endIndex: startIndex + rowCount,
      },
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
  startRowIndex: number,
  endRowIndex: number,
  pixelSize: number
) {
  return {
    updateDimensionProperties: {
      range: {
        sheetId,
        dimension: "ROWS",
        startIndex: startRowIndex,
        endIndex: endRowIndex,
      },
      properties: { pixelSize },
      fields: "pixelSize",
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
      source: gridRange(sheetId, sourceRowIndex, sourceRowIndex + 1),
      destination: gridRange(
        sheetId,
        destinationStartRowIndex,
        destinationEndRowIndex
      ),
      pasteType: "PASTE_FORMAT",
      pasteOrientation: "NORMAL",
    },
  };
}

function createCommentFormatRequest(
  sheetId: number,
  rowIndex: number,
  isCategoryRow: boolean
) {
  return {
    repeatCell: {
      range: gridRange(sheetId, rowIndex, rowIndex + 1),
      cell: {
        userEnteredFormat: {
          backgroundColor: isCategoryRow ? COLOR.panel2 : COLOR.panel,
          horizontalAlignment: "LEFT",
          verticalAlignment: "MIDDLE",
          wrapStrategy: "WRAP",
          textFormat: {
            bold: isCategoryRow,
            fontSize: 11,
            fontFamily: "Arial",
            foregroundColor: isCategoryRow ? COLOR.white : COLOR.muted,
          },
        },
      },
      fields:
        "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)",
    },
  };
}

function createSummaryFormatRequest(
  sheetId: number,
  startRowIndex: number,
  endRowIndex: number
) {
  return {
    repeatCell: {
      range: gridRange(sheetId, startRowIndex, endRowIndex),
      cell: {
        userEnteredFormat: {
          horizontalAlignment: "LEFT",
          verticalAlignment: "TOP",
          wrapStrategy: "WRAP",
        },
      },
      fields:
        "userEnteredFormat(horizontalAlignment,verticalAlignment,wrapStrategy)",
    },
  };
}

function estimateCommentRowHeight(row: Array<string | number>) {
  const text = String(row[0] ?? "");
  const lineCount = Math.max(Math.ceil(text.length / 88), 1);

  return Math.min(Math.max(30, 18 + lineCount * 18), 96);
}

function createUnmergeRowRequest(sheetId: number, rowIndex: number) {
  return {
    unmergeCells: {
      range: gridRange(sheetId, rowIndex, rowIndex + 1),
    },
  };
}

function createUnmergeRangeRequest(
  sheetId: number,
  startRowIndex: number,
  endRowIndex: number
) {
  return {
    unmergeCells: {
      range: gridRange(sheetId, startRowIndex, endRowIndex),
    },
  };
}

function createChartSpec(
  sheetId: number,
  versionHeaderRowIndex: number,
  versionRowCount: number
) {
  const endRowIndex = versionHeaderRowIndex + Math.max(versionRowCount, 1) + 1;

  return {
    title: "Version Issue Trend",
    basicChart: {
      chartType: "LINE",
      legendPosition: "NO_LEGEND",
      headerCount: 1,
      axis: [
        { position: "BOTTOM_AXIS", title: "Version" },
        { position: "LEFT_AXIS", title: "Total Issue" },
      ],
      domains: [
        {
          domain: {
            sourceRange: {
              sources: [
                gridRange(sheetId, versionHeaderRowIndex, endRowIndex, 0, 1),
              ],
            },
          },
        },
      ],
      series: [
        {
          series: {
            sourceRange: {
              sources: [
                gridRange(sheetId, versionHeaderRowIndex, endRowIndex, 1, 2),
              ],
            },
          },
          targetAxis: "LEFT_AXIS",
          type: "LINE",
          lineStyle: { width: 3 },
          color: { red: 0.36, green: 0.62, blue: 0.96 },
        },
      ],
    },
  };
}

async function copyTemplateSheet(
  accessToken: string,
  destinationSpreadsheetId: string
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${TEMPLATE_SPREADSHEET_ID}/sheets/${TEMPLATE_QA_OVERALL_RESULT_SHEET_ID}:copyTo`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ destinationSpreadsheetId }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Overall template copyTo request failed: ${await readGoogleError(response)}`
    );
  }

  const copiedSheet = (await response.json()) as CopyToSheetResponse;

  if (typeof copiedSheet.sheetId !== "number") {
    throw new Error("Overall template copyTo response did not include sheetId.");
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
      `Copied overall sheet rename failed: ${await readGoogleError(response)}`
    );
  }
}

async function batchUpdateSheet(
  accessToken: string,
  spreadsheetId: string,
  requests: SheetsRequest[]
) {
  if (requests.length === 0) return;

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
    throw new Error(`Overall sheet batchUpdate failed: ${await readGoogleError(response)}`);
  }
}

async function updateValues(
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
    throw new Error(`Overall values update failed: ${await readGoogleError(response)}`);
  }
}

async function clearValues(
  accessToken: string,
  spreadsheetId: string,
  ranges: string[]
) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ranges }),
    }
  );

  if (!response.ok) {
    throw new Error(`Overall values clear failed: ${await readGoogleError(response)}`);
  }
}

async function fetchCopiedSheetCharts(
  accessToken: string,
  spreadsheetId: string,
  copiedSheetId: number
) {
  const fields = "sheets(properties(sheetId),charts(chartId,spec(title)))";
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=${encodeURIComponent(fields)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Copied sheet chart read failed: ${await readGoogleError(response)}`);
  }

  const data = (await response.json()) as {
    sheets?: Array<{
      properties?: { sheetId?: number };
      charts?: Array<{ chartId?: number; spec?: { title?: string } }>;
    }>;
  };
  const copiedSheet = data.sheets?.find(
    (sheet) => sheet.properties?.sheetId === copiedSheetId
  );

  return copiedSheet?.charts ?? [];
}

function createDynamicLayoutRequests({
  sheetId,
  summaryRows,
  summaryRowHeights,
  issueRows,
  featureRows,
  rcRows,
  commentRows,
  commentRowHeights,
  commentCategoryRows,
}: {
  sheetId: number;
  summaryRows: number;
  summaryRowHeights: number[];
  issueRows: number;
  featureRows: number;
  rcRows: number;
  commentRows: number;
  commentRowHeights: number[];
  commentCategoryRows: boolean[];
}) {
  const requests: SheetsRequest[] = [];
  const summaryDelta = summaryRows - SUMMARY_BODY_CAPACITY;
  const issueExtraRows = Math.max(issueRows - ISSUE_BODY_CAPACITY, 0);
  const featureExtraRows = Math.max(featureRows - FEATURE_BODY_CAPACITY, 0);
  const rcExtraRows = Math.max(rcRows - RC_BODY_CAPACITY, 0);
  const commentExtraRows = Math.max(commentRows - QA_COMMENT_BODY_CAPACITY, 0);
  const featureSourceRowIndex = FEATURE_START_ROW - 1 + summaryDelta;
  const rcSourceRowIndex = RC_START_ROW - 1 + summaryDelta;
  const versionSourceRowIndex = VERSION_START_ROW - 1 + summaryDelta;
  const commentSourceRowIndex = QA_COMMENT_TITLE_ROW + summaryDelta;

  requests.push(
    createUnmergeRangeRequest(
      sheetId,
      SUMMARY_START_ROW - 1,
      SUMMARY_START_ROW - 1 + SUMMARY_BODY_CAPACITY
    )
  );

  if (summaryDelta < 0) {
    requests.push(
      createRowDeleteRequest(
        sheetId,
        SUMMARY_START_ROW - 1 + summaryRows,
        Math.abs(summaryDelta)
      )
    );
  }

  requests.push(
    ...Array.from({ length: summaryRows }, (_, index) => {
      const rowIndex = SUMMARY_START_ROW - 1 + index;

      return [
        createUnmergeRowRequest(sheetId, rowIndex),
        createMergeRequest(sheetId, rowIndex),
      ];
    }).flat(),
    ...Array.from({ length: summaryRows }, (_, index) =>
      createRowHeightRequest(
        sheetId,
        SUMMARY_START_ROW - 1 + index,
        SUMMARY_START_ROW + index,
        summaryRowHeights[index] ?? 30
      )
    )
  );
  requests.push(
    createSummaryFormatRequest(
      sheetId,
      SUMMARY_START_ROW - 1,
      SUMMARY_START_ROW - 1 + summaryRows
    )
  );

  if (commentExtraRows > 0) {
    const insertIndex =
      QA_COMMENT_TITLE_ROW + summaryDelta + QA_COMMENT_BODY_CAPACITY;
    requests.push(
      createRowInsertRequest(
        sheetId,
        insertIndex,
        commentExtraRows
      ),
      createCopyPasteFormatRequest(
        sheetId,
        commentSourceRowIndex,
        insertIndex,
        insertIndex + commentExtraRows
      )
    );
  }

  if (rcExtraRows > 0) {
    const insertIndex =
      RC_START_ROW - 1 + summaryDelta + RC_BODY_CAPACITY;
    requests.push(
      createRowInsertRequest(
        sheetId,
        insertIndex,
        rcExtraRows
      ),
      createCopyPasteFormatRequest(
        sheetId,
        rcSourceRowIndex,
        insertIndex,
        insertIndex + rcExtraRows
      )
    );
  }

  if (featureExtraRows > 0) {
    const insertIndex =
      FEATURE_START_ROW - 1 + summaryDelta + FEATURE_BODY_CAPACITY;
    requests.push(
      createRowInsertRequest(
        sheetId,
        insertIndex,
        featureExtraRows
      ),
      createCopyPasteFormatRequest(
        sheetId,
        featureSourceRowIndex,
        insertIndex,
        insertIndex + featureExtraRows
      )
    );
  }

  if (issueExtraRows > 0) {
    const insertIndex =
      ISSUE_START_ROW - 1 + summaryDelta + ISSUE_BODY_CAPACITY;
    requests.push(createRowInsertRequest(sheetId, insertIndex, issueExtraRows));
    for (let index = 0; index < issueExtraRows; index += 1) {
      const rowIndex = insertIndex + index;
      requests.push(
        createUnmergeRowRequest(sheetId, rowIndex),
        createMergeRequest(sheetId, rowIndex, 2, 9),
        createMergeRequest(sheetId, rowIndex, 9, 12)
      );
    }
  }

  const featureStartRowIndex = featureSourceRowIndex + issueExtraRows;
  requests.push(
    createCopyPasteFormatRequest(
      sheetId,
      featureStartRowIndex,
      featureStartRowIndex,
      featureStartRowIndex + Math.max(featureRows, FEATURE_BODY_CAPACITY)
    ),
    createRowHeightRequest(
      sheetId,
      featureStartRowIndex,
      featureStartRowIndex + Math.max(featureRows, FEATURE_BODY_CAPACITY),
      36
    )
  );

  const rcStartRowIndex = rcSourceRowIndex + issueExtraRows + featureExtraRows;
  requests.push(
    createCopyPasteFormatRequest(
      sheetId,
      rcStartRowIndex,
      rcStartRowIndex,
      rcStartRowIndex + Math.max(rcRows, RC_BODY_CAPACITY)
    ),
    createRowHeightRequest(
      sheetId,
      rcStartRowIndex,
      rcStartRowIndex + Math.max(rcRows, RC_BODY_CAPACITY),
      34
    )
  );

  const versionStartRowIndex =
    versionSourceRowIndex + issueExtraRows + featureExtraRows + rcExtraRows;
  requests.push(
    createCopyPasteFormatRequest(
      sheetId,
      versionStartRowIndex,
      versionStartRowIndex,
      versionStartRowIndex + VERSION_BODY_CAPACITY
    ),
    createRowHeightRequest(
      sheetId,
      versionStartRowIndex,
      versionStartRowIndex + VERSION_BODY_CAPACITY,
      28
    )
  );

  const commentStartRowIndex =
    commentSourceRowIndex + issueExtraRows + featureExtraRows + rcExtraRows;
  for (let index = 0; index < Math.max(commentRows, QA_COMMENT_BODY_CAPACITY); index += 1) {
    const rowIndex = commentStartRowIndex + index;
    requests.push(createUnmergeRowRequest(sheetId, rowIndex));
    requests.push(createMergeRequest(sheetId, rowIndex));
    requests.push(createCommentFormatRequest(sheetId, rowIndex, Boolean(commentCategoryRows[index])));
  }
  requests.push(
    ...Array.from(
      { length: Math.max(commentRows, QA_COMMENT_BODY_CAPACITY) },
      (_, index) =>
        createRowHeightRequest(
          sheetId,
          commentStartRowIndex + index,
          commentStartRowIndex + index + 1,
          commentRowHeights[index] ?? 34
        )
    )
  );

  return {
    requests,
    summaryDelta,
    issueExtraRows,
    featureExtraRows,
    rcExtraRows,
  };
}

function createOverallValueUpdates({
  sheetName,
  body,
  qaSummaryLines,
  summaryRows,
  summaryDelta,
  additionalRemainingIssueSummary,
  issueRows,
  featureRows,
  rcRows,
  versionRows,
  commentRows,
  issueExtraRows,
  featureExtraRows,
  rcExtraRows,
}: {
  sheetName: string;
  body: CreateOverallResultSheetRequest;
  qaSummaryLines: string[];
  summaryRows: number;
  summaryDelta: number;
  additionalRemainingIssueSummary: string;
  issueRows: Array<Array<string | number>>;
  featureRows: Array<Array<string | number>>;
  rcRows: Array<Array<string | number>>;
  versionRows: Array<Array<string | number>>;
  commentRows: Array<Array<string | number>>;
  issueExtraRows: number;
  featureExtraRows: number;
  rcExtraRows: number;
}) {
  const {
    totalTc,
    passCount,
    failCount,
    blockedCount,
    nextEventCount,
    remainingCount,
    highRemainingCount,
  } = getQaSummaryMetrics(body);
  const issueOverview = body.qaIssueOverview ?? createFallbackQaIssueOverview(body);
  const state = createSystemState({
    highRemainingCount,
    blockedCount,
    remainingCount,
    nextEventCount,
  });
  const quotedSheetName = quoteSheetName(sheetName);
  const shiftedRow = (row: number) => row + summaryDelta;
  const issueStartRow = shiftedRow(ISSUE_START_ROW);
  const featureStartRow = shiftedRow(FEATURE_START_ROW) + issueExtraRows;
  const rcStartRow = shiftedRow(RC_START_ROW) + issueExtraRows + featureExtraRows;
  const versionStartRow =
    shiftedRow(VERSION_START_ROW) +
    issueExtraRows +
    featureExtraRows +
    rcExtraRows;
  const commentTitleRow =
    shiftedRow(QA_COMMENT_TITLE_ROW) +
    issueExtraRows +
    featureExtraRows +
    rcExtraRows;
  const judgmentReasonLines = createJudgmentReasonLines({
    state,
    highRemainingCount,
    failCount,
    blockedCount,
    remainingCount,
    nextEventCount,
  });
  const issuePriorityValues = (section: QaIssueOverviewSection) => [
    section.prioritySummary.Highest,
    section.prioritySummary.High,
    section.prioritySummary.Medium,
    section.prioritySummary.Low,
  ];
  const issueValues =
    issueRows.length > 0
      ? issueRows
      : [["", "", "High / Highest 우선 확인 필요 이슈가 없습니다.", ""]];
  const filledIssueValues = Array.from(
    { length: Math.max(issueValues.length, ISSUE_BODY_CAPACITY) },
    (_, index) => issueValues[index] ?? ["", "", "", ""]
  );
  const issueFooterRow = issueStartRow + filledIssueValues.length;
  const filledVersionRows = Array.from(
    { length: VERSION_BODY_CAPACITY },
    (_, index) => versionRows[index] ?? ["", ""]
  );

  return {
    featureStartRow,
    rcStartRow,
    versionStartRow,
    commentTitleRow,
    clearRanges: [
      `${quotedSheetName}!A7:A10`,
      `${quotedSheetName}!A${SUMMARY_START_ROW}:A${
        SUMMARY_START_ROW + summaryRows - 1
      }`,
      `${quotedSheetName}!A${shiftedRow(23)}:K${shiftedRow(23)}`,
      `${quotedSheetName}!A${shiftedRow(31)}:L${shiftedRow(32)}`,
      `${quotedSheetName}!A${issueStartRow}:J${
        issueStartRow + filledIssueValues.length - 1
      }`,
      `${quotedSheetName}!A${issueFooterRow}:L${issueFooterRow}`,
      `${quotedSheetName}!A${featureStartRow}:F${
        featureStartRow + Math.max(featureRows.length, 1) - 1
      }`,
      `${quotedSheetName}!A${rcStartRow}:E${
        rcStartRow + Math.max(rcRows.length, 1) - 1
      }`,
      `${quotedSheetName}!A${versionStartRow}:B${
        versionStartRow + VERSION_BODY_CAPACITY - 1
      }`,
      `${quotedSheetName}!A${commentTitleRow + 1}:A${
        commentTitleRow +
        Math.max(commentRows.length, QA_COMMENT_CLEANUP_ROWS)
      }`,
    ],
    updates: [
      { range: `${quotedSheetName}!A1`, values: [[state]] },
      { range: `${quotedSheetName}!E1`, values: [["QA 릴리즈 대시보드"]] },
      {
        range: `${quotedSheetName}!E2`,
        values: [[createHeroReportTitle(body)]],
      },
      {
        range: `${quotedSheetName}!E3`,
        values: [[createHeroMetaLabel(body)]],
      },
      {
        range: `${quotedSheetName}!E4`,
        values: [[`최종 업데이트 ${formatDisplayTimestamp()} | QA 담당자 TBD`]],
      },
      {
        range: `${quotedSheetName}!E5`,
        values: [
          [
            [
              `시스템 분석 결과: ${state}`,
              `High 우선순위 잔여 ${highRemainingCount}건`,
              `Blocked ${blockedCount}건 / NextEvent ${nextEventCount}건`,
              remainingCount > 0
                ? "릴리즈 QA 리스크 관리 필요"
                : "릴리즈 QA 리스크 안정권",
            ].join("\n"),
          ],
        ],
      },
      {
        range: `${quotedSheetName}!A7:A10`,
        values: judgmentReasonLines.map((line) => [`- ${line}`]),
      },
      {
        range: `${quotedSheetName}!A${SUMMARY_START_ROW}:A${
          SUMMARY_START_ROW + summaryRows - 1
        }`,
        values: Array.from({ length: summaryRows }, (_, index) => [
          qaSummaryLines[index] ?? "",
        ]),
      },
      {
        range: `${quotedSheetName}!A${shiftedRow(23)}`,
        values: [[`전체 TC\n${totalTc}`]],
      },
      {
        range: `${quotedSheetName}!C${shiftedRow(23)}`,
        values: [[`Pass\n${passCount}`]],
      },
      {
        range: `${quotedSheetName}!E${shiftedRow(23)}`,
        values: [[`Fail\n${failCount}`]],
      },
      {
        range: `${quotedSheetName}!G${shiftedRow(23)}`,
        values: [[`Blocked\n${blockedCount}`]],
      },
      {
        range: `${quotedSheetName}!I${shiftedRow(23)}`,
        values: [[`Remaining\n${remainingCount}`]],
      },
      {
        range: `${quotedSheetName}!K${shiftedRow(23)}`,
        values: [[`High Risk\n${highRemainingCount}`]],
      },
      {
        range: `${quotedSheetName}!A${shiftedRow(31)}:D${shiftedRow(31)}`,
        values: [issuePriorityValues(issueOverview.created)],
      },
      {
        range: `${quotedSheetName}!E${shiftedRow(31)}:H${shiftedRow(31)}`,
        values: [issuePriorityValues(issueOverview.resolved)],
      },
      {
        range: `${quotedSheetName}!I${shiftedRow(31)}:L${shiftedRow(31)}`,
        values: [issuePriorityValues(issueOverview.remaining)],
      },
      {
        range: `${quotedSheetName}!A${shiftedRow(32)}`,
        values: [[`대응 대상 이슈 ${issueOverview.created.total}건`]],
      },
      {
        range: `${quotedSheetName}!E${shiftedRow(32)}`,
        values: [[`수정 완료 이슈 ${issueOverview.resolved.total}건`]],
      },
      {
        range: `${quotedSheetName}!I${shiftedRow(32)}`,
        values: [[`현재 Remaining ${issueOverview.remaining.total}건`]],
      },
      {
        range: `${quotedSheetName}!A${issueStartRow}:A${
          issueStartRow + filledIssueValues.length - 1
        }`,
        values: filledIssueValues.map((row) => [row[0]]),
      },
      {
        range: `${quotedSheetName}!B${issueStartRow}:B${
          issueStartRow + filledIssueValues.length - 1
        }`,
        values: filledIssueValues.map((row) => [row[1]]),
      },
      {
        range: `${quotedSheetName}!C${issueStartRow}:C${
          issueStartRow + filledIssueValues.length - 1
        }`,
        values: filledIssueValues.map((row) => [row[2]]),
      },
      {
        range: `${quotedSheetName}!J${issueStartRow}:J${
          issueStartRow + filledIssueValues.length - 1
        }`,
        values: filledIssueValues.map((row) => [row[3]]),
      },
      {
        range: `${quotedSheetName}!A${issueFooterRow}`,
        values: [[additionalRemainingIssueSummary]],
      },
      {
        range: `${quotedSheetName}!A${featureStartRow}:F${
          featureStartRow + Math.max(featureRows.length, 1) - 1
        }`,
        values: featureRows.length > 0 ? featureRows : [["-", 0, 0, 0, 0, "0%"]],
      },
      {
        range: `${quotedSheetName}!A${rcStartRow}:E${
          rcStartRow + Math.max(rcRows.length, 1) - 1
        }`,
        values: rcRows.length > 0 ? rcRows : [["-", 0, 0, 0, 0]],
      },
      {
        range: `${quotedSheetName}!A${versionStartRow}:B${
          versionStartRow + VERSION_BODY_CAPACITY - 1
        }`,
        values: filledVersionRows,
      },
      {
        range: `${quotedSheetName}!A${commentTitleRow}`,
        values: [["QA Comment / 협의 사항"]],
      },
      {
        range: `${quotedSheetName}!A${commentTitleRow + 1}:A${
          commentTitleRow + commentRows.length
        }`,
        values: commentRows,
      },
    ] satisfies ValueUpdate[],
  };
}

async function updateCopiedChart({
  accessToken,
  spreadsheetId,
  copiedSheetId,
  versionHeaderRow,
  versionRowCount,
}: {
  accessToken: string;
  spreadsheetId: string;
  copiedSheetId: number;
  versionHeaderRow: number;
  versionRowCount: number;
}) {
  const charts = await fetchCopiedSheetCharts(
    accessToken,
    spreadsheetId,
    copiedSheetId
  );
  const chart = charts.find(
    (item) => item.spec?.title === "Version Issue Trend"
  );

  if (typeof chart?.chartId !== "number") {
    console.warn("Overall version chart was not found on copied sheet.");
    return;
  }

  const versionHeaderRowIndex = versionHeaderRow - 1;

  await batchUpdateSheet(accessToken, spreadsheetId, [
    {
      updateChartSpec: {
        chartId: chart.chartId,
        spec: createChartSpec(copiedSheetId, versionHeaderRowIndex, versionRowCount),
      },
    },
    {
      updateEmbeddedObjectPosition: {
        objectId: chart.chartId,
        newPosition: {
          overlayPosition: {
            anchorCell: {
              sheetId: copiedSheetId,
              rowIndex: versionHeaderRowIndex,
              columnIndex: 2,
            },
            offsetXPixels: 4,
            offsetYPixels: 0,
            widthPixels: 300,
            heightPixels: 160,
          },
        },
        fields: "*",
      },
    },
  ]);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOverallResultSheetRequest;
    const sourceSpreadsheetId = body.spreadsheetId?.trim();
    const resultSpreadsheetId = process.env.RESULT_SPREADSHEET_ID?.trim();
    const spreadsheetId = resultSpreadsheetId || sourceSpreadsheetId;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "RESULT_SPREADSHEET_ID or spreadsheetId is required." },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const sheetName = createSheetName(body.reportTitle ?? "");
    const copiedSheetId = await copyTemplateSheet(accessToken, spreadsheetId);
    const sortedRemainingIssues = sortRemainingIssues(body.remainingIssues ?? []);
    const highPriorityIssues = sortedRemainingIssues
      .filter(isHighPriorityRemainingIssue)
      .map((issue) => [issue.priority, issue.key, issue.summary, issue.status]);
    const additionalRemainingIssueSummary =
      createAdditionalRemainingIssueSummary(sortedRemainingIssues);
    const issueRows = Math.max(highPriorityIssues.length, 1);
    const featureRows = createFeatureRows(body);
    const rcRows = createRcRows(body);
    const versionRows = createVersionRows(body);
    const commentRows = createCommentRows(body);
    const qaSummaryLines = createOverallReleaseQaSummaryLines(body);
    const summaryRows = getSummaryDisplayRowCount(qaSummaryLines);
    const summaryRowHeights = createSummaryRowHeights(qaSummaryLines, summaryRows);
    const commentRowHeights = commentRows.map(estimateCommentRowHeight);
    const commentCategoryRows = commentRows.map((row) =>
      /^\[\s*.+\s*\]$/.test(String(row[0] ?? "").trim())
    );
    const dynamicLayout = createDynamicLayoutRequests({
      sheetId: copiedSheetId,
      summaryRows,
      summaryRowHeights,
      issueRows,
      featureRows: Math.max(featureRows.length, 1),
      rcRows: Math.max(rcRows.length, 1),
      commentRows: Math.max(commentRows.length, 1),
      commentRowHeights,
      commentCategoryRows,
    });
    const templateValues = createOverallValueUpdates({
      sheetName,
      body,
      qaSummaryLines,
      summaryRows,
      summaryDelta: dynamicLayout.summaryDelta,
      additionalRemainingIssueSummary,
      issueRows: highPriorityIssues,
      featureRows,
      rcRows,
      versionRows,
      commentRows,
      issueExtraRows: dynamicLayout.issueExtraRows,
      featureExtraRows: dynamicLayout.featureExtraRows,
      rcExtraRows: dynamicLayout.rcExtraRows,
    });

    await renameCopiedSheet(accessToken, spreadsheetId, copiedSheetId, sheetName);
    await batchUpdateSheet(accessToken, spreadsheetId, dynamicLayout.requests);
    await clearValues(accessToken, spreadsheetId, templateValues.clearRanges);
    await updateValues(accessToken, spreadsheetId, templateValues.updates);
    await updateCopiedChart({
      accessToken,
      spreadsheetId,
      copiedSheetId,
      versionHeaderRow: templateValues.versionStartRow - 1,
      versionRowCount: Math.max(versionRows.length, 1),
    });

    console.log("Create Overall Result Sheet completed:", {
      templateSpreadsheetId: TEMPLATE_SPREADSHEET_ID,
      templateSheetName: TEMPLATE_QA_OVERALL_RESULT_SHEET_NAME,
      templateSheetId: TEMPLATE_QA_OVERALL_RESULT_SHEET_ID,
      sourceSpreadsheetId,
      resultSpreadsheetId: spreadsheetId,
      copiedSheetId,
      sheetName,
      highPriorityIssueRows: highPriorityIssues.length,
      featureRows: featureRows.length,
      rcRows: rcRows.length,
      versionRows: versionRows.length,
      commentTitleRow: templateValues.commentTitleRow,
    });

    return NextResponse.json({
      sheetName,
      sheetId: copiedSheetId,
      spreadsheetId,
      sheetUrl: createSheetUrl(spreadsheetId, copiedSheetId),
    });
  } catch (error) {
    console.error("Create overall result sheet route error:", error);

    return NextResponse.json(
      {
        error: "Create overall result sheet route failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
