type ReportGenerateActionProps = {
  isFeatureReport: boolean;
  isGenerating: boolean;
  onGenerateReport: () => void;
};

export function ReportGenerateAction({
  isFeatureReport,
  isGenerating,
  onGenerateReport,
}: ReportGenerateActionProps) {
  return (
    <button
      onClick={onGenerateReport}
      disabled={isGenerating}
      className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isGenerating
        ? "Generating Report..."
        : isFeatureReport
          ? "Generate Feature QA Report"
          : "Generate Overall QA Report"}
    </button>
  );
}
