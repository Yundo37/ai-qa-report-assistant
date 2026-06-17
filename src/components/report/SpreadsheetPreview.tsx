"use client";

import { useEffect, useRef } from "react";
import type { SpreadsheetInfo, SpreadsheetSheetInfo } from "@/types/report";

export function SpreadsheetPreview({
  spreadsheetInfo,
  selectedGids,
  autoLinkedJiraSheet,
  isExpanded,
  onToggleExpanded,
  onCloseSelection,
  onToggleSheet,
}: {
  spreadsheetInfo: SpreadsheetInfo;
  selectedGids: string[];
  autoLinkedJiraSheet?: Pick<SpreadsheetSheetInfo, "gid" | "title"> | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onCloseSelection: () => void;
  onToggleSheet: (sheet: SpreadsheetSheetInfo) => void;
}) {
  const previewRef = useRef<HTMLElement | null>(null);
  const selectedSheets = spreadsheetInfo.sheets.filter(
    (sheet) =>
      selectedGids.includes(sheet.gid) &&
      sheet.gid !== autoLinkedJiraSheet?.gid
  );

  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        previewRef.current &&
        !previewRef.current.contains(event.target as Node)
      ) {
        onCloseSelection();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isExpanded, onCloseSelection]);

  return (
    <section
      ref={previewRef}
      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-950">
          스프레드시트 미리보기
        </h3>

        <button
          type="button"
          onClick={onToggleExpanded}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700"
        >
          {isExpanded ? "완료" : "시트 선택 수정"}
        </button>
      </div>

      <div className="mt-4 space-y-4 text-sm text-slate-700">
        <div>
          <p className="text-xs font-medium text-slate-500">
            스프레드시트 제목
          </p>
          <p className="mt-1 font-medium text-slate-950">
            {spreadsheetInfo.title || "-"}
          </p>
        </div>

        {autoLinkedJiraSheet && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold text-emerald-700">
              Jira 이슈 시트가 자동 선택되었습니다.
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              선택된 Jira 시트: {autoLinkedJiraSheet.title}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-slate-500">
            선택된 시트: {selectedSheets.length}
          </p>
          {selectedSheets.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {selectedSheets.map((sheet) => (
                <li
                  key={`${sheet.gid}-${sheet.title}`}
                  className="border-b border-slate-200 pb-2 last:border-b-0 last:pb-0"
                >
                  {sheet.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-500">선택된 시트가 없습니다.</p>
          )}
        </div>

        {isExpanded && (
          <div>
            <p className="text-xs font-medium text-slate-500">시트 목록</p>
            {spreadsheetInfo.sheets.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {spreadsheetInfo.sheets.map((sheet) => {
                  const isAutoLinkedJiraSheet =
                    autoLinkedJiraSheet?.gid === sheet.gid;

                  return (
                    <li
                      key={`${sheet.gid}-${sheet.title}`}
                      className="border-b border-slate-200 pb-2 last:border-b-0 last:pb-0"
                    >
                      {isAutoLinkedJiraSheet ? (
                        <div className="flex items-center gap-3">
                          <span
                            className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500 text-[10px] font-bold leading-none text-white"
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                          <span className="min-w-0 flex-1">{sheet.title}</span>
                          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                            Jira 자동 연결됨
                          </span>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedGids.includes(sheet.gid)}
                            onChange={() => onToggleSheet(sheet)}
                            className="h-4 w-4 accent-indigo-600"
                          />
                          <span className="min-w-0 flex-1">{sheet.title}</span>
                        </label>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-slate-500">시트 목록이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
