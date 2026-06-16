"use client";

import { useState } from "react";
import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
import { ReportAssetSlot } from "@/components/report/ReportAssetSlot";
import type {
  AiExecutiveSummaryResult,
  AnalysisSummaryState,
} from "@/types/report";

type AiExecutiveSummaryCardProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  analysisText: string;
  aiExecutiveSummary?: AiExecutiveSummaryResult | null;
  isLoading: boolean;
};

/*
  "현재 Overall QA는 High / Highest 잔여 이슈와 Blocked 항목 확인이 필요한 상태입니다. 상단 잔여 이슈와 RC별 잔여 흐름을 함께 검토하면 릴리즈 전 우선 확인 범위를 빠르게 좁힐 수 있습니다.",
  "주요 리스크는 High Priority 잔여 이슈, Blocked 항목, 반복 이슈 패턴에서 확인됩니다. 특히 반복 패턴이 여러 데이터 소스에 걸쳐 나타나는 경우 기능 검증 범위와 후속 확인 항목을 분리해 관리하는 것이 좋습니다.",
  "후속 액션은 주요 잔여 이슈 재확인, Blocked 항목 재검증, Next Event 항목 별도 추적을 중심으로 정리할 수 있습니다. Next Event는 현재 릴리즈 실패 신호가 아니라 차기 대응 및 모니터링 항목으로 분리해 확인합니다.",
*/

type SignalTone = "stable" | "attention" | "risk" | "neutral";

type AiExecutiveSummaryViewModel = {
  releaseJudgment: {
    title: string;
    description: string;
  };
  riskSignals: Array<{
    title: string;
    value?: string | number;
    description: string;
    tone: SignalTone;
  }>;
  patternInsight: {
    title: string;
    description: string;
    patterns: Array<{
      label: string;
      value?: string | number;
    }>;
  };
  qaCheckpoints: string[];
};

function signalBadgeClass(tone: SignalTone) {
  if (tone === "risk") return "bg-red-50 text-red-700";
  if (tone === "attention") return "bg-amber-50 text-amber-700";
  if (tone === "neutral") return "bg-slate-100 text-slate-600";
  return "bg-emerald-50 text-emerald-700";
}

function formatSummaryValue(value: string | number | undefined) {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string" && value.trim()) return value;
  return "-";
}

function formatRate(rate: number) {
  return `${Math.round(rate * 1000) / 10}%`;
}

function createAiExecutiveSummaryViewModelFromAiResult(
  aiExecutiveSummary: AiExecutiveSummaryResult
): AiExecutiveSummaryViewModel {
  return {
    releaseJudgment: aiExecutiveSummary.releaseJudgment,
    riskSignals: aiExecutiveSummary.riskSignals.slice(0, 4).map((item) => ({
      title: item.label,
      value: item.value,
      description: item.description,
      tone: item.tone,
    })),
    patternInsight: {
      title: aiExecutiveSummary.patternInsight.title,
      description: aiExecutiveSummary.patternInsight.description,
      patterns: (aiExecutiveSummary.patternInsight.items ?? [])
        .slice(0, 3)
        .map((item) => ({
          label: item.label,
          value: item.value,
        })),
    },
    qaCheckpoints: aiExecutiveSummary.qaCheckpoints.slice(0, 4),
  };
}

