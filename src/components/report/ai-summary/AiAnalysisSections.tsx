import type { SummaryAnalysisSection } from "@/components/report/ai-summary/types";

type AiAnalysisSectionsProps = {
  fallbackAnalysisSections: SummaryAnalysisSection[];
  paragraphs: string[];
  softenBlockingTerms: (text: string | undefined) => string;
};

export function AiAnalysisSections({
  fallbackAnalysisSections,
  paragraphs,
  softenBlockingTerms,
}: AiAnalysisSectionsProps) {
  if (fallbackAnalysisSections.length > 0) {
    return (
      <>
        {fallbackAnalysisSections.map((section, index) => (
          <section
            key={`${section.title}-${index}`}
            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
          >
            <h3 className="text-sm font-black text-slate-950">
              {softenBlockingTerms(section.title)}
            </h3>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-8 text-slate-700">
              {softenBlockingTerms(section.body)}
            </p>
          </section>
        ))}
      </>
    );
  }

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="border-l-4 border-indigo-200 pl-4">
          {softenBlockingTerms(paragraph)}
        </p>
      ))}
    </>
  );
}
