export function AppHeader() {
  return (
    <div className="mb-12">
      <p className="mb-4 inline-flex rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
        AI 기반 QA 운영 지원 도구
      </p>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <h1
          onClick={() => window.location.reload()}
          className="cursor-pointer text-4xl font-bold tracking-tight transition hover:text-zinc-200 sm:text-5xl"
        >
          AI QA Report Assistant
        </h1>
        <span className="pb-1 text-sm font-medium text-zinc-500 sm:text-base">
          v1.0 Beta 2
        </span>
      </div>
      <p className="mt-6 max-w-3xl text-base leading-7 text-zinc-400">
        TC, CL 등 테스트 수행 문서와 Jira 이슈 데이터를 함께 분석해 피쳐
        단위 QA 결과 리포트를 생성합니다.
      </p>
    </div>
  );
}
