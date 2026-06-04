import type { ReportBasicInfoFormProps } from "@/components/report/reportInputTypes";

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
    <>
      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold text-zinc-200">
          {isFeatureReport ? "Feature Name" : "Overall Report Title"}
        </label>
        <p className="mb-3 text-sm leading-6 text-zinc-500">
          {isFeatureReport
        ? "결과 리포트에 사용할 피쳐명을 입력하세요."
        : "전체 QA 결과 리포트에 사용할 프로젝트명과 버전을 입력하세요."}
          <br />
          {isFeatureReport
        ? "예: 결제 / 알림 / 이벤트 응모 / 멤버십"
        : "예: 디어스 2.0.0 / A프로젝트 2.0.0"}
        </p>
        <p className="hidden">
          결과 리포트에 사용할 피쳐명을 입력하세요.
          <br />
          예: 결제 / 알림 / 이벤트 응모 / 멤버십
        </p>
        <input
          type="text"
          value={reportTitle}
          onChange={(event) => setReportTitle(event.target.value)}
          placeholder={
        isFeatureReport ? "예: 결제" : "예: 디어스 2.0.0"
          }
          className="min-h-11 w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
        />
      </div>

      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold text-zinc-200">
          Version / RC
        </label>
        <p className="mb-3 text-sm leading-6 text-zinc-500">
          미입력 시 Jira Version / RC 기준 자동 추론
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-40">
        <label className="mb-2 block text-xs font-medium text-zinc-400">
          Build Version
        </label>
        <input
          type="text"
          value={reportVersion}
          onChange={(event) => setReportVersion(event.target.value)}
          placeholder="2.0.0"
          className="min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
        />
          </div>
          <div className="w-full sm:w-32">
        <label className="mb-2 block text-xs font-medium text-zinc-400">
          Report RC Version
        </label>
        <input
          type="text"
          value={reportRcVersion}
          onChange={(event) => setReportRcVersion(event.target.value)}
          placeholder="RC3"
          className="min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
        />
          </div>
        </div>
      </div>
    </>
  );
}
