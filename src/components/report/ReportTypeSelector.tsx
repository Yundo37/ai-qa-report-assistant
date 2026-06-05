import type { ReportTypeSelectorProps } from "@/components/report/reportInputTypes";

export function ReportTypeSelector({
  reportType,
  onReportTypeChange: handleReportTypeChange,
}: ReportTypeSelectorProps) {
  return (
    <div className="mb-8">
      <label className="mb-2 block text-sm font-semibold text-zinc-200">
        Report Type
      </label>
      <div className="flex gap-3">
        {(["OVERALL", "FEATURE"] as const).map((type) => (
      <button
        key={type}
        type="button"
        onClick={() => handleReportTypeChange(type)}
        className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
        reportType === type
          ? "bg-white text-black"
          : "border border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
        }`}
      >
        {type === "FEATURE" ? "Feature Report" : "Overall Report"}
      </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-zinc-500">
        {reportType === "FEATURE"
      ? "Feature Report는 label 기준으로 특정 피쳐 QA 결과를 분석합니다."
      : "Overall Report는 프로젝트 / 버전 단위 릴리즈 QA 결과를 기간 기준으로 분석합니다."}
      </p>
    </div>
  );
}
