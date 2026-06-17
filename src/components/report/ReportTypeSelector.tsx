import { InputVisualIcon } from "@/components/report/InputVisualIcon";
import type { ReportType } from "@/types/report";
import type { ReportTypeSelectorProps } from "@/components/report/reportInputTypes";

const REPORT_TYPE_OPTIONS: Array<{
  type: ReportType;
  title: string;
  summary: string;
}> = [
  {
    type: "OVERALL",
    title: "전체 QA 리포트",
    summary: "릴리즈 단위 QA 상태와 잔여 이슈를 종합합니다.",
  },
  {
    type: "FEATURE",
    title: "Feature 리포트",
    summary: "단일 기능의 QA 결과와 Jira 이슈를 요약합니다.",
  },
];

export function ReportTypeSelector({
  reportType,
  hasSelectedReportType,
  onReportTypeChange: handleReportTypeChange,
}: ReportTypeSelectorProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          리포트 유형
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          분석 범위에 따라 전체 릴리즈 리포트 또는 단일 기능 리포트를 선택하세요.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {REPORT_TYPE_OPTIONS.map((option) => {
          const isSelected = hasSelectedReportType && reportType === option.type;

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => handleReportTypeChange(option.type)}
              className={`min-h-28 rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-100"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex h-full items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <InputVisualIcon
                    variant={
                      option.type === "OVERALL"
                        ? "report-overall"
                        : "report-feature"
                    }
                    className="size-14 shrink-0 rounded-2xl"
                    imageClassName="p-1"
                  />
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-950">
                      {option.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      {option.summary}
                    </p>
                  </div>
                </div>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
