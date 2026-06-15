"use client";

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
          <span className="text-xs font-bold text-slate-700">AI 분석</span>
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            onClick={() =>
              onAnalysisModeChange(isEnabled ? "BASIC" : "AI_ENHANCED")
            }
            className={`flex h-6 w-12 shrink-0 items-center rounded-full p-0.5 text-[10px] font-bold transition ${
              isEnabled
                ? "justify-end bg-indigo-600 text-white"
                : "justify-start bg-slate-300 text-slate-700"
            }`}
          >
            <span className="grid h-5 min-w-6 place-items-center rounded-full bg-white px-1.5 text-slate-900 shadow-sm">
              {isEnabled ? "ON" : "OFF"}
            </span>
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
