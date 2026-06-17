"use client";

import { useState } from "react";
import { QaFollowUpDashboardCard } from "@/components/report/QaFollowUpDashboardCard";
import { RemainingIssuesDashboardCard } from "@/components/report/RemainingIssuesDashboardCard";
import type { QaReleaseStatusTone } from "@/lib/report/qaReleaseStatus";
import type { AnalysisSummaryState } from "@/types/report";

type IssueReviewCardsSectionProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  toneOverride?: QaReleaseStatusTone;
};

export function IssueReviewCardsSection({
  analysisSummary,
  toneOverride,
}: IssueReviewCardsSectionProps) {
  const [remainingExpanded, setRemainingExpanded] = useState(false);
  const [followUpExpanded, setFollowUpExpanded] = useState(false);
  const bothCollapsed = !remainingExpanded && !followUpExpanded;
  const shouldStretchCards = bothCollapsed;
  const cardClassName = shouldStretchCards ? "lg:h-full" : "";

  return (
    <div
      className={`grid grid-cols-1 gap-5 lg:grid-cols-2 ${
        shouldStretchCards ? "lg:items-stretch" : "lg:items-start"
      }`}
    >
      <div className={`min-w-0 ${cardClassName}`}>
        <RemainingIssuesDashboardCard
          analysisSummary={analysisSummary}
          toneOverride={toneOverride}
          className={cardClassName}
          onExpandedChange={setRemainingExpanded}
        />
      </div>
      <div className={`min-w-0 ${cardClassName}`}>
        <QaFollowUpDashboardCard
          analysisSummary={analysisSummary}
          className={cardClassName}
          onExpandedChange={setFollowUpExpanded}
        />
      </div>
    </div>
  );
}
