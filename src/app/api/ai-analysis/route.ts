import { NextResponse } from "next/server";
import type {
  AiExecutiveSummaryResult,
  AiExecutiveSummaryTone,
} from "@/types/report";

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

type BlockedImpactTestCase = {
  tid: string;
  sheetTitle: string;
  category1: string;
  category2: string;
  category3: string;
  item: string;
  comment: string;
};

type BlockedImpactItem = {
  jiraKey: string;
  jiraSummary: string;
  displayLabel: string;
  priority: string;
  status: string;
  version?: string;
  blockedCaseCount: number;
  affectedSheets: string[];
  affectedCategories: string[];
  affectedTestCases: BlockedImpactTestCase[];
};

type BlockedImpactWarning = {
  jiraKey: string;
  jiraSummary: string;
  displayLabel: string;
  status: string;
  reason: string;
  blockedCaseCount: number;
};

type BlockedImpactSummary = {
  totalBlockedCases: number;
  blockedCauseIssueCount: number;
  topBlockedIssues: BlockedImpactItem[];
  warnings: BlockedImpactWarning[];
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
  blockedImpact?: BlockedImpactSummary;
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
  blockedImpact: BlockedImpactSummary | null;
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

type SeniorQaAnalysisEvidence = {
  releaseStatus: "안정" | "주의 필요" | "위험";
  totalTestCases: number;
  passRate: number;
  blockedRate: number;
  remainingSignal: {
    total: number;
    highHighest: number;
    medium: number;
    lowLowest: number;
  };
  blockedImpact: {
    totalBlockedCases: number;
    blockedCauseIssueCount: number;
    topBlockedIssues: BlockedImpactItem[];
    warnings: BlockedImpactWarning[];
  };
  rcSignal: {
    currentRc: string;
    items: Array<{
      rc: string;
      newIssues: number;
      resolvedIssues: number;
      remainingIssues: number;
      reopenedIssues: number;
    }>;
  };
  versionTrendSignal: {
    currentBaseVersion: string;
    currentTotalIssues: number;
    currentHighPlusIssues: number;
    previousVersionAverageIssues: number;
    previousHighPlusAverageIssues: number;
    trendDirection: "stable" | "increased" | "decreased" | "not_enough_data";
    sourceType: "base_version_trend";
  };
  patternSignal: Array<{
    name: string;
    count: number;
    sourceTypes: string[];
  }>;
  qaCommentSignal: {
    total: number;
    monitorCount: number;
    retestCount: number;
    policyCount: number;
    nextEventCount: number;
    blockedCount: number;
  };
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

type AiAnalysisParsedResponse = {
  analysis: string;
  executiveSummary?: AiExecutiveSummaryResult;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidExecutiveSummaryTone(
  value: unknown
): value is AiExecutiveSummaryTone {
  return (
    value === "stable" ||
    value === "attention" ||
    value === "risk" ||
    value === "neutral"
  );
}

function toOptionalStringOrNumber(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? value
    : undefined;
}

function validateAiExecutiveSummary(
  value: unknown
): AiExecutiveSummaryResult | undefined {
  if (!isRecord(value)) return undefined;

  const releaseJudgment = value.releaseJudgment;
  const riskSignals = value.riskSignals;
  const patternInsight = value.patternInsight;
  const qaCheckpoints = value.qaCheckpoints;

  if (!isRecord(releaseJudgment) || !isRecord(patternInsight)) {
    return undefined;
  }

  if (
    typeof releaseJudgment.title !== "string" ||
    typeof releaseJudgment.description !== "string" ||
    typeof patternInsight.title !== "string" ||
    typeof patternInsight.description !== "string" ||
    !Array.isArray(riskSignals) ||
    !Array.isArray(qaCheckpoints)
  ) {
    return undefined;
  }

  const normalizedRiskSignals = riskSignals.reduce<
    AiExecutiveSummaryResult["riskSignals"]
  >((signals, item) => {
      if (!isRecord(item)) return signals;
      const tone = isValidExecutiveSummaryTone(item.tone)
        ? item.tone
        : "neutral";

      if (
        typeof item.label !== "string" ||
        typeof item.description !== "string"
      ) {
        return signals;
      }

      signals.push({
        label: item.label,
        value: toOptionalStringOrNumber(item.value),
        description: item.description,
        tone,
      });

      return signals;
    }, [])
    .slice(0, 4);

  const rawPatternItems = Array.isArray(patternInsight.items)
    ? patternInsight.items
    : [];
  const normalizedPatternItems = rawPatternItems.reduce<
    NonNullable<AiExecutiveSummaryResult["patternInsight"]["items"]>
  >((items, item) => {
      if (!isRecord(item) || typeof item.label !== "string") return items;

      items.push({
        label: item.label,
        value: toOptionalStringOrNumber(item.value),
      });

      return items;
    }, [])
    .slice(0, 3);
  const normalizedCheckpoints = qaCheckpoints
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, 4);

  if (
    normalizedRiskSignals.length === 0 ||
    normalizedCheckpoints.length === 0
  ) {
    return undefined;
  }

  return {
    releaseJudgment: {
      title: releaseJudgment.title,
      description: releaseJudgment.description,
    },
    riskSignals: normalizedRiskSignals,
    patternInsight: {
      title: patternInsight.title,
      description: patternInsight.description,
      items: normalizedPatternItems,
    },
    qaCheckpoints: normalizedCheckpoints,
  };
}

function extractJsonObjectText(text: string) {
  const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();

  if (fencedJson) return fencedJson;

  const firstBraceIndex = text.indexOf("{");
  const lastBraceIndex = text.lastIndexOf("}");

  if (
    firstBraceIndex >= 0 &&
    lastBraceIndex > firstBraceIndex
  ) {
    return text.slice(firstBraceIndex, lastBraceIndex + 1);
  }

  return text;
}

function parseAiAnalysisResponse(text: string): AiAnalysisParsedResponse {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return { analysis: "" };
  }

  try {
    const parsed = JSON.parse(extractJsonObjectText(trimmedText)) as unknown;

    if (!isRecord(parsed) || typeof parsed.analysis !== "string") {
      return { analysis: trimmedText };
    }

    return {
      analysis: parsed.analysis.trim(),
      executiveSummary: validateAiExecutiveSummary(parsed.executiveSummary),
    };
  } catch {
    return { analysis: trimmedText };
  }
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
  const roleSeparationRules = [
    "[Shared factual rules]",
    "Use only facts present in the JSON payload. Never invent feature names, issue types, keywords, versions, RC labels, categories, ratios, or counts.",
    "Jira Key values must be copied exactly from evidence. Never rewrite, normalize, infer, or change a Jira Key prefix. DMS-004 must never become AQR-004.",
    "When mentioning a blocked cause Jira issue, copy blockedImpact.topBlockedIssues[].displayLabel exactly and never mention a Jira Key alone.",
    "Version Issue Trend is update-version comparison only. Never use RC1, RC2, RC3, final RC, or RC Progress wording when explaining Version Issue Trend.",
    "RC Progress is current-version RC flow only. Never use it to describe update-version issue trend.",
    "Distinguish RC-local new/resolved/remain counts from the overall 잔여 이슈 state.",
    "Next Event is not a standalone risk trigger.",
    "overallAnalysisEvidence.featureCount means selected QA sheet count or validation scope count, not feature count.",
    "The first analysis sentence must say 선택된 QA 시트 N개 and 총 N개 TC. Do not write N개 기능, 메인피쳐, 서브피쳐, or 테스트 케이스.",
    "High+ in Version Trend means all High / Highest issues for that update version, not High / Highest 잔여 이슈.",
    "[analysis rules]",
    "Rules in this section apply only to the analysis field.",
    "analysis is the detailed senior QA Lead paragraph analysis, not card copy.",
    "Rules for executiveSummary must not shorten, simplify, or override the analysis paragraph.",
    "Do not let executiveSummary brevity rules shorten or simplify the analysis field.",
    "The analysis field must remain a full 3 to 4 paragraph senior QA analysis.",
    "The executiveSummary field must be compact, but the analysis field must not be compact.",
    "Write analysis in Korean as 3 to 4 short paragraphs without bullets.",
    "analysis must be at least 3 paragraphs and should be 6 to 8 sentences. Never end analysis as a one-paragraph summary.",
    "analysis should synthesize TC, Jira, 잔여 이슈, Blocked Impact, RC Progress, Version Trend, and QA Comment flow.",
    "analysis must not copy executiveSummary card sentences verbatim.",
    "Do not apply executiveSummary length limits to analysis.",
    "If the response needs to shorten something, shorten executiveSummary descriptions first, not analysis.",
    "Stable analysis should be concise and monitoring-focused. Do not over-explain RC flow or repeat one blocked issue several times.",
    "Attention-needed analysis should emphasize Medium 잔여 이슈 재검증, 정책 조건 확인, Next Event 분리, and conditional blocked checks without risk exaggeration.",
    "Risk analysis should clearly explain High / Highest 잔여 이슈, Blocked Impact, and flow-level regression verification.",
    "[executiveSummary rules]",
    "Rules in this section apply only to executiveSummary.",
    "executiveSummary is short structured copy for card UI, not paragraph analysis.",
    "Rules for analysis must not force executiveSummary to become long.",
    "analysis and executiveSummary are generated from the same evidence, but they have different writing styles.",
    "executiveSummary must have releaseJudgment, riskSignals, patternInsight, and qaCheckpoints.",
    "releaseJudgment.description must be at most 2 short sentences.",
    "riskSignals must contain 3 to 4 interpreted signals. Each riskSignals[].description must be 1 short sentence.",
    "patternInsight.description must be at most 2 short sentences.",
    "qaCheckpoints must contain at most 4 short one-sentence items.",
    "Attention-needed executiveSummary must distinguish High / Highest 잔여 이슈 없음 from Medium 잔여 이슈 when medium is greater than 0.",
  ];
  const stableAnalysisToneRules = [
    "For stable releaseStatus, keep analysis concise and monitoring-focused. Prefer 3 short paragraphs: overall stable judgment, limited conditional check items, and monitoring/follow-up direction.",
    "For stable releaseStatus, do not over-explain RC1/RC2 flow unless it changes the release judgment.",
    "For stable releaseStatus, mention a blocked displayLabel such as DMS-004 at most once in analysis.",
    "For stable releaseStatus, avoid repeating similar phrases such as 조건부 재확인, 정책 확정, and 일부 항목 across multiple sentences.",
  ];

  return [
    "You are a senior Korean QA Lead preparing an Overall QA release analysis before a release review meeting.",
    "Write in Korean, in a natural QA result-report style.",
    "Do not summarize tables. Interpret release risk structure, blocked impact, repeated issue patterns, RC flow, version trend, and QA follow-up direction.",
    "Return only a valid JSON object. Do not wrap the JSON in markdown fences. Do not add explanations outside JSON.",
    "The JSON object must have an analysis string and an executiveSummary object.",
    "The analysis string is the full senior QA Lead paragraph analysis. Keep all existing paragraph-quality rules inside this field.",
    "The executiveSummary object is structured data for the four executive cards: releaseJudgment, riskSignals, patternInsight, and qaCheckpoints.",
    "Role separation: analysis is detailed 3 to 4 paragraph reasoning; executiveSummary is short card UI copy. Do not copy long analysis sentences into executiveSummary.",
    "All executiveSummary copy must be compact enough for cards: releaseJudgment.description up to 2 short sentences, riskSignals descriptions 1 short sentence, patternInsight.description up to 2 short sentences, qaCheckpoints short one-sentence items.",
    ...roleSeparationRules,
    ...stableAnalysisToneRules,
    "Avoid broken mixed-language output. Never use Chinese/Japanese-style words such as 影響, 잔여 상태影響, or incomplete mixed Korean-Hanja fragments. Use natural Korean QA report wording instead.",
    "You are an analyst, not a judge. Explain why the release status is stable, attention-needed, or risk only when the evidence supports it.",
    "Interpret relationships between TC, Jira, 잔여 이슈, Blocked, RC, Version, and QA comments instead of repeating visible numbers.",
    "In Korean output, use '잔여 이슈' instead of 'Remaining' or 'Remaining Issue'. Use 'High / Highest 잔여 이슈', 'Medium 잔여 이슈', 'Low / Lowest 잔여 이슈', '전체 잔여 이슈', and '잔여 상태'.",
    "When mentioning a blocked cause Jira issue, copy blockedImpact.topBlockedIssues[].displayLabel exactly. Never create, rewrite, normalize, or infer a Jira Key.",
    "Do not change a Jira Key prefix. For example, DMS-004 must never be rewritten as AQR-004.",
    "Never mention a Jira Key alone. Use the exact displayLabel value, such as DMS-004([알림] 운영툴 저장 이후 정책 refresh 지연).",
    "Version Issue Trend is update-version comparison only. Never use RC1, RC2, RC3, final RC, or RC Progress wording when explaining Version Issue Trend.",
    "RC Progress is current-version RC flow only. Never use it to describe update-version issue trend.",
    "Do not list Jira issue keys, individual 잔여 이슈 titles, affected TIDs, or QA Comment details one by one.",
    "Do not list Pass, Fail, Blocked, RC, version, or priority table values, except the opening QA scope count.",
    "Keep the analysis field within 3 to 4 paragraphs and 6 to 8 sentences. Do not use bullets.",
    "Use issue-type patterns rather than feature/category names.",
    "For repeated pattern analysis, use issuePatternAnalysis first. It is precomputed from Jira summaries across all versions, 잔여 이슈, and QA comments.",
    "Do not infer repeated patterns freely from feature names when issuePatternAnalysis is present.",
    "Never interpret an RC item's remainingIssues value as the total 잔여 이슈 for the whole release.",
    "Distinguish RC-local new/resolved/remain counts from the overall 잔여 이슈 state.",
    "Do not say there are no 전체 잔여 이슈 unless jiraFilteredSummary.Remaining and qaIssueOverview.remaining.total are both zero.",
    "Do not use these QA Comment expressions in the body: QA Comment 기준, QA Comment를 통해, QA Comment 상, QA Comment 기반으로, 관련 QA Comment 기준.",
    "Mention QA Comment only in the final reference sentence.",
    "Do not use vague follow-up sentences such as 후속 검증이 예정되어 있습니다, 지속적인 모니터링과 검토가 요구됩니다, 품질 안정화를 위한 기반을 마련할 것으로 기대됩니다, 추가 점검이 필요함을 시사합니다.",
    "Avoid AI-like wording such as 요구됩니다, 시사합니다, 기대됩니다, 기반을 마련합니다, 종합해보면, 지속적인 모니터링과 검토, 품질 안정화.",
    "Prefer QA report wording such as 확인되었습니다, 남아 있습니다, 후속 확인이 필요합니다, 재확인이 필요합니다, 수정 예정으로 정리되어 있습니다, 정책 확정 이후 추가 검증이 필요합니다.",
    "Avoid direct risk-level judgments like 위험도가 높습니다 or 위험도가 가장 높은 기능입니다.",
    "Use increase/decrease only when comparable RC or version values are present and the numbers support it.",
    "Do not predict development plans or PM decisions. Mention future action only when qaFollowUps explicitly supports it.",
    "Use only facts present in the JSON payload. Never invent feature names, issue types, keywords, versions, RC labels, categories, ratios, or counts.",
    "Repeated patterns must come from seniorQaAnalysisEvidence.patternSignal or issuePatternAnalysis. Do not invent new pattern names.",
    "Use blockedImpact.topBlockedIssues only when it has displayLabel and jiraSummary. Mention at most 2 or 3 blocked cause issues.",
    "Do not explain internal aggregation rules. Never say that a Jira sheet was excluded or that the feature count was calculated by excluding a sheet.",
    "Use seniorQaAnalysisEvidence and overallAnalysisEvidence as the main evidence. Use raw tables only as supporting data.",
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
  const seniorQaAnalysisEvidence =
    createSeniorQaAnalysisEvidence(analysisPayload);

  return [
    "Write a senior QA Lead Overall QA Analysis in Korean based only on the JSON data below.",
    "",
    "Required order:",
    "1. Release judgment and overall state.",
    "2. Main risk structure and Blocked Impact.",
    "3. Repeated patterns interpreted as feature-flow risk.",
    "4. RC / Version interpretation and QA confirmation priority.",
    "",
    "Role separation before writing JSON:",
    "- analysis is the detailed senior QA Lead paragraph analysis. Do not compress it using card length rules.",
    "- analysis must be a full 3 to 4 paragraph string with 6 to 8 sentences. It must not be a one-paragraph summary.",
    "- executiveSummary is short structured card copy. Do not copy the analysis paragraphs into it.",
    "- Rules for executiveSummary must not shorten, simplify, or override the analysis paragraph.",
    "- Rules for analysis must not force executiveSummary to become long.",
    "- analysis and executiveSummary must use the same evidence but different writing styles.",
    "- Do not let executiveSummary brevity rules shorten or simplify the analysis field.",
    "- If the response needs to shorten something, shorten executiveSummary descriptions first, not analysis.",
    "",
    "Analysis tone anchors:",
    "- Stable analysis: High / Medium 잔여 이슈 없음, Low / Lowest 잔여 이슈 일부, 낮은 Blocked 영향, Next Event 후속 일정, 운영 모니터링 중심. Do not use 위험, 차단, 배포 전 우선 확인.",
    "- Attention-needed analysis: High / Highest 잔여 이슈 없음, Medium 잔여 이슈 존재, Next Event 후속 일정 분리, Blocked는 제한된 조건부 확인 범위. It is 추가 확인 / 재검증, not 위험.",
    "- Attention-needed analysis should prefer Medium 원인 이슈별 재검증과 정책 조건 확인 over broad flow-level regression.",
    "- Risk analysis: High / Highest 잔여 이슈, Blocked Impact, AQR displayLabel, Version Trend / RC Progress separation, and 상태 변경 → CTA 노출 → 결과 상태 반영 → 알림 수신 흐름 단위 회귀 검증.",
    "",
    "Output JSON schema:",
    JSON.stringify(
      {
        analysis:
          "3~4 short Korean paragraphs. This is the existing full AI summary text.",
        executiveSummary: {
          releaseJudgment: {
            title: "운영 모니터링 중심 | 추가 확인 필요 | 추가 검증 필요",
            description:
              "One concise Korean sentence explaining the release judgment evidence.",
          },
          riskSignals: [
            {
              label:
                "High / Medium 잔여 이슈 없음 | Medium 잔여 이슈 | High / Highest 잔여 이슈 | Blocked Impact",
              value: 0,
              description:
                "Explain why this signal matters, not just the number.",
              tone: "stable | attention | risk | neutral",
            },
          ],
          patternInsight: {
            title: "Korean title for pattern meaning",
            description:
              "Interpret repeated patterns as QA meaning or flow-level regression scope.",
            items: [{ label: "Existing pattern name only", value: 0 }],
          },
          qaCheckpoints: [
            "Korean QA confirmation direction. Do not list Jira keys one by one.",
          ],
        },
      },
      null,
      2
    ),
    "",
    "Executive summary card rules:",
    "- Use exactly these top-level fields: analysis, executiveSummary.",
    "- executiveSummary.releaseJudgment.title must be one of these style labels when supported by evidence: 운영 모니터링 중심, 추가 확인 필요, 추가 검증 필요.",
    "- executiveSummary.riskSignals must contain 3 to 4 interpreted signals. Do not merely list counts.",
    "- Each riskSignals item must use label, value, description, and tone. tone must be stable, attention, risk, or neutral.",
    "- executiveSummary is card UI copy, not paragraph copy. Keep it much shorter than analysis and do not repeat analysis sentences verbatim.",
    "- releaseJudgment.description: maximum 2 short sentences, preferably around 80 Korean characters.",
    "- riskSignals[].description: exactly 1 short sentence, preferably around 50 Korean characters.",
    "- patternInsight.description: maximum 2 short sentences, preferably around 100 Korean characters.",
    "- qaCheckpoints: maximum 4 items; each item must be one short sentence, preferably around 60 Korean characters.",
    "- executiveSummary.patternInsight must explain what the repeated patterns mean for QA. Do not duplicate the lower Issue Pattern table.",
    "- Attention-needed executiveSummary must avoid 위험 징후, 중대 리스크, 배포 전 차단, 심각한 위험. Use 재검증과 정책 확인 신호, 운영형 재검증 신호, 조건부 확인 신호, or Medium 재검증 신호.",
    "- For attention-needed patternInsight.title, prefer 재검증과 정책 확인 신호 or 운영형 재검증 신호. Do not use 반복 패턴에 따른 흐름별 위험 징후.",
    "- executiveSummary.patternInsight.items may include up to 3 items and must use only existing issuePatternAnalysis or seniorQaAnalysisEvidence.patternSignal names.",
    "- executiveSummary.qaCheckpoints must contain 3 to 4 short QA confirmation directions.",
    "- If mentioning Blocked Impact in executiveSummary, copy blockedImpact.topBlockedIssues[].displayLabel exactly. Never write a Jira key alone.",
    "- Stable executiveSummary must avoid 위험 요인, 릴리즈 차단, 배포 전 우선 확인, 추가 검증 필요, 심각한 리스크.",
    "- Attention-needed executiveSummary must distinguish High / Highest 잔여 이슈 없음 from Medium 잔여 이슈. Do not write Medium 이상 잔여 이슈.",
    "- Risk executiveSummary should include High / Highest 잔여 이슈, Blocked Impact, Medium 잔여 이슈 when supported by evidence, and flow-level regression direction.",
    "",
    "Strict rules:",
    "- First sentence must use overallAnalysisEvidence.featureCount as selected QA sheet count and overallAnalysisEvidence.totalTestCases as TC count.",
    "- First sentence preferred wording: 이번 QA는 선택된 QA 시트 {featureCount}개와 총 {totalTestCases}개 TC를 기준으로 진행되었습니다.",
    "- Do not write 총 {featureCount}개 기능, 메인피쳐 4개와 서브피쳐 2개, 6개 기능, or 테스트 케이스 in the first sentence.",
    "- Korean terminology policy: write 잔여 이슈 instead of Remaining or Remaining Issue in the final output. Use High / Highest 잔여 이슈, Medium 잔여 이슈, Low / Lowest 잔여 이슈, 전체 잔여 이슈, and 잔여 상태.",
    "- You may keep these terms as-is: Blocked, Next Event, RC, High+, CTA, Jira, Low Known Issue. When using Low Known Issue, prefer 'Low Known Issue 중심' or 'Low Known Issue 성격의 잔여 이슈'.",
    "- Use seniorQaAnalysisEvidence.releaseStatus for tone, but do not simply repeat a dashboard status label.",
    "- Stable tone: 운영 모니터링 중심, High / Medium 잔여 이슈 없음, Low Known Issue 중심, 차기 이벤트 확인, 릴리즈 판단에 영향을 줄 수준은 낮음.",
    "- In stable tone, avoid these expressions: 위험 요인, 주요 위험, 차단하고 있습니다, 차단 신호, 릴리즈 차단 요소, 릴리즈 차단, 배포 전 우선 확인, 추가 검증 필요, 위험 신호, 차단 요소, Blocked 해소 전 판단 보류, 심각한 리스크.",
    "- In stable tone, use these expressions instead: 운영 모니터링 신호, 후속 확인 항목, 제한적 확인 항목, 조건부 재확인 항목, Low Known Issue, 차기 이벤트 확인 항목, 릴리즈 판단에 영향을 줄 수준은 낮음, 운영 모니터링 범위에 가까움.",
    "- In stable tone, when describing a Blocked displayLabel, say '일부 검증을 조건부 재확인 대상으로 남기고 있습니다' or '제한적으로 확인이 보류된 항목입니다'. Do not say it blocks QA 진행.",
    "- In stable tone, do not write '잔여 이슈 발생 및 일부 검증이 제한'. Use '해당 이슈와 연결된 일부 검증이 제한', '일부 조건 검증이 보류', or '일부 검증 범위를 조건부 재확인 대상으로 남김'.",
    "- Stable Version Trend wording: 현재 버전 2.0.0의 이슈 규모는 이전 업데이트 버전 대비 급증하지 않았고, High+ 신호도 낮게 유지되고 있습니다. Do not emphasize issue increase in stable tone.",
    "- In stable tone, do not confuse High+ with High / Highest 잔여 이슈. High+ means all High / Highest issues in the version trend, not remaining-only issues.",
    "- Attention-needed tone: 추가 확인 필요, Medium 잔여 이슈 중심, Next Event 분리 관리, 정책 확인 / 재검증 중심. Do not exaggerate as risk.",
    "- Attention-needed analysis must use natural Korean only. Do not write 影響, 잔여 상태影響, 깨진 한자 혼용 표현, 일본어/중국어식 한자 단어, or incomplete mixed sentences.",
    "- Attention-needed analysis may use: 일부 검증 범위가 조건부 확인 상태로 남아 있습니다, 전체 잔여 이슈 상태에 영향을 주고 있습니다, 일부 검증 범위가 제한적으로 보류되어 있습니다, Medium 재검증과 정책 조건 확인 범위로 분리해 관리합니다.",
    "- Attention-needed RC wording must separate RC-local state from overall 잔여 이슈. Prefer: RC2에서는 신규 잔여 이슈가 추가되지 않았지만, 전체 잔여 이슈는 이전 RC에서 발생한 Medium / Low 항목과 분리해 관리해야 합니다.",
    "- Attention-needed analysis must not write: RC1에서 잔여 이슈가 모두 RC2로 해소, 전체 잔여 이슈가 해소됨, RC2에서 잔여 이슈 없음. Only say 전체 잔여 이슈 없음 when jiraFilteredSummary.Remaining and qaIssueOverview.remaining.total are both zero.",
    "- In attention-needed tone, if highHighest is 0 and medium is greater than 0, write 'Medium 잔여 이슈' or 'Medium 재검증 신호'. Do not write 'Medium 이상 잔여 이슈'.",
    "- In attention-needed tone, never write 'High / Medium 잔여 이슈로 이어지지 않아' or 'High 또는 Medium 잔여 이슈로 이어지지 않아' when Medium is greater than 0. Write 'High / Highest 잔여 이슈로 이어지지는 않았지만, Medium 재검증 신호로 남아 있습니다'.",
    "- In attention-needed tone, avoid '각 이슈별 개별 확인'. Prefer 'Medium 원인 이슈별 재검증과 정책 조건 확인', 'Medium 잔여 이슈의 수정 반영 확인과 운영 정책 조건 재확인', or '운영툴 반영 지연과 알림 상태 반영 조건을 중심으로 한 재검증'.",
    "- Attention-needed Version Trend wording: 현재 버전 2.0.0에서는 전체 이슈 수가 이전 대비 증가했지만, High+ 신호는 낮게 유지되고 있습니다. 따라서 핵심은 치명 이슈 대응이 아니라 Medium 잔여 이슈 재검증과 후속 일정 분리 관리입니다.",
    "- In attention-needed tone, do not write High+ 이슈가 증가한 상태, High+ 증가로 위험 신호, or High+ 증가가 주요 리스크 unless the evidence clearly shows a large High+ increase.",
    "- Risk tone: 추가 검증 필요, High / Highest 잔여 이슈 우선 확인, Blocked 해소 후 회귀 검증, 배포 전 우선 확인이 필요한 회귀 범위 분리.",
    "- In risk tone, make regression direction specific. Prefer flow wording such as '상태 전환 → CTA 노출 → 결과 상태 반영 → 알림 수신' or '알림 생성 → 우선순위 정렬 → 읽음 상태 → 컴팩션 → 알림 설정 반영' only when supported by Blocked Impact or repeated patterns.",
    "- In risk tone, prefer Korean QA report terms such as 운영형 회귀 리스크, 배포 전 우선 확인이 필요한 회귀 범위, 흐름 단위 회귀 검증 범위. Avoid repeating 운영형 중대 리스크 too often.",
    "- Explain 잔여 이슈 priority meaning. Do not treat Low / Lowest 잔여 이슈 or Next Event alone as a current release risk.",
    "- Analyze Blocked Impact from seniorQaAnalysisEvidence.blockedImpact. Explain what validation scope is blocked and what flow should be retested.",
    "- When mentioning blocked cause Jira, copy blockedImpact.topBlockedIssues[].displayLabel exactly. Do not compose the label yourself.",
    "- Jira Key values in evidence are exact. Do not change prefixes or project keys. DMS-004 must remain DMS-004 and must not become AQR-004.",
    "- Never write only a Jira Key. Use displayLabel exactly, for example DMS-004([알림] 운영툴 저장 이후 정책 refresh 지연).",
    "- Mention at most 2 or 3 blocked cause Jira issues. Do not list affected TIDs.",
    "- QA대기 / QA확인 / 진행 / 열림 / 다시열림 / 수정보류 / 미해결 / Open / In Progress / QA Pending / QA Check / Reopened / Deferred are allowed 잔여 상태 for Blocked causes. Do not describe them as data consistency problems.",
    "- Mention Blocked status consistency only when blockedImpact.warnings is non-empty, and only for 완료 / 배포완료 / QA승인 / 버그아님 / 중복이슈 / 기획의도 / 기획변경 / Excluded / Done / Resolved / Closed / Duplicate / Won't Fix / Not a Bug states.",
    "- Blocked warning may be mentioned only with a specific warning displayLabel. If you cannot name the warning displayLabel, omit the warning from the body.",
    "- Do not write vague warning sentences such as '완료나 배포완료 상태인 관련 이슈가 일부 있습니다' or '상태 일관성은 점검할 필요가 있습니다' without naming the warning displayLabel.",
    "- Interpret repeated patterns as connected functional flow, for example 상태값 변경 → CTA 노출 → 결과 상태 → 알림 발송, only when supported by existing pattern names.",
    "- Stable tone repeated patterns: say patterns are 일부 확인되지만 High / Medium 잔여 이슈로 이어지지는 않았고 운영 모니터링과 차기 확인 범위로 분리한다고 write softly.",
    "- Attention-needed tone repeated patterns: say patterns are 운영형 이슈로 일부 확인되며 Medium 재검증과 정책 확인 범위로 관리한다고 write moderately.",
    "- Risk tone repeated patterns: only then say patterns connect to major risk structure and require flow-level regression.",
    "- Separate Version Issue Trend from RC Progress: Version Issue Trend compares update versions such as 1.0.0 / 1.1.0 / 1.1.1 / 2.0.0, while RC Progress tracks the current version's RC flow such as 2.0.0 rc1 / rc2 / rc3.",
    "- For Version Issue Trend, use seniorQaAnalysisEvidence.versionTrendSignal.currentBaseVersion only. Do not use currentRc or RC labels.",
    "- When explaining Version Issue Trend, never use RC1 / RC2 / RC3 / RC Progress / 최종 RC wording. Never write phrases like '2.0.0 RC3의 버전 이슈 추세', '2.0.0 RC3에서 버전 이슈 추세', 'RC3에서 총 이슈수가 감소', '최종 RC 기준 버전 추세', 'RC별 버전 이슈 추세', or 'RC3의 버전별 이슈'.",
    "- When explaining RC Progress, do not describe update-version trend. RC item remainingIssues is local to that RC item.",
    "- Never say 'RC3 기준으로 남은 이슈는 없습니다', 'RC3에서는 RC 관련 잔여 이슈는 없습니다', or '최종 RC 기준 잔여 이슈가 모두 해소되었습니다'.",
    "- Never say 'RC3 has no remaining issues' or 'all remaining issues are resolved in the final RC' unless jiraFilteredSummary.Remaining and qaIssueOverview.remaining.total are both zero.",
    "- If an RC item has remainingIssues = 0, interpret it only as the state of issues associated with that RC item, not the whole release.",
    "- If RC3-local new issues are resolved but 전체 잔여 이슈 is non-zero, say RC-local result and overall release state must be read separately.",
    "- If RC3-local new issues are all handled, say 'RC3에서 신규 발생한 이슈는 모두 처리되었습니다' only as an RC-local statement.",
    "- If seniorQaAnalysisEvidence.versionTrendSignal.trendDirection is increased, explain current-version issue volume increase without mixing it with High / Highest 잔여 이슈.",
    "- If versionTrendSignal.trendDirection is increased, never write 비교 데이터 부족, 데이터 한계, 명확한 증감 판단은 어려움, 비교할 데이터가 부족, or 이전 버전 비교가 제한적입니다.",
    "- In risk tone with versionTrendSignal.trendDirection increased, prefer: 현재 버전 2.0.0은 이전 업데이트 버전 대비 전체 이슈와 High+ 신호가 함께 증가했습니다.",
    "- In risk tone with increased Version Trend, explain that 운영툴 반영, 상태 동기화, 알림 우선순위 정책이 연결된 검증 표면이 넓어진 상태로 볼 수 있습니다 when supported by pattern or blocked evidence.",
    "- In risk tone, if versionTrendSignal.currentBaseVersion is 2.0.0, previousVersionAverageIssues is greater than 0, currentTotalIssues is greater than previousVersionAverageIssues, and currentHighPlusIssues is greater than previousHighPlusAverageIssues, write that 현재 버전 2.0.0은 이전 업데이트 버전 대비 전체 이슈와 High+ 신호가 함께 증가했습니다.",
    "- Do not write '비교할 데이터가 부족', '이전 업데이트 버전과 비교할 데이터가 부족하지만', or '이전 버전 비교가 제한적입니다' when versionTrendSignal.trendDirection is not not_enough_data.",
    "- If overallAnalysisEvidence.highHighestRemainingCount is greater than 0, mention that High / Highest 잔여 이슈가 포함되어 있어 전체 릴리즈 기준 후속 확인이 필요합니다.",
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
    "- issuePatternAnalysis was computed in code from Jira summaries across all versions first, then 잔여 이슈 and QA comments.",
    "- Prefer issue-type patterns such as 상태 변경 지연, 상태 동기화, 데이터 반영 지연, 저장 후 리스트 갱신 지연, 노출 시점 불일치, 알림 중복 발송, 우선순위 정렬 불일치, but only when those patterns are present in issuePatternAnalysis.",
    "- Do not write feature-name-only patterns such as 이벤트 관련 이슈, 알림 관련 이슈, 운영툴 관련 이슈.",
    "- Do not list table values, Jira issue keys, individual issue titles, or QA Comment details.",
    "- Keep the analysis field within 3 to 4 paragraphs and 6 to 8 sentences.",
    "- Final sentence must be exactly: '자세한 내용은 하단 QA Result 및 QA Comment 내용을 참고해주세요.'",
    "",
    "Preferred wording examples:",
    "- 이번 QA는 선택된 QA 시트 6개와 총 148개 TC를 기준으로 진행되었습니다.",
    "- 안정 케이스: 남은 항목은 릴리즈 판단에 영향을 줄 수준이 낮고, 운영 모니터링 및 차기 확인 항목으로 분리해 관리하는 것이 적절합니다.",
    "- 안정 케이스 Blocked: DMS-004([알림] 운영툴 저장 이후 정책 refresh 지연)는 일부 검증을 조건부 재확인 대상으로 남기고 있습니다.",
    "- 주의 필요 케이스: High / Highest 잔여 이슈로 이어지지는 않았지만, Medium 재검증 신호로 남아 있습니다.",
    "- 주의 필요 케이스 확인 방향: 단기적으로는 전체 흐름 단위의 광범위한 회귀보다 Medium 원인 이슈별 재검증과 정책 조건 확인을 우선하는 것이 적절합니다.",
    "- 위험 케이스: 수정 후에는 개별 TC 재수행보다 상태 전환 → CTA 노출 → 결과 상태 반영 → 알림 수신 흐름을 묶어서 회귀 검증해야 합니다.",
    "- 위험 케이스 Version Trend: 현재 버전 2.0.0은 이전 업데이트 버전 대비 전체 이슈와 High+ 신호가 함께 증가했습니다.",
    "- RC Progress: RC3에 연결된 신규 이슈는 처리되었지만, 전체 잔여 이슈는 이전 RC에서 발생한 이슈의 영향을 받고 있습니다.",
    "",
    JSON.stringify(
      {
        seniorQaAnalysisEvidence,
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

function getReleaseStatusLabel({
  totalTestCases,
  blockedCount,
  highHighest,
  medium,
}: {
  totalTestCases: number;
  blockedCount: number;
  highHighest: number;
  medium: number;
}): SeniorQaAnalysisEvidence["releaseStatus"] {
  const blockedRate = totalTestCases > 0 ? blockedCount / totalTestCases : 0;

  if (highHighest > 0 || blockedRate >= 0.2) return "위험";
  if (medium > 0 || blockedRate >= 0.1) return "주의 필요";
  return "안정";
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
}

function extractBaseVersion(value: string) {
  return value.match(/\d+(?:\.\d+)+/)?.[0] ?? "";
}

function createVersionTrendSignal(
  analysisPayload: AnalysisPayload
): SeniorQaAnalysisEvidence["versionTrendSignal"] {
  const sourceItems =
    analysisPayload.versionIssueSummary.length > 0
      ? analysisPayload.versionIssueSummary
      : analysisPayload.versionSummary;
  const groupedItems = new Map<string, VersionIssueSummaryItem>();

  sourceItems.forEach((item) => {
    const baseVersion = extractBaseVersion(item.version);

    if (!baseVersion) return;

    const current =
      groupedItems.get(baseVersion) ?? {
        version: baseVersion,
        highHighest: 0,
        medium: 0,
        low: 0,
        total: 0,
      };

    current.highHighest += item.highHighest;
    current.medium += item.medium;
    current.low += item.low;
    current.total += item.total;
    groupedItems.set(baseVersion, current);
  });

  const versionItems = Array.from(groupedItems.values());
  const currentItem = versionItems.at(-1);
  const previousItems = currentItem ? versionItems.slice(0, -1) : [];
  const previousVersionAverageIssues = average(
    previousItems.map((item) => item.total)
  );
  const previousHighPlusAverageIssues = average(
    previousItems.map((item) => item.highHighest)
  );
  let trendDirection: SeniorQaAnalysisEvidence["versionTrendSignal"]["trendDirection"] =
    "not_enough_data";

  if (currentItem && previousItems.length > 0) {
    if (
      currentItem.total > previousVersionAverageIssues ||
      currentItem.highHighest > previousHighPlusAverageIssues
    ) {
      trendDirection = "increased";
    } else if (
      currentItem.total < previousVersionAverageIssues &&
      currentItem.highHighest <= previousHighPlusAverageIssues
    ) {
      trendDirection = "decreased";
    } else {
      trendDirection = "stable";
    }
  }

  return {
    currentBaseVersion: currentItem?.version ?? "",
    currentTotalIssues: currentItem?.total ?? 0,
    currentHighPlusIssues: currentItem?.highHighest ?? 0,
    previousVersionAverageIssues,
    previousHighPlusAverageIssues,
    trendDirection,
    sourceType: "base_version_trend",
  };
}

function countTextMatches(values: string[], patterns: RegExp[]) {
  return values.filter((value) =>
    patterns.some((pattern) => pattern.test(value))
  ).length;
}

function createQaCommentSignal(
  analysisPayload: AnalysisPayload
): SeniorQaAnalysisEvidence["qaCommentSignal"] {
  const followUps = analysisPayload.qaFollowUps;

  return {
    total: followUps.length,
    monitorCount: countTextMatches(followUps, [/모니터링|monitor/i]),
    retestCount: countTextMatches(followUps, [/재검증|회귀|retest|확인/i]),
    policyCount: countTextMatches(followUps, [/정책|기획|policy/i]),
    nextEventCount: countTextMatches(followUps, [/next event|차기|후속/i]),
    blockedCount: countTextMatches(followUps, [/blocked|진행 불가|QA 불가/i]),
  };
}

function createSeniorQaAnalysisEvidence(
  analysisPayload: AnalysisPayload
): SeniorQaAnalysisEvidence {
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
  const totalTestCases = featureSheets.reduce(
    (sum, sheet) => sum + (sheet.summary.Total ?? sheet.rows),
    0
  );
  const totalPass = featureSheets.reduce(
    (sum, sheet) => sum + (sheet.summary.Pass ?? 0),
    0
  );
  const totalBlockedCases = featureSheets.reduce(
    (sum, sheet) => sum + (sheet.summary.Blocked ?? 0),
    0
  );
  const passRate =
    totalTestCases > 0 ? Math.round((totalPass / totalTestCases) * 100) : 0;
  const blockedRate =
    totalTestCases > 0
      ? Math.round((totalBlockedCases / totalTestCases) * 1000) / 10
      : 0;
  const remainingPrioritySummary =
    analysisPayload.qaIssueOverview?.remaining.prioritySummary;
  const highHighest =
    (remainingPrioritySummary?.Highest ?? 0) + (remainingPrioritySummary?.High ?? 0);
  const medium = remainingPrioritySummary?.Medium ?? 0;
  const lowLowest =
    (remainingPrioritySummary?.Low ?? 0) + (remainingPrioritySummary?.Lowest ?? 0);
  const blockedImpact = analysisPayload.blockedImpact ?? {
    totalBlockedCases,
    blockedCauseIssueCount: 0,
    topBlockedIssues: [],
    warnings: [],
  };

  return {
    releaseStatus: getReleaseStatusLabel({
      totalTestCases,
      blockedCount: totalBlockedCases,
      highHighest,
      medium,
    }),
    totalTestCases,
    passRate,
    blockedRate,
    remainingSignal: {
      total: analysisPayload.qaIssueOverview?.remaining.total ?? 0,
      highHighest,
      medium,
      lowLowest,
    },
    blockedImpact: {
      totalBlockedCases: blockedImpact.totalBlockedCases,
      blockedCauseIssueCount: blockedImpact.blockedCauseIssueCount,
      topBlockedIssues: blockedImpact.topBlockedIssues.slice(0, 5).map((item) => ({
        ...item,
        affectedTestCases: item.affectedTestCases.slice(0, 6),
      })),
      warnings: blockedImpact.warnings.slice(0, 5),
    },
    rcSignal: {
      currentRc: analysisPayload.rcProgress?.rcLabel ?? "",
      items:
        analysisPayload.rcProgress?.items.slice(0, 8).map((item) => ({
          rc: item.rc,
          newIssues: item.newIssues,
          resolvedIssues: item.resolvedIssues,
          remainingIssues: item.remainingIssues,
          reopenedIssues: item.reopenedIssues,
        })) ?? [],
    },
    versionTrendSignal: createVersionTrendSignal(analysisPayload),
    patternSignal: analysisPayload.issuePatternAnalysis.slice(0, 5).map((item) => ({
      name: item.name,
      count: item.count,
      sourceTypes: item.sourceTypes,
    })),
    qaCommentSignal: createQaCommentSignal(analysisPayload),
  };
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
      blockedImpact: body.blockedImpact
        ? {
            totalBlockedCases: body.blockedImpact.totalBlockedCases,
            blockedCauseIssueCount: body.blockedImpact.blockedCauseIssueCount,
            topBlockedIssues: body.blockedImpact.topBlockedIssues
              .slice(0, 8)
              .map((item) => ({
                ...item,
                displayLabel:
                  item.displayLabel || `${item.jiraKey}(${item.jiraSummary})`,
                affectedSheets: item.affectedSheets.slice(0, 6),
                affectedCategories: item.affectedCategories.slice(0, 8),
                affectedTestCases: item.affectedTestCases.slice(0, 8),
              })),
            warnings: body.blockedImpact.warnings.slice(0, 8).map((warning) => ({
              ...warning,
              displayLabel:
                warning.displayLabel ||
                `${warning.jiraKey}(${warning.jiraSummary})`,
            })),
          }
        : null,
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
        max_output_tokens: isOverallReport ? 1800 : 450,
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
    const responseText = extractResponseText(data).trim();
    const parsedResponse = isOverallReport
      ? parseAiAnalysisResponse(responseText)
      : { analysis: responseText };

    return NextResponse.json(parsedResponse);
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
