"use client";

import type { ReactNode } from "react";
import { QaReleaseStatusCard } from "@/components/report/QaReleaseStatusCard";
import { ReportAssetSlot } from "@/components/report/ReportAssetSlot";
import type { QaReleaseStatusTone } from "@/lib/report/qaReleaseStatus";
import type {
  AiExecutiveSummaryResult,
  AnalysisSummaryState,
} from "@/types/report";

type DashboardHeaderMetaItem = {
  label: string;
  value: string;
  icon?: "date" | "version" | "generated";
};

type StatusOverride = {
  tone: QaReleaseStatusTone;
    label: string;
    description: string;
    title?: string;
    cardClassName?: string;
    descriptionClassName?: string;
    metrics?: Array<{
    label: string;
    value: string | number;
    tone?: "neutral" | "stable" | "caution" | "risk";
  }>;
};

type ReportDashboardHeaderProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  reportScopeText: string;
  reportPeriodText: string;
  reportVersionText: string;
  reportRcText: string;
  generatedAtText: string;
  aiExecutiveSummary: AiExecutiveSummaryResult | null;
  isAiAnalyzing: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  primaryText?: string;
  badges?: ReactNode;
  metaItems?: DashboardHeaderMetaItem[];
  showHeroVisual?: boolean;
  hideAssetSlot?: boolean;
  hideAssetSlotWhenHeroVisualHidden?: boolean;
  statusOverride?: StatusOverride;
};

function stripRcFromVersion(value: string) {
  return value
    .replace(/\s+RC\s*\d+\b/gi, "")
    .replace(/\s+\(.*?RC\s*\d+.*?\)/gi, "")
    .trim();
}

function extractRc(value: string) {
  const match = value.match(/\bRC\s*\d+\b/i);
  return match ? match[0].replace(/\s+/g, "").toUpperCase() : "";
}

function HeaderMetaIcon({ type }: { type: "date" | "version" | "generated" }) {
  if (type === "date") {
    return (
      <span
        aria-hidden="true"
        className="relative size-4 shrink-0 rounded-[4px] border border-indigo-300 bg-white/80"
      >
        <span className="absolute inset-x-[3px] top-[4px] h-px bg-indigo-300" />
        <span className="absolute left-[3px] top-[2px] size-0.5 rounded-full bg-indigo-500" />
        <span className="absolute right-[3px] top-[2px] size-0.5 rounded-full bg-indigo-500" />
      </span>
    );
  }

  if (type === "generated") {
    return (
      <span
        aria-hidden="true"
        className="relative size-4 shrink-0 rounded-full border border-indigo-300 bg-white/80"
      >
        <span className="absolute left-1/2 top-1/2 h-[5px] w-px -translate-x-1/2 -translate-y-full bg-indigo-500" />
        <span className="absolute left-1/2 top-1/2 h-px w-[5px] -translate-y-1/2 bg-indigo-500" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="size-2 shrink-0 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200"
    />
  );
}

export function ReportDashboardHeader({
  analysisSummary,
  reportScopeText,
  reportPeriodText,
  reportVersionText,
  reportRcText,
  generatedAtText,
  aiExecutiveSummary,
  isAiAnalyzing,
  eyebrow,
  title,
  description,
  primaryText,
  badges,
  metaItems: metaItemsOverride,
  showHeroVisual,
  hideAssetSlot = false,
  hideAssetSlotWhenHeroVisualHidden = false,
  statusOverride,
}: ReportDashboardHeaderProps) {
  const fallbackScope =
    analysisSummary.inferredTargetVersion || reportScopeText || "";
  const versionText =
    reportVersionText.trim() || stripRcFromVersion(fallbackScope) || "-";
  const rcLabel =
    reportRcText.trim() ||
    analysisSummary.rcProgress?.rcLabel ||
    extractRc(fallbackScope) ||
    "-";
  const scopeLabel = reportPeriodText ? "QA Period" : "Target Scope";
  const scopeValue =
    reportPeriodText ||
    [versionText, rcLabel === "-" ? "" : rcLabel].filter(Boolean).join(" ") ||
    "-";
  const defaultMetaItems: DashboardHeaderMetaItem[] = [
    {
      label: scopeLabel,
      value: reportPeriodText ? scopeValue : `Target Scope ${scopeValue}`,
      icon: "date",
    },
    {
      label: "Version",
      value: `Version ${versionText}`,
      icon: "version",
    },
    {
      label: "Generated",
      value: `Generated ${generatedAtText || "-"}`,
      icon: "generated",
    },
  ];
  const metaItems = metaItemsOverride ?? defaultMetaItems;
  const showAiHeroVisual =
    showHeroVisual ?? (isAiAnalyzing || Boolean(aiExecutiveSummary));
  const shouldHideAssetSlot =
    hideAssetSlot ||
    (hideAssetSlotWhenHeroVisualHidden && !showAiHeroVisual);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/50 to-violet-50/80 p-5 shadow-lg shadow-indigo-100/50 sm:p-6">
      <div
        className={
          shouldHideAssetSlot
            ? "grid grid-cols-1 items-start gap-5"
            : "grid grid-cols-[minmax(0,1fr)_300px] items-start gap-5"
        }
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            {eyebrow ?? "QA Release Dashboard"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {title ?? "Overall QA Result Report"}
            </h1>
            {badges ?? (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700 ring-1 ring-violet-200">
                {rcLabel}
              </span>
            )}
          </div>
          {primaryText && (
            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              {primaryText}
            </p>
          )}
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            {description ??
              "Google Spreadsheet QA 데이터와 Jira 이슈를 기반으로 전체 릴리즈 QA 상태를 요약합니다."}
          </p>
          <dl className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            {metaItems.map((item) => (
              <div key={item.label} className="flex min-w-0 items-center gap-2">
                <HeaderMetaIcon type={item.icon ?? "version"} />
                <dt className="sr-only">{item.label}</dt>
                <dd className="max-w-[300px] truncate font-semibold text-slate-700">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <QaReleaseStatusCard
              analysisSummary={analysisSummary}
              rcLabel={rcLabel}
              statusOverride={statusOverride}
            />
          </div>
        </div>

        {!shouldHideAssetSlot && (
          <div className="flex h-full flex-col">
            <div className="relative mt-0 min-h-[190px] flex-1 overflow-hidden rounded-[1.75rem]">
              {showAiHeroVisual ? (
                <ReportAssetSlot
                  type="ai-hero"
                  className="h-full min-h-[190px] border-0 bg-transparent bg-none shadow-none ring-0"
                  imageClassName="scale-125 p-0"
                />
              ) : (
                <div
                  className="h-full min-h-[190px] rounded-[1.75rem] bg-white/20"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
