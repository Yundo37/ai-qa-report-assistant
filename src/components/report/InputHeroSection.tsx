import { InputVisualIcon } from "@/components/report/InputVisualIcon";

export function InputHeroSection() {
  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-indigo-100 bg-[radial-gradient(circle_at_12%_28%,rgba(109,94,246,0.18),transparent_36%),radial-gradient(circle_at_88%_18%,rgba(139,92,246,0.15),transparent_34%),linear-gradient(135deg,rgba(255,255,255,1),rgba(248,250,255,0.96))] px-6 py-8 shadow-sm sm:px-8 lg:px-10">
      <div className="grid gap-7 lg:grid-cols-[1fr_280px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <InputVisualIcon variant="brand" className="size-12" />
            <h1
              onClick={() => window.location.reload()}
              className="cursor-pointer text-3xl font-bold tracking-tight text-slate-950 transition hover:text-indigo-700 sm:text-4xl"
            >
              QA 리포트 생성 대시보드
            </h1>
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
              v1.0 Beta 3
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Google Spreadsheet 기반 QA 데이터를 분석해 기능 QA 리포트와 전체 QA 결과 리포트를 생성합니다.
            <br />
            반복적인 QA 리포트 작성 시간을 줄이고, 릴리즈 판단에 필요한 리스크 정보를 구조화합니다.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-950">
            리포트 생성 흐름
          </p>
          <ol className="mt-3 space-y-2 text-xs text-slate-600">
            {[
              "리포트 유형 선택",
              "빠른 시나리오 적용",
              "QA/Jira 시트 연결",
              "기간·필터 확인",
              "QA 리포트 생성",
            ].map((item, index) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
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
