import type { QuickScenarioSelectorProps } from "@/components/report/reportInputTypes";

export function QuickScenarioSelector({
  isFeatureReport,
  quickScenarioPresets,
  legacyQuickScenarioPresets,
  applyingQuickScenario,
  onApplyQuickScenario: applyQuickScenario,
}: QuickScenarioSelectorProps) {
  return (
    <>
      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold text-zinc-200">
          Quick Scenario
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(quickScenarioPresets).map(
        ([scenario, preset]) => {
          const isApplying = applyingQuickScenario === scenario;

          return (
            <button
              key={scenario}
              type="button"
              onClick={() => applyQuickScenario(scenario, preset)}
              disabled={Boolean(applyingQuickScenario)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApplying ? "Applying..." : scenario}
            </button>
          );
        }
          )}
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {isFeatureReport
        ? "준비된 Feature QA 시나리오로 입력값을 빠르게 세팅합니다."
        : "릴리즈 QA 결과를 기간 기준으로 빠르게 확인할 수 있습니다."}
        </p>
      </div>

      <div className="hidden">
        <label className="mb-2 block text-sm font-semibold text-zinc-200">
          Quick Scenario
        </label>
        <div className="flex flex-wrap gap-2">
          {["메인피쳐", "서브피쳐", "더미:안정", "더미:주의필요"].map(
        (scenario) => {
          const preset =
            legacyQuickScenarioPresets[
              scenario as keyof typeof legacyQuickScenarioPresets
            ];
          const isApplying = applyingQuickScenario === scenario;

          return (
            <button
              key={scenario}
              type="button"
              onClick={
            preset
              ? () => applyQuickScenario(scenario, preset)
              : undefined
              }
              disabled={Boolean(applyingQuickScenario)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApplying ? "적용 중..." : scenario}
            </button>
          );
        }
          )}
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          준비된 QA 시나리오를 통해 Result Report를 빠르게 확인할 수
          있습니다.
        </p>
      </div>
    </>
  );
}