function createReleaseJudgment({
  tone,
  highRisk,
  mediumRisk,
  blockedCount,
  blockedRate,
}: {
  tone: "stable" | "caution" | "risk";
  highRisk: number;
  mediumRisk: number;
  blockedCount: number;
  blockedRate: number;
}) {
  if (tone === "risk") {
    const reason =
      highRisk > 0 && blockedCount > 0
        ? "High / Highest 잔여 이슈와 Blocked 항목이 함께 남아 있어"
        : highRisk > 0
          ? "High / Highest 잔여 이슈가 남아 있어"
          : `Blocked 비율이 ${formatRate(blockedRate)}로 높아`;

    return {
      title: "추가 검증 필요",
      description: `${reason}, 배포 전 우선 확인 범위를 분리해야 합니다.`,
    };
  }

  if (tone === "caution") {
    const reason =
      mediumRisk > 0
        ? "High / Highest 잔여 이슈는 없지만 Medium 잔여 이슈가 남아 있어"
        : `Blocked 비율이 ${formatRate(blockedRate)} 수준이라`;

    return {
      title: "추가 확인 필요",
      description: `${reason}, 운영 정책 확인과 재검증 항목을 분리해 관리해야 합니다.`,
    };
  }

  return {
    title: "운영 모니터링 중심",
    description:
      highRisk === 0 && mediumRisk === 0
        ? "High / Medium 잔여 이슈는 없고, Low Known Issue와 Next Event는 운영 모니터링 항목으로 분리 관리하면 됩니다."
        : "주요 우선순위 잔여 이슈 신호가 낮아 운영 모니터링 중심으로 관리할 수 있습니다.",
  };
}

function createRiskSignals({
  tone,
  highRisk,
  mediumRisk,
  lowRisk,
  blockedCount,
  blockedRate,
  nextEventCount,
  rcRemaining,
}: {
  tone: "stable" | "caution" | "risk";
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  blockedCount: number;
  blockedRate: number;
  nextEventCount: number;
  rcRemaining: number;
}): AiExecutiveSummaryViewModel["riskSignals"] {
  if (tone === "risk") {
    return [
      {
        title: "High / Highest 잔여 이슈",
        value: highRisk,
        description: "배포 전 우선 확인 대상으로 분리해야 합니다.",
        tone: "risk",
      },
      {
        title: "Blocked",
        value: blockedCount,
        description: `Blocked 비율 ${formatRate(blockedRate)} 기준으로 원인 해소 후 회귀 검증이 필요합니다.`,
        tone: blockedRate >= 0.2 ? "risk" : "attention",
      },
      {
        title: "Medium 잔여 이슈",
        value: mediumRisk,
        description: "High 이슈 확인 이후 후속 재검증 대상으로 관리합니다.",
        tone: mediumRisk > 0 ? "attention" : "stable",
      },
      {
        title: "RC 잔여 이슈",
        value: rcRemaining,
        description: "RC별 잔여 흐름은 전체 잔여 이슈와 분리해 해석합니다.",
        tone: rcRemaining > 0 ? "attention" : "stable",
      },
    ];
  }

  if (tone === "caution") {
    return [
      {
        title: "High / Highest 잔여 이슈 없음",
        value: highRisk,
        description: "배포 전 우선 차단 신호는 낮은 상태입니다.",
        tone: "stable",
      },
      {
        title: "Medium 잔여 이슈",
        value: mediumRisk,
        description: "운영 정책 확인 또는 수정 반영 후 재검증이 필요합니다.",
        tone: mediumRisk > 0 ? "attention" : "stable",
      },
      {
        title: "Next Event",
        value: nextEventCount,
        description: "현재 릴리즈 위험과 분리해 후속 일정으로 관리합니다.",
        tone: "attention",
      },
      {
        title: "Blocked 영향",
        value: blockedCount,
        description: `Blocked 비율은 ${formatRate(blockedRate)}이며 상태 판정과 함께 보조 확인합니다.`,
        tone: blockedRate >= 0.1 ? "attention" : "stable",
      },
    ];
  }

  return [
    {
      title: "High / Medium 잔여 이슈 없음",
      value: highRisk + mediumRisk,
      description: "주요 릴리즈 차단 신호는 없습니다.",
      tone: "stable",
    },
    {
      title: "Low Known Issue",
      value: lowRisk,
      description: "운영 영향이 낮은 후속 관리 항목입니다.",
      tone: "stable",
    },
    {
      title: "Next Event",
      value: nextEventCount,
      description: "현재 릴리즈 위험이 아니라 차기 확인 항목입니다.",
      tone: "stable",
    },
    {
      title: "Blocked 낮은 영향",
      value: blockedCount,
      description: `Blocked 비율 ${formatRate(blockedRate)} 기준으로 안정 범위에서 모니터링합니다.`,
      tone: "stable",
    },
  ];
}

