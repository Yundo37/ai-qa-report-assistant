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
  resolvedIssues: number;
  remainingIssues: number;
  reopenedIssues: number;
  prioritySummary: RcPrioritySummary;
};

type RcProgressSummary = {
  rcLabel: string;
  newIssues: number;
  fixedIssues: number;
  resolvedIssues: number;
  remainingIssues: number;
  reopenedIssues: number;
  items: RcProgressItem[];
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

type IssuePatternSource = {
  key: string;
  summary: string;
  priority: string;
  status: string;
  version?: string;
};

type IssuePatternAnalysisItem = {
  name: string;
  keywords: string[];
  count: number;
  versions: string[];
  sourceTypes: string[];
};

type QaAnalysisContext = {
  testSheetTitles?: string[];
  scopeKeywords?: string[];
  failPatterns?: string[];
  blockedPatterns?: string[];
};

type AiAnalysisRequest = {
  reportType?: "FEATURE" | "OVERALL";
  reportTitle?: string;
  qaSummary?: CountSummary;
  jiraFilteredSummary?: CountSummary;
  jiraStatusSummary?: CountSummary;
  jiraPrioritySummary?: CountSummary;
  testSheets?: TestSheetSummary[];
  overallQaSummary?: OverallQaSummary;
  overallTestSheets?: OverallTestSheetSummary[];
  versionSummary?: VersionIssueSummaryItem[];
  versionIssueSummary?: VersionIssueSummaryItem[];
  issuePatternSources?: IssuePatternSource[];
  issuePatternAnalysis?: IssuePatternAnalysisItem[];
  rcProgress?: RcProgressSummary;
  qaIssueOverview?: QaIssueOverviewSummary;
  remainingIssues?: RemainingIssue[];
  qaFollowUps?: string[];
  qaAnalysisContext?: QaAnalysisContext;
};

type AnalysisPayload = {
  reportType: "FEATURE" | "OVERALL";
  reportTitle: string;
  qaSummary: CountSummary;
  jiraFilteredSummary: CountSummary;
  jiraStatusSummary: CountSummary;
  jiraPrioritySummary: CountSummary;
  testSheets: TestSheetSummary[];
  overallQaSummary: OverallQaSummary | null;
  overallTestSheets: OverallTestSheetSummary[];
  versionSummary: VersionIssueSummaryItem[];
  versionIssueSummary: VersionIssueSummaryItem[];
  issuePatternSources: IssuePatternSource[];
  issuePatternAnalysis: IssuePatternAnalysisItem[];
  rcProgress: RcProgressSummary | null;
  qaIssueOverview: QaIssueOverviewSummary | null;
  remainingIssues: RemainingIssue[];
  qaFollowUps: string[];
  qaAnalysisContext: Required<QaAnalysisContext>;
};

type OverallAnalysisEvidence = {
  featureCount: number;
  totalTestCases: number;
  featureSheets: Array<{
    title: string;
    rows: number;
    fail: number;
    blocked: number;
    unresolvedQaCount: number;
  }>;
  rcComparisonAvailable: boolean;
  versionComparisonAvailable: boolean;
  highHighestRemainingCount: number;
  mediumLowRemainingCount: number;
  issuePatternAnalysis: IssuePatternAnalysisItem[];
  qaFollowUpCount: number;
};

type ResponseContent = {
  text?: string;
};

type ResponseOutput = {
  content?: ResponseContent[];
};

type ResponsesApiResult = {
  output_text?: string;
  output?: ResponseOutput[];
};

function extractResponseText(data: ResponsesApiResult) {
  if (data.output_text) {
    return data.output_text;
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

function createFeatureSystemPrompt() {
  return [
    "You are a Korean QA lead writing a Feature QA Result Report summary.",
    "Write in Korean, in a natural QA result-report style.",
    "Write paragraph-style text, not a bullet list.",
    "Use 2 to 3 short paragraphs.",
    "Analyze only feature-level data: the selected feature test results, feature Jira issues, feature remaining issues, feature QA comments, and Fail/Blocked tendencies.",
    "Do not use Overall-report analysis such as release-wide judgment, feature-to-feature comparison, version trends, RC trends, previous-version comparison, or cross-feature common patterns.",
    "Do not list Pass/Fail/Blocked counts, Jira issue keys, individual issue titles, or remaining issue lists.",
    "Summarize the implication of the feature QA data without restating lower report tables.",
    "Use only facts from the JSON payload. Never invent issue types, feature names, categories, ratios, or counts.",
    "Do not make release sign-off, service-open, or deployment approval claims.",
  ].join(" ");
}

function createOverallSystemPrompt() {
  return [
    "You are a Korean QA lead writing an Overall QA Result Report executive summary.",
    "Write in Korean, in a natural QA result-report style.",
    "You are an analyst, not a judge. Write observations first and only add restrained interpretation when the data supports it.",
    "Summarize implications, not raw data. Do not restate table values already shown in the report.",
    "Do not list Jira issue keys, individual remaining issue titles, or QA Comment details one by one.",
    "Do not list Pass, Fail, Blocked, RC, version, or priority table values, except the opening QA scope count.",
    "Keep the output within 3 to 4 short paragraphs and 6 to 8 sentences. Do not use bullets.",
    "Use issue-type patterns rather than feature/category names.",
    "For repeated pattern analysis, use issuePatternAnalysis first. It is precomputed from Jira summaries across all versions, remaining issues, and QA comments.",
    "Do not infer repeated patterns freely from feature names when issuePatternAnalysis is present.",
    "Never interpret an RC item's remainingIssues value as the total remaining issues for the whole release.",
    "Distinguish RC-local new/resolved/remain counts from the overall Remaining Issue state.",
    "Do not say there are no overall remaining issues unless jiraFilteredSummary.Remaining and qaIssueOverview.remaining.total are both zero.",
    "Do not use these QA Comment expressions in the body: QA Comment 기준, QA Comment를 통해, QA Comment 상, QA Comment 기반으로, 관련 QA Comment 기준.",
    "Mention QA Comment only in the final reference sentence.",
    "Do not use vague follow-up sentences such as 후속 검증이 예정되어 있습니다, 지속적인 모니터링과 검토가 요구됩니다, 품질 안정화를 위한 기반을 마련할 것으로 기대됩니다, 추가 점검이 필요함을 시사합니다.",
    "Avoid AI-like wording such as 요구됩니다, 시사합니다, 기대됩니다, 기반을 마련합니다, 종합해보면, 지속적인 모니터링과 검토, 품질 안정화.",
    "Prefer QA report wording such as 확인되었습니다, 남아 있습니다, 후속 확인이 필요합니다, 재확인이 필요합니다, 수정 예정으로 정리되어 있습니다, 정책 확정 이후 추가 검증이 필요합니다.",
    "Avoid direct risk-level judgments like 위험도가 높습니다 or 위험도가 가장 높은 기능입니다.",
    "Use increase/decrease only when comparable RC or version values are present and the numbers support it.",
    "Do not predict development plans or PM decisions. Mention future action only when qaFollowUps explicitly supports it.",
    "Use only facts present in the JSON payload. Never invent feature names, issue types, keywords, versions, RC labels, categories, ratios, or counts.",
    "Do not explain internal aggregation rules. Never say that a Jira sheet was excluded or that the feature count was calculated by excluding a sheet.",
    "Use overallAnalysisEvidence.featureCount and overallAnalysisEvidence.totalTestCases for the first QA scope sentence.",
    "Do not make release sign-off, service-open, or deployment approval claims.",
  ].join(" ");
}

function createFeaturePromptPayload(analysisPayload: AnalysisPayload) {
  return {
    reportType: analysisPayload.reportType,
    reportTitle: analysisPayload.reportTitle,
    qaSummary: analysisPayload.qaSummary,
    jiraFilteredSummary: analysisPayload.jiraFilteredSummary,
    jiraStatusSummary: analysisPayload.jiraStatusSummary,
    jiraPrioritySummary: analysisPayload.jiraPrioritySummary,
    testSheets: analysisPayload.testSheets,
    remainingIssues: analysisPayload.remainingIssues,
    qaFollowUps: analysisPayload.qaFollowUps,
    qaAnalysisContext: analysisPayload.qaAnalysisContext,
  };
}

function createFeatureParagraphUserPrompt(analysisPayload: AnalysisPayload) {
  return [
    "다음 데이터를 기반으로 Feature QA Result Report의 AI Analysis를 작성해주세요.",
    "",
    "출력 구조:",
    "1문단: 이번 기능 검증의 범위와 방향을 설명합니다.",
    "2문단: 해당 Feature 데이터에서 확인되는 주요 이슈 유형, Fail/Blocked 경향, 후속 확인 필요 항목을 요약합니다.",
    "3문단: 잔여 이슈 또는 협의 항목이 있으면 짧게 언급하고, 마지막 문장은 하단 참고 안내로 마무리합니다.",
    "",
    "출력 규칙:",
    "- 전체 2~3문단으로 작성",
    "- bullet list 사용 금지",
    "- Jira Key, 개별 이슈명, 상세 이슈 목록 나열 금지",
    "- Pass / Fail / Blocked / Priority 수치 재나열 금지",
    "- Version Trend, RC Summary, 이전 버전 비교, 전체 릴리즈 판단 금지",
    "- 여러 Feature 비교 또는 Overall 관점의 공통 경향 분석 금지",
    "- Feature 데이터에 있는 범위 안에서만 상태 반영, 노출 조건, 데이터 갱신, 예외 시나리오 같은 이슈 유형을 요약",
    "- 마지막 문장은 '자세한 결과와 협의 사항은 하단 QA Result 및 QA Comment 내용을 참고해주세요.'로 마무리",
    "",
    "문체 예시:",
    "이번 기능 검증에서는 주요 사용자 흐름과 예외 시나리오를 중심으로 테스트를 수행하였습니다.",
    "",
    "검증 과정에서 상태 반영, 노출 조건 처리, 데이터 갱신과 관련된 이슈가 확인되었으며, 일부 항목은 후속 확인이 필요한 상태입니다. 기능 전반은 검증 범위 내에서 동작을 확인하였으나, 잔여 이슈에 대해서는 추가 검증이 필요합니다.",
    "",
    "자세한 결과와 협의 사항은 하단 QA Result 및 QA Comment 내용을 참고해주세요.",
    "",
    JSON.stringify(createFeaturePromptPayload(analysisPayload), null, 2),
  ].join("\n");
}

function createOverallUserPrompt(analysisPayload: AnalysisPayload) {
  const overallAnalysisEvidence = createOverallAnalysisEvidence(analysisPayload);

  return [
    "Write an Overall QA Analysis in Korean based only on the JSON data below.",
    "",
    "Required order:",
    "1. QA scope",
    "2. RC flow, while separating RC-local counts from total Remaining Issue state",
    "3. Repeated issue-type patterns",
    "4. Feature result comparison without using risk-level judgment",
    "5. Overall remaining tendency and concrete follow-up only when supported",
    "6. Closing sentence",
    "",
    "Strict rules:",
    "- First sentence must use overallAnalysisEvidence.featureCount and overallAnalysisEvidence.totalTestCases.",
    "- Never say 'RC3 기준으로 남은 이슈는 없습니다', 'RC3에서는 RC 관련 잔여 이슈는 없습니다', or '최종 RC 기준 잔여 이슈가 모두 해소되었습니다'.",
    "- Never say 'RC3 has no remaining issues' or 'all remaining issues are resolved in the final RC' unless jiraFilteredSummary.Remaining and qaIssueOverview.remaining.total are both zero.",
    "- If an RC item has remainingIssues = 0, interpret it only as the state of issues associated with that RC item, not the whole release.",
    "- If RC3-local new issues are all handled, say 'RC3에서 신규 발생한 이슈는 모두 처리되었습니다' only as an RC-local statement.",
    "- If overallAnalysisEvidence.highHighestRemainingCount is greater than 0, mention that High 이상 잔여 이슈가 포함되어 있어 전체 릴리즈 기준 후속 확인이 필요합니다.",
    "- Do not use QA Comment as analysis evidence wording. Forbidden expressions: QA Comment 기준, QA Comment를 통해, QA Comment 상, QA Comment 기반으로, 관련 QA Comment 기준.",
    "- Mention QA Comment only in the final sentence.",
    "- Avoid vague follow-up wording: 후속 검증이 예정되어 있습니다, 지속적인 모니터링과 검토가 요구됩니다, 품질 안정화를 위한 기반을 마련할 것으로 기대됩니다, 추가 점검이 필요함을 시사합니다.",
    "- If qaFollowUps supports future action, use only concrete wording such as '일부 항목은 차기 업데이트 이후 재확인이 필요합니다', '일부 항목은 정책 확정 이후 추가 검증이 필요합니다', or '일부 항목은 차기 수정 예정으로 정리되어 있습니다'.",
    "- Avoid the words 위험도, 고위험, 리스크가 높습니다, 가장 위험, 품질 안정화, 품질 향상, 기대됩니다, 시사합니다, 요구됩니다.",
    "- Use wording like 'Fail 및 Blocked 비중이 상대적으로 높게 나타났습니다', '잔여 이슈가 확인되었습니다', '후속 확인이 필요합니다'.",
    "- Use increase/decrease only when two comparable RC or version values are present and the numbers support it.",
    "- Do not say previous-version increase/decrease unless versionSummary or versionIssueSummary contains comparable previous/current values.",
    "- Do not predict or expect development outcomes.",
    "- Repeated patterns must come from overallAnalysisEvidence.issuePatternAnalysis first. Do not create new pattern names if this list has usable items.",
    "- issuePatternAnalysis was computed in code from Jira summaries across all versions first, then remaining issues and QA comments.",
    "- Prefer issue-type patterns such as 상태 변경 지연, 상태 동기화, 데이터 반영 지연, 저장 후 리스트 갱신 지연, 노출 시점 불일치, 알림 중복 발송, 우선순위 정렬 불일치, but only when those patterns are present in issuePatternAnalysis.",
    "- Do not write feature-name-only patterns such as 이벤트 관련 이슈, 알림 관련 이슈, 운영툴 관련 이슈.",
    "- Do not list table values, Jira issue keys, individual issue titles, or QA Comment details.",
    "- Keep the output within 3 to 4 short paragraphs and 6 to 8 sentences.",
    "- Final sentence must be exactly: '자세한 내용은 하단 QA Result 및 QA Comment 내용을 참고해주세요.'",
    "",
    "Preferred wording examples:",
    "- 이번 QA는 총 6개 기능, 148개의 테스트 케이스를 대상으로 진행되었습니다.",
    "- RC3에서 신규 발생한 이슈는 모두 처리되었으나, 이전 RC에서 발생한 잔여 이슈가 남아 있어 전체 릴리즈 기준 후속 확인이 필요합니다.",
    "- 반복 이슈는 기능명보다 상태 변경 지연, 데이터 반영 지연, 리스트 갱신, 알림 처리와 같은 공통 처리 흐름에 집중되어 있습니다.",
    "- 일부 항목은 차기 업데이트 또는 정책 확정 이후 재확인이 필요합니다.",
    "",
    JSON.stringify(
      {
        overallAnalysisEvidence,
        ...analysisPayload,
      },
      null,
      2
    ),
  ].join("\n");
}

function isJiraSheetTitle(title: string) {
  const normalizedTitle = title.trim().toLowerCase();

  return normalizedTitle.includes("jira") || normalizedTitle.includes("지라");
}

function createOverallAnalysisEvidence(
  analysisPayload: AnalysisPayload
): OverallAnalysisEvidence {
  const overallSheets =
    analysisPayload.overallTestSheets.length > 0
      ? analysisPayload.overallTestSheets
      : analysisPayload.testSheets.map((sheet) => ({
          title: sheet.title,
          rows: sheet.rows,
          summary: {
            Total: sheet.summary.Total ?? sheet.rows,
            Pass: sheet.summary.Pass ?? 0,
            Fail: sheet.summary.Fail ?? 0,
            Blocked: sheet.summary.Blocked ?? 0,
            NextEvent: sheet.summary.NextEvent ?? 0,
            "N/A": sheet.summary["N/A"] ?? 0,
          },
        }));
  const featureSheets = overallSheets.filter(
    (sheet) => !isJiraSheetTitle(sheet.title)
  );
  const remainingPrioritySummary =
    analysisPayload.qaIssueOverview?.remaining.prioritySummary;
  const highHighestRemainingCount =
    (remainingPrioritySummary?.Highest ?? 0) + (remainingPrioritySummary?.High ?? 0);
  const mediumLowRemainingCount =
    (remainingPrioritySummary?.Medium ?? 0) +
    (remainingPrioritySummary?.Low ?? 0) +
    (remainingPrioritySummary?.Lowest ?? 0);

  return {
    featureCount: featureSheets.length,
    totalTestCases: featureSheets.reduce((sum, sheet) => sum + sheet.rows, 0),
    featureSheets: featureSheets.map((sheet) => ({
      title: sheet.title,
      rows: sheet.rows,
      fail: sheet.summary.Fail ?? 0,
      blocked: sheet.summary.Blocked ?? 0,
      unresolvedQaCount: (sheet.summary.Fail ?? 0) + (sheet.summary.Blocked ?? 0),
    })),
    rcComparisonAvailable: (analysisPayload.rcProgress?.items.length ?? 0) >= 2,
    versionComparisonAvailable:
      analysisPayload.versionSummary.length >= 2 ||
      analysisPayload.versionIssueSummary.length >= 2,
    highHighestRemainingCount,
    mediumLowRemainingCount,
    issuePatternAnalysis: analysisPayload.issuePatternAnalysis.slice(0, 5),
    qaFollowUpCount: analysisPayload.qaFollowUps.length,
  };
}

function normalizeRcProgress(rcProgress?: RcProgressSummary) {
  if (!rcProgress) return null;

  return {
    ...rcProgress,
    items: (rcProgress.items ?? []).slice(0, 12),
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as AiAnalysisRequest;
    const reportType = body.reportType ?? "FEATURE";
    const isOverallReport = reportType === "OVERALL";
    const analysisPayload: AnalysisPayload = {
      reportType,
      reportTitle: body.reportTitle ?? "",
      qaSummary: body.qaSummary ?? {},
      jiraFilteredSummary: body.jiraFilteredSummary ?? {},
      jiraStatusSummary: body.jiraStatusSummary ?? {},
      jiraPrioritySummary: body.jiraPrioritySummary ?? {},
      testSheets: (body.testSheets ?? []).map((sheet) => ({
        title: sheet.title,
        rows: sheet.rows,
        summary: sheet.summary,
      })),
      overallQaSummary: body.overallQaSummary ?? null,
      overallTestSheets: (body.overallTestSheets ?? []).map((sheet) => ({
        title: sheet.title,
        rows: sheet.rows,
        summary: sheet.summary,
      })),
      versionSummary: (body.versionSummary ?? []).slice(0, 12),
      versionIssueSummary: (body.versionIssueSummary ?? []).slice(0, 12),
      issuePatternSources: (body.issuePatternSources ?? [])
        .filter((source) => source.summary)
        .slice(0, 80)
        .map((source) => ({
          key: source.key,
          summary: source.summary,
          priority: source.priority,
          status: source.status,
          version: source.version,
        })),
      issuePatternAnalysis: (body.issuePatternAnalysis ?? [])
        .filter((pattern) => pattern.name && pattern.count > 0)
        .slice(0, 5)
        .map((pattern) => ({
          name: pattern.name,
          keywords: pattern.keywords.slice(0, 6),
          count: pattern.count,
          versions: pattern.versions.slice(0, 6),
          sourceTypes: pattern.sourceTypes.slice(0, 4),
        })),
      rcProgress: normalizeRcProgress(body.rcProgress),
      qaIssueOverview: body.qaIssueOverview ?? null,
      remainingIssues: (body.remainingIssues ?? [])
        .slice(0, isOverallReport ? 20 : 12)
        .map((issue) => ({
          priority: issue.priority,
          key: issue.key,
          summary: issue.summary,
          status: issue.status,
          version: issue.version,
        })),
      qaFollowUps: (body.qaFollowUps ?? []).slice(0, isOverallReport ? 12 : 8),
      qaAnalysisContext: {
        testSheetTitles: body.qaAnalysisContext?.testSheetTitles ?? [],
        scopeKeywords: body.qaAnalysisContext?.scopeKeywords ?? [],
        failPatterns: body.qaAnalysisContext?.failPatterns ?? [],
        blockedPatterns: body.qaAnalysisContext?.blockedPatterns ?? [],
      },
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: isOverallReport
              ? createOverallSystemPrompt()
              : createFeatureSystemPrompt(),
          },
          {
            role: "user",
            content: isOverallReport
              ? createOverallUserPrompt(analysisPayload)
              : createFeatureParagraphUserPrompt(analysisPayload),
          },
        ],
        max_output_tokens: isOverallReport ? 520 : 450,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      return NextResponse.json(
        {
          error: "OpenAI Responses API request failed.",
          status: response.status,
          details: errorBody,
        },
        { status: 502 }
      );
    }

    const data = (await response.json()) as ResponsesApiResult;
    const analysis = extractResponseText(data).trim();

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("AI analysis route error:", error);

    return NextResponse.json(
      {
        error: "AI analysis route failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
