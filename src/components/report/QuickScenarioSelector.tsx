import type { QuickScenarioSelectorProps } from "@/components/report/reportInputTypes";

export function QuickScenarioSelector({
  isFeatureReport,
  quickScenarioPresets,
  legacyQuickScenarioPresets,
  applyingQuickScenario,
  onApplyQuickScenario: applyQuickScenario,
}: QuickScenarioSelectorProps) {
  return (
    <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Quick Scenario
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            빠른 시나리오
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isFeatureReport
              ? "준비된 Feature QA 시나리오로 입력값을 빠르게 세팅합니다."
              : "Overall QA Result Report 데모를 빠르게 실행할 수 있습니다."}
          </p>
        </div>
        {applyingQuickScenario && (
          <span className="w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            Applying...
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(quickScenarioPresets).map(([scenario, preset]) => {
          const isApplying = applyingQuickScenario === scenario;

          return (
            <button
              key={scenario}
              type="button"
              onClick={() => applyQuickScenario(scenario, preset)}
              disabled={Boolean(applyingQuickScenario)}
              className={`min-h-28 rounded-2xl border bg-white p-4 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isApplying
                  ? "border-indigo-500 ring-2 ring-indigo-100"
                  : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
              }`}
            >
              <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                {isFeatureReport ? "F" : "O"}
              </span>
              <span className="block text-sm font-semibold text-slate-950">
                {isApplying ? "Applying..." : scenario}
              </span>
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                {isFeatureReport
                  ? "Feature QA 결과 입력값을 자동 적용합니다."
                  : "Overall QA 결과 입력값을 자동 적용합니다."}
              </span>
            </button>
          );
        })}
      </div>

      <div className="hidden">
        {Object.entries(legacyQuickScenarioPresets).map(([scenario, preset]) => (
          <button
            key={scenario}
            type="button"
            onClick={() => applyQuickScenario(scenario, preset)}
            disabled={Boolean(applyingQuickScenario)}
          >
            {scenario}
          </button>
        ))}
      </div>
    </section>
  );
}
