"use client";

import { InputVisualIcon } from "@/components/report/InputVisualIcon";
import type { AiAnalysisToggleProps } from "@/components/report/reportInputTypes";

export function AiAnalysisToggle({
  analysisMode,
  onAnalysisModeChange,
}: AiAnalysisToggleProps) {
  const isEnabled = analysisMode === "AI_ENHANCED";

  return (
    <div className="flex justify-end pt-1">
      <div className="flex flex-col items-end gap-1 text-right">
        <div className="flex items-center gap-2">
          {isEnabled && (
            <InputVisualIcon variant="ai-sparkle" className="size-6" />
          )}
          <span className="text-xs font-bold text-slate-700">AI 분석</span>
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            aria-label={isEnabled ? "AI 분석 끄기" : "AI 분석 켜기"}
            onClick={() =>
              onAnalysisModeChange(isEnabled ? "BASIC" : "AI_ENHANCED")
            }
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
              isEnabled
                ? "justify-end bg-indigo-600"
                : "justify-start bg-slate-300"
            }`}
          >
            <span className="block h-5 w-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>
        <span className="text-xs leading-5 text-slate-500">
          {isEnabled
            ? "리스크 신호, 반복 패턴, QA 확인 방향 포함"
            : "AI 호출 없이 기본 리포트만 생성"}
        </span>
      </div>
    </div>
  );
}
