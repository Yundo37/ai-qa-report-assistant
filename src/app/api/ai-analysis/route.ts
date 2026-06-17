import { NextResponse } from "next/server";
import type {
  AiAnalysisSection,
  AiExecutiveSummaryResult,
  AiExecutiveSummaryTone,
  AiOverallInsightCard,
  AiOverallInsightTone,
  AiPriorityCheckItem,
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
  overallInsightCards?: AiOverallInsightCard[];
  analysisSections?: AiAnalysisSection[];
  priorityCheckItems?: AiPriorityCheckItem[];
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

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidOverallInsightTone(
  value: unknown
): value is AiOverallInsightTone {
  return (
    value === "stable" ||
    value === "caution" ||
    value === "risk" ||
    value === "neutral"
  );
}

function normalizeOverallInsightCards(value: unknown): AiOverallInsightCard[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<AiOverallInsightCard[]>((items, item) => {
    if (!isRecord(item)) return items;

    const title = toTrimmedString(item.title);
    const headline = toTrimmedString(item.headline);
    const description = toTrimmedString(item.description);

    if (!title || !headline || !description) return items;

    items.push({
      title,
      headline,
      description,
      tone: isValidOverallInsightTone(item.tone) ? item.tone : "neutral",
    });

    return items;
  }, []).slice(0, 4);
}

function normalizeAnalysisSections(value: unknown): AiAnalysisSection[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<AiAnalysisSection[]>((sections, item) => {
    if (!isRecord(item)) return sections;

    const title = toTrimmedString(item.title);
    const body = toTrimmedString(item.body);

    if (!title || !body) return sections;

    sections.push({ title, body });

    return sections;
  }, []).slice(0, 4);
}

function normalizePriorityCheckItems(value: unknown): AiPriorityCheckItem[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<AiPriorityCheckItem[]>((items, item) => {
    if (!isRecord(item)) return items;

    const title = toTrimmedString(item.title);
    const reason = toTrimmedString(item.reason);
    const evidence = toTrimmedString(item.evidence);
    const priority =
      item.priority === "high" ||
      item.priority === "medium" ||
      item.priority === "low"
        ? item.priority
        : undefined;

    if (!title || !reason) return items;

    items.push({
      title,
      reason,
      evidence: evidence || undefined,
      priority,
    });

    return items;
  }, []).slice(0, 4);
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

    const overallInsightCards = normalizeOverallInsightCards(
      parsed.overallInsightCards
    );
    const analysisSections = normalizeAnalysisSections(
      parsed.analysisSections
    );
    const priorityCheckItems = normalizePriorityCheckItems(
      parsed.priorityCheckItems
    );

    return {
      analysis: parsed.analysis.trim(),
      executiveSummary: validateAiExecutiveSummary(parsed.executiveSummary),
      ...(overallInsightCards.length > 0 ? { overallInsightCards } : {}),
      ...(analysisSections.length > 0 ? { analysisSections } : {}),
      ...(priorityCheckItems.length > 0 ? { priorityCheckItems } : {}),
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
  return [
    "You are a senior Korean QA Lead summarizing an Overall QA Result Report for a release review meeting.",
    "Write in Korean, in a natural release-meeting QA lead style.",
    "Do not simply reread table values. Interpret the remaining risk structure, regression scope, and follow-up confirmation scope.",
    "Return only a valid JSON object. Do not wrap the JSON in markdown fences. Do not add explanations outside JSON.",
    "Keep existing top-level fields: analysis and executiveSummary. You may additionally return overallInsightCards, analysisSections, and priorityCheckItems for Overall reports.",
    "Evidence priority: 1) qaIssueOverview / remainingIssues, 2) blockedImpact, 3) rcProgress, 4) versionIssueSummary, 5) issuePatternAnalysis, 6) qaFollowUps.",
    "Use only facts present in the JSON payload. Never invent feature names, issue types, keywords, versions, RC labels, categories, ratios, counts, or schedules.",
    "Jira Key and displayLabel values must be copied exactly. Never rewrite, normalize, infer, or change a Jira key prefix. Never mention a Jira key alone.",
    "RC Progress is current-version RC flow only. Version Issue Trend is update-version comparison only. Never mix RC labels into Version Trend interpretation.",
    "RC-local remainingIssues is not the overall remaining issue count. Overall remaining must come from qaIssueOverview / remainingIssues / jiraFilteredSummary.",
    "Do not make release approval, service-open, deployment approval, or deployment impossible claims.",
    "Use issue-type patterns from issuePatternAnalysis first. Do not create repeated patterns from feature names alone.",
    "Mention QA Comment only lightly as follow-up confirmation scope. Do not repeat QA Comment source wording throughout the body.",
    "Use natural Korean QA report wording. Avoid AI-like filler such as 시사합니다, 기대됩니다, 요구됩니다, 종합해보면, 품질 안정화.",
    "Stable tone: calm monitoring-oriented wording. Avoid risk-heavy words unless supported by High / Highest remaining issues.",
    "Attention-needed tone: focus on Medium, policy confirmation, retest, Next Event separation, and limited conditional checks. Do not exaggerate as risk.",
    "Risk tone: explain High / Highest remaining issues, Blocked Impact, and regression verification scope clearly, without saying deployment is impossible.",
    "Numbers are allowed only when they directly support status judgment. Do not list Pass / Fail / Blocked / Next Event or Jira table values in sequence.",
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
    "Writing goal:",
    "- Explain what the release meeting should understand first, not what each table already shows.",
    "- Interpret the risk structure, regression priority, and operation/policy follow-up scope.",
    "- Keep the tone like a QA lead explaining the result in a release review meeting.",
    "",
    "Interpretation priority:",
    "1. qaIssueOverview / remainingIssues",
    "2. blockedImpact",
    "3. rcProgress",
    "4. versionIssueSummary",
    "5. issuePatternAnalysis",
    "6. qaFollowUps",
    "",
    "Analysis tone anchors:",
    "- Stable: 주요 차단 요소는 제한적이며 Low / 후속 확인 항목은 운영 모니터링 범위로 관리한다고 설명합니다.",
    "- Attention-needed: 즉시 차단보다 Medium / 정책 / 재검증 / Next Event 확인 범위를 분리한다고 설명합니다.",
    "- Risk: High / Highest 잔여 이슈와 Blocked Impact를 명확히 설명하고, 배포 전 우선 확인 / 회귀 검증 범위를 분리합니다.",
    "",
    "Output JSON schema:",
    JSON.stringify(
      {
        analysis:
          "Korean analysis text. Keep it readable and split into paragraphs when useful.",
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
        overallInsightCards: [
          {
            title: "종합 판단",
            headline: "One short Korean judgment sentence.",
            description:
              "Explain the current Overall QA state as interpreted risk structure.",
            tone: "stable | caution | risk | neutral",
          },
          {
            title: "핵심 원인",
            headline: "Short cause-oriented headline.",
            description:
              "Explain where High / Blocked / Medium signals are concentrated.",
            tone: "stable | caution | risk | neutral",
          },
          {
            title: "회귀 우선순위",
            headline: "Short regression priority headline.",
            description:
              "Explain which flow should be retested first.",
            tone: "stable | caution | risk | neutral",
          },
          {
            title: "운영/정책 확인 범위",
            headline: "Short operation or policy headline.",
            description:
              "Explain policy, operation tool, Next Event, or monitoring scope.",
            tone: "stable | caution | risk | neutral",
          },
        ],
        analysisSections: [
          {
            title: "종합 판단",
            body: "Korean section body.",
          },
          {
            title: "핵심 리스크 해석",
            body: "Korean section body.",
          },
          {
            title: "후속 확인 방향",
            body: "Korean section body.",
          },
        ],
        priorityCheckItems: [
          {
            title: "High / Highest 잔여 이슈 원인 확인",
            reason: "Actionable Korean reason.",
            evidence: "Optional short evidence from payload.",
            priority: "high | medium | low",
          },
        ],
      },
      null,
      2
    ),
    "",
    "Structured field rules:",
    "- Keep analysis and executiveSummary for backward compatibility.",
    "- overallInsightCards must contain up to 4 cards using these titles when possible: 종합 판단, 핵심 원인, 회귀 우선순위, 운영/정책 확인 범위.",
    "- analysisSections should contain 2 to 4 readable sections. Prefer 종합 판단, 핵심 리스크 해석, 후속 확인 방향.",
    "- priorityCheckItems should contain at most 4 actionable confirmation items. Omit it if there is no useful item.",
    "- executiveSummary remains compact fallback card copy. overallInsightCards is the AI-run-specific richer card copy.",
    "",
    "Strict rules:",
    "- Korean terminology policy: write 잔여 이슈 instead of Remaining or Remaining Issue. You may keep Blocked, Next Event, RC, High+, CTA, Jira, Low Known Issue.",
    "- Use seniorQaAnalysisEvidence.releaseStatus for tone, but do not simply repeat the dashboard status label.",
    "- Stable output must avoid heavy risk wording such as 릴리즈 차단, 배포 전 우선 확인, 심각한 리스크.",
    "- Attention-needed output must not exaggerate Medium / policy / Next Event items as High risk.",
    "- Risk output must explain High / Highest 잔여 이슈, Blocked Impact, and flow-level regression scope without saying 배포 불가.",
    "- Explain 잔여 이슈 priority meaning. Do not treat Low / Lowest 잔여 이슈 or Next Event alone as a current release risk.",
    "- Analyze Blocked Impact from seniorQaAnalysisEvidence.blockedImpact. Explain what validation scope is blocked and what flow should be retested.",
    "- When mentioning blocked cause Jira, copy blockedImpact.topBlockedIssues[].displayLabel exactly. Do not compose the label yourself.",
    "- Mention at most 2 or 3 blocked cause Jira issues. Do not list affected TIDs.",
    "- Interpret repeated patterns as connected functional flow, for example 상태값 변경 → CTA 노출 → 결과 상태 → 알림 발송, only when supported by existing pattern names.",
    "- Repeated patterns must come from overallAnalysisEvidence.issuePatternAnalysis first. Do not create new pattern names if this list has usable items.",
    "- Do not write feature-name-only patterns such as 이벤트 관련 이슈, 알림 관련 이슈, 운영툴 관련 이슈.",
    "- For Version Issue Trend, use seniorQaAnalysisEvidence.versionTrendSignal.currentBaseVersion only. Do not use currentRc or RC labels.",
    "- When explaining RC Progress, do not describe update-version trend. RC item remainingIssues is local to that RC item.",
    "- Do not list Pass / Fail / Blocked / Next Event counts in sequence. Do not restate Jira Total / Remaining / Resolved tables.",
    "- Mention QA follow-up scope naturally, for example: 하단 협의/확인 항목에서 ## 표시된 TC Comment 기반의 후속 확인 범위를 확인할 수 있습니다.",
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
        max_output_tokens: isOverallReport ? 2400 : 450,
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
