export function InputHeroSection() {
  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            QA Report Generation Dashboard
          </p>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <h1
              onClick={() => window.location.reload()}
              className="cursor-pointer text-3xl font-bold tracking-tight text-slate-950 transition hover:text-indigo-700 sm:text-4xl"
            >
              AI QA Report Assistant
            </h1>
            <span className="pb-1 text-sm font-semibold text-slate-500 sm:text-base">
              v1.0 Beta 2
            </span>
          </div>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
            Google Spreadsheet 기반 QA 데이터를 분석하여 Feature 및 Overall QA
            Result Report를 생성합니다.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-950">Report Flow</p>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            {[
              "Report Type 선택",
              "Quick Scenario 적용",
              "Sheet 연결",
              "QA Report 생성",
            ].map((item, index) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
