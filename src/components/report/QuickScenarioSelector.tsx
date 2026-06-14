import type { QuickScenarioSelectorProps } from "@/components/report/reportInputTypes";

export function QuickScenarioSelector({
  isFeatureReport,
  quickScenarioPresets,
  legacyQuickScenarioPresets,
  applyingQuickScenario,
  onApplyQuickScenario: applyQuickScenario,
}: QuickScenarioSelectorProps) {
  return (
    <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Quick Scenario
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
            빠른 시나리오
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {isFeatureReport
              ? "Feature QA 입력값을 빠르게 적용합니다."
              : "Overall QA Result Report 데모 입력값을 빠르게 적용합니다."}
          </p>
        </div>
        {applyingQuickScenario && (
          <span className="w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            Applying...
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(quickScenarioPresets).map(([scenario, preset]) => {
          const isApplying = applyingQuickScenario === scenario;

          return (
            <button
              key={scenario}
              type="button"
              onClick={() => applyQuickScenario(scenario, preset)}
              disabled={Boolean(applyingQuickScenario)}
              className={`min-w-[170px] rounded-2xl border bg-white px-3 py-2.5 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[190px] ${
                isApplying
                  ? "border-indigo-500 ring-2 ring-indigo-100"
                  : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600">
                  {isFeatureReport ? "F" : "O"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold leading-5 text-slate-950">
                    {isApplying ? "Applying..." : scenario}
                  </span>
                  <span className="mt-0.5 block truncate text-xs leading-4 text-slate-500">
                    {[preset.featureName, preset.version, preset.rcVersion]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
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
