import { InputVisualIcon } from "@/components/report/InputVisualIcon";

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
      className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isGenerating ? (
        <InputVisualIcon
          variant="loading"
          className="size-5 animate-spin"
        />
      ) : (
        <InputVisualIcon variant="generate" className="size-8 rounded-xl" />
      )}
      {isGenerating
        ? "QA 리포트 생성 중..."
        : isFeatureReport
          ? "기능 QA 리포트 생성"
          : "전체 QA 리포트 생성"}
    </button>
  );
}
