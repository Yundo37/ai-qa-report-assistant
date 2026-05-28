import { createOverallReportPreviewLinesUtf8 } from "@/lib/reportPreview";
import type { AnalysisSummaryState } from "@/types/report";

export function OverallReportPreview({
  analysisSummary,
}: {
  analysisSummary: Exclude<AnalysisSummaryState, null>;
}) {
  const previewLines = createOverallReportPreviewLinesUtf8(analysisSummary);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-6">
      <h2 className="text-base font-semibold text-zinc-100">
        Overall QA Result Report Preview
      </h2>

      <div className="mt-5 space-y-5 text-sm leading-7 text-zinc-300">
        {previewLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}
