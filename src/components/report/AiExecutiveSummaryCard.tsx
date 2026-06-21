"use client";

import { useState } from "react";
import { AiAnalysisSections } from "@/components/report/ai-summary/AiAnalysisSections";
import { AiExecutiveSummaryLoading } from "@/components/report/ai-summary/AiExecutiveSummaryLoading";
import { AiPriorityCheckItems } from "@/components/report/ai-summary/AiPriorityCheckItems";
import { DeterministicReleaseSummaryPanel } from "@/components/report/ai-summary/DeterministicReleaseSummaryPanel";
import { OverallAiSummaryPanel } from "@/components/report/ai-summary/OverallAiSummaryPanel";
import {
  compactRiskSignal,
  createCompactJudgmentDescription,
  createCompactJudgmentTitle,
  formatSummaryValue,
  getDisplayEvidence,
  insightToneBadgeClass,
  insightToneLabel,
  priorityBadgeClass,
  priorityLabel,
  signalBadgeClass,
  softenBlockingTerms,
} from "@/components/report/ai-summary/aiExecutiveSummaryDisplayUtils";
import {
  createAiExecutiveSummaryViewModel,
  createAiExecutiveSummaryViewModelFromAiResult,
  createQaFlowActionItems,
} from "@/components/report/ai-summary/aiExecutiveSummaryViewModel";
import type { SummaryMetricStripItem } from "@/components/report/ai-summary/types";
import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
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