function createPatternInsight({
  tone,
  patternItems,
}: {
  tone: "stable" | "caution" | "risk";
  patternItems: NonNullable<AnalysisSummaryState>["issuePatternAnalysis"];
}): AiExecutiveSummaryViewModel["patternInsight"] {
  const patterns = (patternItems ?? []).slice(0, 3).map((item) => ({
    label: item.name,
    value: item.count,
  }));
  const patternSummary = patterns
    .map((item) => `${item.label} ${item.value.toLocaleString()}건`)
    .join(", ");

  if (patterns.length === 0) {
    return {
      title: "반복 패턴 데이터 제한",
      description:
        "반복 패턴을 해석할 만큼의 신호가 충분하지 않아 잔여 이슈 우선순위와 QA 코멘트 중심으로 확인합니다.",
      patterns: [],
    };
  }

  if (tone === "risk") {
    return {
      title: "흐름 단위 회귀 검증 신호",
      description: `상위 반복 패턴(${patternSummary})이 함께 나타나므로 단일 이슈보다 기능 흐름 단위로 재검증해야 합니다.`,
      patterns,
    };
  }

  if (tone === "caution") {
    return {
      title: "재검증과 정책 확인 신호",
      description: `상위 반복 패턴(${patternSummary})은 치명 신호보다 Medium 재검증과 운영 정책 확인 범위로 분리하는 것이 적절합니다.`,
      patterns,
    };
  }

  return {
    title: "반복 패턴 신호 낮음",
    description: `상위 반복 패턴(${patternSummary})은 Low Known Issue와 차기 확인 항목 중심으로 모니터링 가능합니다.`,
    patterns,
  };
}

function createQaCheckpoints({
  tone,
  hasPatterns,
}: {
  tone: "stable" | "caution" | "risk";
  hasPatterns: boolean;
}) {
  if (tone === "risk") {
    return [
      "High / Highest 잔여 이슈를 우선 확인합니다.",
      "Blocked 항목은 원인 해소 후 회귀 검증으로 분리합니다.",
      hasPatterns
        ? "상위 반복 패턴은 묶음 단위로 재검증합니다."
        : "반복 패턴 데이터는 보조 근거로만 확인합니다.",
    ];
  }

  if (tone === "caution") {
    return [
      "Medium 잔여 이슈는 수정 반영 후 재검증합니다.",
      "Next Event는 후속 일정 항목으로 분리합니다.",
      "운영 정책 확인 항목은 QA 코멘트 기준으로 추적합니다.",
    ];
  }

  return [
    "Low Known Issue는 배포 후 모니터링 항목으로 관리합니다.",
    "차기 이벤트 확인 항목은 현재 릴리즈 위험과 분리합니다.",
    "High / Medium 잔여 이슈 신규 발생 여부만 확인합니다.",
  ];
}

function createAiExecutiveSummaryViewModel({
  tone,
  highRisk,
  mediumRisk,
  lowRisk,
  blockedCount,
  blockedRate,
  nextEventCount,
  rcRemaining,
  patternItems,
}: {
  tone: "stable" | "caution" | "risk";
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  blockedCount: number;
  blockedRate: number;
  nextEventCount: number;
  rcRemaining: number;
  patternItems: NonNullable<AnalysisSummaryState>["issuePatternAnalysis"];
}): AiExecutiveSummaryViewModel {
  const patternInsight = createPatternInsight({ tone, patternItems });

  return {
    releaseJudgment: createReleaseJudgment({
      tone,
      highRisk,
      mediumRisk,
      blockedCount,
      blockedRate,
    }),
    riskSignals: createRiskSignals({
      tone,
      highRisk,
      mediumRisk,
      lowRisk,
      blockedCount,
      blockedRate,
      nextEventCount,
      rcRemaining,
    }),
    patternInsight,
    qaCheckpoints: createQaCheckpoints({
      tone,
      hasPatterns: patternInsight.patterns.length > 0,
    }),
  };
}

