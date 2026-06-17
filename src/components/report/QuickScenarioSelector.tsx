import type { QuickScenarioSelectorProps } from "@/components/report/reportInputTypes";

export function QuickScenarioSelector({
  isFeatureReport,
  quickScenarioPresets,
  legacyQuickScenarioPresets,
  applyingQuickScenario,
  onApplyQuickScenario: applyQuickScenario,
}: QuickScenarioSelectorProps) {
  const scenarioEntries = Object.entries(quickScenarioPresets);
  const scenarioGroups = isFeatureReport
    ? [
        scenarioEntries.filter(([scenario]) => scenario.startsWith("메인피쳐")),
        scenarioEntries.filter(([scenario]) => scenario.startsWith("서브피쳐")),
      ].filter((group) => group.length > 0)
    : [scenarioEntries];

  return (
    <section
      id="quick-scenario-section"
      className="scroll-mt-8 rounded-2xl border border-indigo-100 bg-white/90 px-3 py-2 shadow-sm sm:px-3.5 sm:py-2.5"
    >
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            빠른 시나리오
          </p>
          <p className="mt-0.5 text-xs leading-4 text-slate-500">
            예시 데이터로 입력값을 바로 채웁니다.
          </p>
        </div>
        {applyingQuickScenario && (
          <span className="w-fit rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            Applying...
          </span>
        )}
      </div>

      <div className="space-y-2">
        {scenarioGroups.map((scenarioGroup, groupIndex) => (
          <div
            key={groupIndex}
            className="flex flex-wrap justify-start gap-2"
          >
            {scenarioGroup.map(([scenario, preset]) => {
              const isApplying = applyingQuickScenario === scenario;

              return (
                <button
                  key={scenario}
                  type="button"
                  onClick={() => applyQuickScenario(scenario, preset)}
                  disabled={Boolean(applyingQuickScenario)}
                  className={`inline-flex h-9 w-fit items-center rounded-full border bg-white px-3.5 py-1.5 text-left text-sm font-semibold leading-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isApplying
                      ? "border-indigo-500 ring-2 ring-indigo-100"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                  }`}
                >
                  <span className="block min-w-0 text-slate-950">
                    <span className="block truncate">
                      {isApplying ? "Applying..." : scenario}
                    </span>
                    {isApplying && (
                      <span className="mt-0.5 block truncate text-xs leading-4 text-slate-500">
                        입력값 적용 중
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
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
