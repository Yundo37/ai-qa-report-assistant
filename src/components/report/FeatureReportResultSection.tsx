import { SummaryCard } from "@/components/report/SummaryCard";
import type { AnalysisSummaryState } from "@/types/report";

type FeatureReportResultSectionProps = {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  reportScopeText: string;
};

export function FeatureReportResultSection({
  analysisSummary,
  reportScopeText,
}: FeatureReportResultSectionProps) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-zinc-300">
        QA Summary
      </h2>
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Report Scope
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-100">
            Target Version: {reportScopeText}
          </p>
        </div>
        <SummaryCard title="QA Summary - Total" summary={analysisSummary.qaTotal} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {analysisSummary.testSheets.map((sheet) => (
            <SummaryCard
              key={sheet.title}
              title={`QA Summary - ${sheet.title}`}
              rows={sheet.rows}
              summary={sheet.summary}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
