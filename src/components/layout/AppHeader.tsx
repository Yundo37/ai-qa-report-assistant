export function AppHeader() {
  return (
    <div className="mb-8">
      <p className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
        AI-powered QA Reporting Tool
      </p>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <h1
          onClick={() => window.location.reload()}
          className="cursor-pointer text-3xl font-bold tracking-tight text-slate-950 transition hover:text-indigo-700 sm:text-4xl"
        >
          AI QA Report Assistant
        </h1>
        <span className="pb-1 text-sm font-medium text-slate-500 sm:text-base">
          v1.0 Beta 2
        </span>
      </div>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
        TC, CL 테스트 수행 문서와 Jira 이슈 데이터를 함께 분석해 QA Result
        Report를 생성합니다.
      </p>
    </div>
  );
}
