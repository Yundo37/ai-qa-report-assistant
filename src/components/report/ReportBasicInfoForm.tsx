import type { ReportBasicInfoFormProps } from "@/components/report/reportInputTypes";

const inputClassName =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function ReportBasicInfoForm({
  isFeatureReport,
  reportTitle,
  setReportTitle,
  reportVersion,
  setReportVersion,
  reportRcVersion,
  setReportRcVersion,
}: ReportBasicInfoFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800">
          {isFeatureReport ? "기능명" : "전체 QA 리포트 제목"}
        </label>
        <p className="mb-3 text-sm leading-6 text-slate-500">
          {isFeatureReport
            ? "결과 리포트에 사용할 기능명을 입력하세요."
            : "전체 QA 결과 리포트에 사용할 프로젝트명과 버전을 입력하세요."}
        </p>
        <input
          type="text"
          value={reportTitle}
          onChange={(event) => setReportTitle(event.target.value)}
          placeholder={isFeatureReport ? "예: 결제" : "예: 2.0.0 전체 QA 리포트"}
          className={`${inputClassName} max-w-xl`}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800">
          버전 / RC
        </label>
        <p className="mb-3 text-sm leading-6 text-slate-500">
          비워두면 Jira 버전 / RC 기준으로 자동 추론됩니다.
        </p>
        <div className="grid gap-3 sm:grid-cols-[160px_140px]">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-500">
              빌드 버전
            </label>
            <input
              type="text"
              value={reportVersion}
              onChange={(event) => setReportVersion(event.target.value)}
              placeholder="2.0.0"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-500">
              리포트 RC 버전
            </label>
            <input
              type="text"
              value={reportRcVersion}
              onChange={(event) => setReportRcVersion(event.target.value)}
              placeholder="RC3"
              className={inputClassName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
