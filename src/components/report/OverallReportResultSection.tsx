import { OverallFeatureSummaryCard } from "@/components/report/OverallFeatureSummaryCard";
import { OverallQaSummaryCard } from "@/components/report/OverallQaSummaryCard";
import { VersionIssueSummaryCard } from "@/components/report/VersionIssueSummaryCard";
import type { AnalysisSummaryState } from "@/types/report";

type OverallReportResultSectionProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
};

export function OverallReportResultSection({
  analysisSummary,
}: OverallReportResultSectionProps) {
  return (
    <>
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
        description="이전 버전과 현재 버전의 Jira 이슈 우선순위 분포를 비교합니다."
      />
      <VersionIssueSummaryCard
        items={analysisSummary.versionIssueSummary ?? []}
      />
    </>
  );
}
