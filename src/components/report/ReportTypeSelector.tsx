import type { ReportType } from "@/types/report";
import type { ReportTypeSelectorProps } from "@/components/report/reportInputTypes";

const REPORT_TYPE_OPTIONS: Array<{
  type: ReportType;
  title: string;
  summary: string;
}> = [
  {
    type: "OVERALL",
    title: "Overall Report",
    summary:
      "릴리즈 / 버전 단위의 QA 상태, RC 흐름, 잔여 이슈, Feature별 QA 결과를 종합합니다.",
  },
  {
    type: "FEATURE",
    title: "Feature Report",
    summary:
      "단일 기능의 Test Case, Jira Issue, 잔여 이슈, QA Comment를 기준으로 기능 QA 결과를 요약합니다.",
  },
];

export function ReportTypeSelector({
  reportType,
  onReportTypeChange: handleReportTypeChange,
}: ReportTypeSelectorProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Report Type
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
          보고서 유형 선택
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          생성할 QA Report 유형을 선택하세요. Overall Report가 기본 흐름입니다.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {REPORT_TYPE_OPTIONS.map((option) => {
          const isSelected = reportType === option.type;

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => handleReportTypeChange(option.type)}
              className={`min-h-32 rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-100"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-slate-950">
                    {option.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {option.summary}
                  </p>
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
