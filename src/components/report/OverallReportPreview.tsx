import { createOverallReportPreviewLinesUtf8 } from "@/lib/reportPreview";
import type { AnalysisSummaryState } from "@/types/report";

export function OverallReportPreview({
  analysisSummary,
}: {
  analysisSummary: Exclude<AnalysisSummaryState, null>;
}) {
  const previewLines = createOverallReportPreviewLinesUtf8(analysisSummary);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
      <h2 className="text-base font-semibold text-slate-950">
        Overall QA Result Report Preview
      </h2>

      <div className="mt-5 space-y-5 text-sm leading-7 text-slate-700">
        {previewLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}
