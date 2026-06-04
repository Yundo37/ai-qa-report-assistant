import { OverallFeatureSummaryCard } from "@/components/report/OverallFeatureSummaryCard";
import { OverallQaSummaryCard } from "@/components/report/OverallQaSummaryCard";
import { VersionIssueSummaryCard } from "@/components/report/VersionIssueSummaryCard";
import type { AnalysisSummaryState } from "@/types/report";

type OverallReportResultSectionProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  reportScopeText: string;
};

export function OverallReportResultSection({
  analysisSummary,
  reportScopeText,
}: OverallReportResultSectionProps) {
  return (
    <>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Report Scope
        </p>
        <p className="mt-2 text-sm font-medium text-zinc-100">
          Target Version: {reportScopeText}
        </p>
      </div>
      {analysisSummary.overallQaSummary && (
        <OverallQaSummaryCard summary={analysisSummary.overallQaSummary} />
      )}
      {analysisSummary.overallTestSheets && (
        <OverallFeatureSummaryCard
          testSheets={analysisSummary.overallTestSheets}
        />
      )}
      <VersionIssueSummaryCard
        items={analysisSummary.versionSummary ?? []}
        title="Version Issue Summary"
        description="媛숈? base version???랁븳 RC ?댁뒋瑜??듯빀???곗꽑?쒖쐞 遺꾪룷?낅땲??"
      />
      <VersionIssueSummaryCard
        items={analysisSummary.versionIssueSummary ?? []}
      />
    </>
  );
}