export function AiExecutiveSummaryCard({
  analysisSummary,
  analysisText,
  aiExecutiveSummary,
  isLoading,
}: AiExecutiveSummaryCardProps) {
  const analysisDetailKey = analysisText.trim();
  const [collapsedAnalysisDetailKey, setCollapsedAnalysisDetailKey] = useState<
    string | null
  >(null);
  const hasRealAnalysisText = Boolean(analysisDetailKey);
  const paragraphsByBlock = analysisText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const paragraphs =
    paragraphsByBlock.length > 1
      ? paragraphsByBlock
      : analysisText
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
  const hasCompletedAiAnalysis = hasRealAnalysisText && !isLoading;
  const isDetailOpen = collapsedAnalysisDetailKey !== analysisDetailKey;

  const insightCards = (aiExecutiveSummary?.overallInsightCards ?? []).slice(
    0,
    4
  );
  const hasStructuredInsightCards = hasAiExecutiveSummary && insightCards.length > 0;
  const mainInsightCard = insightCards[0];
  const riskInsightCard = insightCards[1];
  const patternInsightCard = insightCards[2] ?? insightCards[1];
  const structuredAnalysisSections = (
    aiExecutiveSummary?.analysisSections ?? []
  ).slice(0, 4);
  const fallbackAnalysisSections =
    structuredAnalysisSections.length > 0
      ? structuredAnalysisSections
      : paragraphs.length > 1
        ? paragraphs.map((paragraph, index) => ({
            title:
              index === 0
                ? "종합 판단"
                : index === 1
                  ? "핵심 리스크 해석"
                  : "후속 확인 방향",
            body: paragraph,
          }))
        : [];
  const priorityCheckItems = (
    aiExecutiveSummary?.priorityCheckItems ?? []
  ).slice(0, 4);
  const hasAiBranding = isLoading || hasCompletedAiAnalysis;
  const cardTitle = hasAiBranding
    ? "AI 릴리즈 분석 요약"
    : "릴리즈 분석 요약";
  const cardDescription = hasAiBranding
    ? "AI가 잔여 리스크 구조와 후속 확인 범위를 릴리즈 회의 관점으로 정리합니다."
    : "현재 QA 및 Jira 데이터를 기반으로 릴리즈 판단과 리스크 신호를 정리합니다.";
  const totalTestCases =
    analysisSummary.overallQaSummary?.Total ??
    analysisSummary.qaTotal.Total ??
    0;
  const metricStripItems: SummaryMetricStripItem[] = [
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
  const releaseJudgmentLabel = hasStructuredInsightCards
    ? "AI 종합 판단"
    : "릴리즈 판단";
  const releaseJudgmentTitle = createCompactJudgmentTitle(metrics.status.tone);
  const releaseJudgmentDescription = softenBlockingTerms(
    createCompactJudgmentDescription({
      tone: metrics.status.tone,
      highRisk,
      mediumRisk,
      blockedCount,
      lowRisk,
      nextEventCount,
    })
  );
  const patternInsightTitle =
    softenBlockingTerms(
      patternInsightCard?.headline ??
        executiveSummaryViewModel.patternInsight.title
    );
  const patternInsightDescription =
    softenBlockingTerms(
      patternInsightCard?.description ??
        executiveSummaryViewModel.patternInsight.description
    );
  const fallbackQaDirectionItems = ruleBasedExecutiveSummaryViewModel.qaCheckpoints.map(
    (item) => softenBlockingTerms(item)
  );
  const topQaDirectionItems = createQaFlowActionItems({
    tone: metrics.status.tone,
    patternLabels: patternItems.map((item) => item.name),
    priorityTitles: priorityCheckItems.map((item) => item.title),
    highRisk,
    mediumRisk,
    lowRisk,
    nextEventCount,
  }).map((item) => softenBlockingTerms(item));
  const displayRiskSignals =
    executiveSummaryViewModel.riskSignals.length >= 4
      ? executiveSummaryViewModel.riskSignals.slice(0, 4)
      : ruleBasedExecutiveSummaryViewModel.riskSignals.slice(0, 4);
  const compactRiskSignals = displayRiskSignals.map(compactRiskSignal);
  const displayPatternItems =
    ruleBasedExecutiveSummaryViewModel.patternInsight.patterns.length > 0
      ? ruleBasedExecutiveSummaryViewModel.patternInsight.patterns.slice(0, 3)
      : executiveSummaryViewModel.patternInsight.patterns.slice(0, 3);
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
        {hasAnalysis && (
          <button
            type="button"
            onClick={() =>
              setCollapsedAnalysisDetailKey((currentKey) =>
                currentKey === analysisDetailKey ? null : analysisDetailKey
              )
            }
            className="shrink-0 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
          >
            {isDetailOpen ? "전체 AI 요약 접기" : "전체 AI 요약 보기"}
          </button>
        )}
      </div>

      {isLoading ? (
        <AiExecutiveSummaryLoading />
      ) : !hasRealAnalysisText ? (
        <DeterministicReleaseSummaryPanel
          fallbackQaDirectionItems={fallbackQaDirectionItems}
          formatSummaryValue={formatSummaryValue}
          metricStripItems={metricStripItems}
          passRateDonutStyle={passRateDonutStyle}
          passRatePercent={passRatePercent}
          ruleBasedExecutiveSummaryViewModel={ruleBasedExecutiveSummaryViewModel}
          signalBadgeClass={signalBadgeClass}
          softenBlockingTerms={softenBlockingTerms}
        />
      ) : (
        <>
          <OverallAiSummaryPanel
            compactRiskSignals={compactRiskSignals}
            displayPatternItems={displayPatternItems}
            formatSummaryValue={formatSummaryValue}
            hasStructuredInsightCards={hasStructuredInsightCards}
            insightToneBadgeClass={insightToneBadgeClass}
            insightToneLabel={insightToneLabel}
            mainInsightCard={mainInsightCard}
            metricStripItems={metricStripItems}
            passRateDonutStyle={passRateDonutStyle}
            passRatePercent={passRatePercent}
            patternInsightDescription={patternInsightDescription}
            patternInsightTitle={patternInsightTitle}
            releaseJudgmentDescription={releaseJudgmentDescription}
            releaseJudgmentLabel={releaseJudgmentLabel}
            releaseJudgmentTitle={releaseJudgmentTitle}
            riskInsightCard={riskInsightCard}
            signalBadgeClass={signalBadgeClass}
            softenBlockingTerms={softenBlockingTerms}
            topQaDirectionItems={topQaDirectionItems}
          />

          {hasAnalysis && isDetailOpen && (
            <div className="mt-4 space-y-4 rounded-2xl border border-indigo-100 bg-white p-4 text-[15px] leading-8 text-slate-700">
              <AiPriorityCheckItems
                getDisplayEvidence={getDisplayEvidence}
                items={priorityCheckItems}
                priorityBadgeClass={priorityBadgeClass}
                priorityLabel={priorityLabel}
                softenBlockingTerms={softenBlockingTerms}
              />
              <AiAnalysisSections
                fallbackAnalysisSections={fallbackAnalysisSections}
                paragraphs={paragraphs}
                softenBlockingTerms={softenBlockingTerms}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