export function AiExecutiveSummaryCard({
  analysisSummary,
  analysisText,
  aiExecutiveSummary,
  isLoading,
}: AiExecutiveSummaryCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const hasRealAnalysisText = Boolean(analysisText.trim());
  const paragraphs = analysisText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const hasAnalysis = hasRealAnalysisText && paragraphs.length > 0;
  const metrics = createOverallDashboardMetrics(analysisSummary);
  const remainingPriority =
    analysisSummary.qaIssueOverview?.remaining?.prioritySummary;
  const highRisk =
    (remainingPriority?.Highest ?? 0) + (remainingPriority?.High ?? 0);
  const mediumRisk = remainingPriority?.Medium ?? 0;
  const lowRisk = (remainingPriority?.Low ?? 0) + (remainingPriority?.Lowest ?? 0);
  const blockedCount =
    analysisSummary.overallQaSummary?.Blocked ??
    analysisSummary.qaTotal.Blocked ??
    0;
  const nextEventCount =
    analysisSummary.overallQaSummary?.NextEvent ??
    analysisSummary.qaTotal.NextEvent ??
    0;
  const patternItems = (analysisSummary.issuePatternAnalysis ?? []).slice(0, 3);
  const ruleBasedExecutiveSummaryViewModel = createAiExecutiveSummaryViewModel({
    tone: metrics.status.tone,
    highRisk,
    mediumRisk,
    lowRisk,
    blockedCount,
    blockedRate: metrics.blockedRate,
    nextEventCount,
    rcRemaining: analysisSummary.rcProgress.remainingIssues,
    patternItems,
  });
  const executiveSummaryViewModel = aiExecutiveSummary
    ? createAiExecutiveSummaryViewModelFromAiResult(aiExecutiveSummary)
    : ruleBasedExecutiveSummaryViewModel;
  const hasAiExecutiveSummary = Boolean(aiExecutiveSummary);
  const hasAiBranding = isLoading || hasAiExecutiveSummary;
  const cardTitle = hasAiBranding
    ? "AI 릴리즈 분석 요약"
    : "릴리즈 분석 요약";
  const cardDescription = hasAiBranding
    ? "현재 QA 및 Jira 데이터를 기반으로 릴리즈 판단, 리스크 신호, 반복 패턴, QA 확인 항목을 정리합니다."
    : "현재 QA 및 Jira 데이터를 기반으로 릴리즈 판단과 리스크 신호를 정리합니다.";
  const totalTestCases =
    analysisSummary.overallQaSummary?.Total ??
    analysisSummary.qaTotal.Total ??
    0;
  const metricStripItems = [
    {
      label: "전체 TC",
      value: totalTestCases,
      slotType: "metric-test-cases" as const,
    },
    {
      label: "발견 이슈",
      value: analysisSummary.jiraMatchedRows,
      slotType: "metric-jira-issues" as const,
    },
    {
      label: "잔여 이슈",
      value: metrics.remaining,
      slotType: "risk" as const,
    },
    {
      label: "분석 RC",
      value: analysisSummary.rcProgress.items.length,
      slotType: "metric-rc-versions" as const,
    },
    {
      label: "QA 코멘트",
      value: analysisSummary.qaFollowUps.length,
      slotType: "follow-up" as const,
    },
  ];
  const passRatePercent = Math.max(0, Math.min(metrics.passRate, 100));
  const passRateDonutStyle = {
    background: `conic-gradient(#6d5dfc ${passRatePercent}%, #ece9ff ${passRatePercent}% 100%)`,
  };

  return (
    <section
      className={`min-w-0 rounded-[2rem] p-5 sm:p-6 ${
        hasAiBranding
          ? "border border-indigo-200 bg-gradient-to-br from-indigo-100/90 via-violet-50 to-white shadow-xl shadow-indigo-100/80"
          : "border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 shadow-sm"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {hasAiBranding && (
              <span className="grid size-8 place-items-center rounded-full bg-indigo-600 text-sm font-black text-white">
                ai
              </span>
            )}
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              {cardTitle}
            </h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {cardDescription}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-2xl border border-indigo-100 bg-white/85 p-4 shadow-sm">
          <p className="text-sm font-semibold text-indigo-700">
            AI 분석 생성 중입니다.
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            현재 QA 및 Jira 데이터를 기반으로 릴리즈 판단과 리스크 신호를
            정리하고 있습니다.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-[1.15fr_1fr_1fr_0.9fr] overflow-hidden rounded-t-3xl border-x border-t border-indigo-100 bg-white/95 shadow-sm">
            <div className="border-r border-indigo-100/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                릴리즈 판단
              </p>
              <p className="mt-4 text-center text-xl font-black tracking-tight text-indigo-700">
                {executiveSummaryViewModel.releaseJudgment.title}
              </p>
              <p className="mt-3 text-center text-sm font-semibold leading-6 text-slate-800">
                {executiveSummaryViewModel.releaseJudgment.description}
              </p>
              <div className="mt-5 flex justify-center">
                <div
                  className="grid size-36 place-items-center rounded-full shadow-inner shadow-indigo-100"
                  style={passRateDonutStyle}
                  aria-label={`통과율 ${passRatePercent}%`}
                >
                  <div className="flex size-28 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                    <span className="block text-3xl font-black leading-none text-indigo-700">
                      {passRatePercent}%
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold leading-none text-slate-500">
                      통과율
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-r border-indigo-100/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                주요 리스크 신호
              </p>
              <ul className="mt-4 space-y-3">
                {executiveSummaryViewModel.riskSignals.map((item) => (
                  <li key={item.title} className="text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-semibold leading-5 text-slate-800">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {item.description}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${signalBadgeClass(
                          item.tone
                        )}`}
                      >
                        {formatSummaryValue(item.value)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-r border-indigo-100/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                반복 패턴 해석
              </p>
              {executiveSummaryViewModel.patternInsight.patterns.length > 0 ? (
                <>
                  <p className="mt-3 text-sm font-semibold leading-5 text-slate-800">
                    {executiveSummaryViewModel.patternInsight.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {executiveSummaryViewModel.patternInsight.description}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {executiveSummaryViewModel.patternInsight.patterns.map((item) => (
                      <li key={item.label} className="text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex min-w-0 items-start gap-2 leading-5 text-slate-700">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-500" />
                            <span className="min-w-0">{item.label}</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                            {formatSummaryValue(item.value)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-500">
                  {executiveSummaryViewModel.patternInsight.description}
                </p>
              )}
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                QA 확인 방향
              </p>
              <ul className="mt-4 space-y-3">
                {executiveSummaryViewModel.qaCheckpoints.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-700">
                Medium {mediumRisk.toLocaleString()} / Low{" "}
                {lowRisk.toLocaleString()} / Next Event{" "}
                {nextEventCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 rounded-b-3xl border-x border-b border-indigo-100 bg-white/85 p-3 shadow-sm">
            {metricStripItems.map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 items-center gap-3 rounded-2xl bg-indigo-50/45 px-3 py-2"
              >
                <ReportAssetSlot
                  type={item.slotType}
                  className="size-9 rounded-xl bg-white/85 bg-none shadow-sm ring-1 ring-indigo-100"
                  imageClassName="size-7"
                />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-base font-bold text-slate-950">
                    {item.value.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {hasAnalysis && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsDetailOpen((value) => !value)}
                className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300"
              >
                {isDetailOpen ? "전체 AI 요약 접기" : "전체 AI 요약 보기"}
              </button>
              {isDetailOpen && (
                <div className="mt-4 space-y-4 rounded-2xl border border-indigo-100 bg-white p-4 text-[15px] leading-8 text-slate-700">
                  {paragraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className="border-l-4 border-indigo-200 pl-4"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
