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
      className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isGenerating
        ? "Generating Report..."
        : isFeatureReport
          ? "Generate Feature QA Report"
          : "Generate Overall QA Report"}
    </button>
  );
}
