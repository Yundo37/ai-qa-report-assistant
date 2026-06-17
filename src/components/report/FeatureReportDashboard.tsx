"use client";

import { DetailedSummarySection } from "@/components/report/DetailedSummarySection";
import { IssueReviewCardsSection } from "@/components/report/IssueReviewCardsSection";
import { ReportDashboardHeader } from "@/components/report/ReportDashboardHeader";
import { SummaryCard } from "@/components/report/SummaryCard";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import {
  createFeatureAiInsights,
  createFeatureCoreSummaryModel,
  createFeatureMetrics,
  createFeatureReviewDisplayModel,
  type FeatureCoreSummaryModel,
  type FeatureMetrics,
} from "@/components/report/featureReportDashboardUtils";
import type { AnalysisSummaryState } from "@/types/report";

type FeatureReportDashboardProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  aiAnalysisText: string;
  isAiAnalyzing: boolean;
  onAnalyze: () => void;
  reportTitleText: string;
  reportPeriodText: string;
  reportVersionText: string;
  reportRcText: string;
  generatedAtText: string;
};

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function insightBadgeClassName(tone: string) {
  if (tone === "risk") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (tone === "caution") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (tone === "stable") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function InsightIcon({ title }: { title: string }) {
  const iconClassName = "size-4 text-indigo-600";

  if (title === "주요 리스크 신호") {
    return <AlertTriangle className={iconClassName} aria-hidden="true" />;
  }

  if (title === "추가 검증 포인트") {
    return <ClipboardCheck className={iconClassName} aria-hidden="true" />;
  }

  if (title === "QA 확인 방향") {
    return <CheckCircle2 className={iconClassName} aria-hidden="true" />;
  }

  return <ShieldCheck className={iconClassName} aria-hidden="true" />;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

const PASS_RATE_GAUGE_COLOR = "#6d5ef6";

function PassRateGauge({ metrics }: { metrics: FeatureMetrics }) {
  const radius = 54;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const passRate = clampPercent(metrics.passRate);
  const dashOffset = circumference * (1 - passRate / 100);

  return (
    <div
      className="relative grid size-36 shrink-0 place-items-center"
      aria-label={`Pass Rate ${formatPercent(passRate)}`}
    >
      <svg
        className="size-36 -rotate-90"
        viewBox="0 0 144 144"
        aria-hidden="true"
      >
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="#eef2ff"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={PASS_RATE_GAUGE_COLOR}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[2rem] font-black leading-none tracking-tight text-indigo-700">
          {formatPercent(passRate)}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-violet-500">
          통과율
        </p>
      </div>
    </div>
  );
}

function FeatureQaStatusCard({ metrics }: { metrics: FeatureMetrics }) {
  return (
    <section className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div>
          <h3 className="text-base font-bold text-slate-950">
            기능 QA 현황
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            단일 기능의 TC 처리 상태와 검증 신호를 요약합니다.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3.5">
        <PassRateGauge metrics={metrics} />
        <div className="grid w-full grid-cols-5 gap-1.5">
        {[
          ["전체 TC", metrics.totalTc],
          ["Pass", metrics.pass],
          ["Fail", metrics.fail],
          ["Blocked", metrics.blocked],
          ["Next", metrics.nextEvent],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 px-2 py-1">
            <p className="text-[10px] font-semibold text-slate-500">
              {label}
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-950">{value}</p>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}

function SheetQaSummaryCard({
  items,
  hiddenCount,
}: {
  items: FeatureCoreSummaryModel["sheetProgressItems"];
  hiddenCount: number;
}) {
  return (
    <section className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-950">
            테스트 시트별 QA 요약
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            선택된 테스트 시트별 Pass Rate와 잔여 QA 신호를 비교합니다.
          </p>
        </div>
        <span className="hidden">
          {items.length}개 시트
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[42%] px-3 py-2">시트명</th>
                <th className="w-[18%] px-2 py-2 text-right">Total</th>
                <th className="w-[22%] px-2 py-2 text-right">Pass Rate</th>
                <th className="px-3 py-2 text-right">잔여</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item) => {
                const remaining = item.fail + item.blocked + item.nextEvent;

                return (
                  <tr key={item.title} className="bg-white">
                    <td className="truncate px-3 py-2.5 font-semibold text-slate-900">
                      {item.title}
                    </td>
                    <td className="px-2 py-2.5 text-right">{item.total}</td>
                    <td className="px-2 py-2.5 text-right font-bold text-slate-950">
                      {formatPercent(item.passRate)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-700">
                      {remaining}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          표시할 테스트 시트 QA 요약이 없습니다.
        </div>
      )}

      {hiddenCount > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          추가 {hiddenCount}개 테스트 시트는 상세 QA 데이터에서 확인할 수
          있습니다.
        </p>
      )}
    </section>
  );
}

function JiraIssueMatrixCard({
  rows,
}: {
  rows: FeatureCoreSummaryModel["jiraMatrixRows"];
}) {
  const hasIssueData = rows.some((row) => row.total > 0);

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-base font-bold text-slate-950">
          Jira 이슈 현황
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          발생, 수정 완료, 잔여 이슈를 Priority 기준으로 비교합니다.
        </p>
      </div>

      {hasIssueData ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full table-fixed text-left text-[11px]">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[34%] px-3 py-2">구분</th>
                <th className="px-1.5 py-2 text-right">Highest</th>
                <th className="px-2 py-2 text-right">High</th>
                <th className="px-2 py-2 text-right">Medium</th>
                <th className="px-3 py-2 text-right">Low</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">
                    {row.label}
                  </td>
                  <td className="px-1.5 py-2.5 text-right font-bold text-rose-700">
                    {row.highest}
                  </td>
                  <td className="px-2 py-2.5 text-right font-bold text-rose-700">
                    {row.high}
                  </td>
                  <td className="px-2 py-2.5 text-right font-bold text-amber-700">
                    {row.medium}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-700">
                    {row.low}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
          현재 기간/라벨 조건에 매칭된 Jira 이슈는 없습니다.
          <br />
          Jira Label, 분석 기간, Jira Sheet 연결 상태를 확인해주세요.
        </div>
      )}
    </section>
  );
}

function FeatureCoreSummarySection({
  model,
  metrics,
}: {
  model: FeatureCoreSummaryModel;
  metrics: FeatureMetrics;
}) {
  return (
    <div className="grid grid-cols-3 items-stretch gap-5">
      <FeatureQaStatusCard metrics={metrics} />
      <JiraIssueMatrixCard rows={model.jiraMatrixRows} />
      <SheetQaSummaryCard
        items={model.sheetProgressItems}
        hiddenCount={model.hiddenSheetCount}
      />
    </div>
  );
}

export function FeatureReportDashboard({
  analysisSummary,
  aiAnalysisText,
  isAiAnalyzing,
  reportTitleText,
  reportPeriodText,
  reportVersionText,
  reportRcText,
  generatedAtText,
}: FeatureReportDashboardProps) {
  const metrics = createFeatureMetrics(analysisSummary);
  const featureName = reportTitleText.trim() || "기능명 미입력";
  const versionLabel = reportVersionText.trim() || "버전 미입력";
  const rcLabel = reportRcText.trim() || "RC 미입력";
  const periodLabel = reportPeriodText || "기간 미설정";
  const generatedLabel = generatedAtText || "-";
  const hasAiAnalysis = aiAnalysisText.trim().length > 0;
  const summaryCommentEyebrow = isAiAnalyzing
    ? "AI 분석"
    : hasAiAnalysis
      ? "AI 분석"
      : "요약 코멘트";
  const summaryCommentTitle = isAiAnalyzing
    ? "AI 기능 QA 분석 중"
    : hasAiAnalysis
      ? "AI 기능 QA 분석 요약"
      : "기능 QA 분석 요약";
  const { visibleItems: qaReviewItems } =
    createFeatureReviewDisplayModel(analysisSummary);
  const coreSummary = createFeatureCoreSummaryModel(analysisSummary);
  const aiInsights = createFeatureAiInsights({
    metrics,
    reviewItems: qaReviewItems,
  });
  const aiFallbackText = `${metrics.status.description}\n\n전체 TC ${metrics.totalTc}건 중 Pass ${metrics.pass}건, Fail ${metrics.fail}건, Blocked ${metrics.blocked}건, Next Event ${metrics.nextEvent}건이 확인되었습니다.`;
  const displayedAiText = aiAnalysisText.trim() || aiFallbackText;
  const displayedAiPreviewText = displayedAiText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join("\n\n");

  return (
    <div className="space-y-5">
      <ReportDashboardHeader
        analysisSummary={analysisSummary}
        reportScopeText={featureName}
        reportPeriodText={periodLabel}
        reportVersionText={versionLabel}
        reportRcText={rcLabel}
        generatedAtText={generatedLabel}
        aiExecutiveSummary={null}
        isAiAnalyzing={isAiAnalyzing}
        eyebrow="기능 QA 리포트"
        title="기능 QA 결과 리포트"
        primaryText={featureName}
        description="Google Spreadsheet와 Jira 이슈를 기반으로 단일 기능의 QA 상태와 확인 항목을 요약합니다."
        badges={<></>}
        metaItems={[
          {
            label: "Version",
            value: `${versionLabel} ${rcLabel}`,
            icon: "version",
          },
          {
            label: "QA Period",
            value: `QA 기간 ${periodLabel}`,
            icon: "date",
          },
          {
            label: "Generated",
            value: `생성일 ${generatedLabel}`,
            icon: "generated",
          },
        ]} 
        showHeroVisual={isAiAnalyzing || hasAiAnalysis}
        hideAssetSlotWhenHeroVisualHidden
        statusOverride={{
          tone: metrics.status.tone,
          label: metrics.status.label,
          description: metrics.status.description,
          title: "기능 QA 상태",
          cardClassName: "max-w-[920px]",
          descriptionClassName: "max-w-[680px]",
        }}
      />

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            {summaryCommentEyebrow}
          </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              {summaryCommentTitle}
            </h2>
          </div>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          <div className="grid grid-cols-4 gap-2">
            {aiInsights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-indigo-100 bg-white px-3 py-2 shadow-sm shadow-indigo-50/40"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 ring-1 ring-indigo-100">
                    <InsightIcon title={item.title} />
                  </span>
                  <p className="min-w-0 text-xs font-bold text-indigo-600">
                    {item.title}
                  </p>
                </div>
                <p
                  className={`mt-2 inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${insightBadgeClassName(
                    item.tone
                  )}`}
                >
                  <span className="truncate">{item.value}</span>
                </p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 opacity-80">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl border border-white bg-white px-3 py-2 shadow-sm shadow-slate-100">
            <div className="whitespace-pre-line">{displayedAiPreviewText}</div>
          </div>
        </div>
      </section>

      <FeatureCoreSummarySection model={coreSummary} metrics={metrics} />

      <IssueReviewCardsSection
        analysisSummary={analysisSummary}
        toneOverride={metrics.status.tone}
      />

      <DetailedSummarySection>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-950">AI 분석 원문</h3>
          <div className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            {displayedAiText}
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <SummaryCard
            title="Jira Filtered Summary"
            summary={analysisSummary.jiraFiltered}
          />
          <SummaryCard
            title="Jira Status Summary"
            summary={analysisSummary.jiraStatus}
          />
          <SummaryCard
            title="Jira Priority Summary"
            summary={analysisSummary.jiraPriority}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {analysisSummary.testSheets.map((sheet) => (
            <SummaryCard
              key={`detail-${sheet.title}`}
              title={`QA Summary - ${sheet.title}`}
              rows={sheet.rows}
              summary={sheet.summary}
            />
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-950">
            QA Comment / Follow-up 원문
          </h3>
          {analysisSummary.qaFollowUps.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-600">
              {analysisSummary.qaFollowUps.map((item, index) => (
                <li
                  key={`${item}-raw-${index}`}
                  className="rounded-xl bg-slate-50 px-3 py-1.5"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              원문 QA Comment / Follow-up 항목이 없습니다.
            </p>
          )}
        </div>
      </DetailedSummarySection>

      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-400">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>Generated by AI QA Report Assistant</span>
          <span>QA Result / Jira / Follow-up 기반 기능 QA 데이터</span>
        </div>
      </footer>
    </div>
  );
}
