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
  const selectedSheets = spreadsheetInfo.sheets.filter((sheet) =>
    selectedGids.includes(sheet.gid)
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
      className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">
          Spreadsheet Preview
        </h3>

        <button
          type="button"
          onClick={onToggleExpanded}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-400 hover:text-white"
        >
          {isExpanded ? "Done" : "Edit Sheet Selection"}
        </button>
      </div>

      <div className="mt-4 space-y-4 text-sm text-zinc-300">
        <div>
          <p className="text-xs font-medium text-zinc-500">
            Spreadsheet Title
          </p>
          <p className="mt-1 text-zinc-100">{spreadsheetInfo.title || "-"}</p>
        </div>

        {autoLinkedJiraSheet && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3">
            <p className="text-xs font-semibold text-emerald-300">
              Jira Issue Sheet가 자동 선택되었습니다.
            </p>
            <p className="mt-1 text-xs text-emerald-100/80">
              선택된 Jira 시트: {autoLinkedJiraSheet.title}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-zinc-500">
            Selected Sheets: {selectedSheets.length}
          </p>
          {selectedSheets.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {selectedSheets.map((sheet) => (
                <li
                  key={`${sheet.gid}-${sheet.title}`}
                  className="border-b border-zinc-900 pb-2 last:border-b-0 last:pb-0"
                >
                  {sheet.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-zinc-500">선택된 시트가 없습니다.</p>
          )}
        </div>

        {isExpanded && (
          <div>
            <p className="text-xs font-medium text-zinc-500">Sheet List</p>
            {spreadsheetInfo.sheets.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {spreadsheetInfo.sheets.map((sheet) => (
                  <li
                    key={`${sheet.gid}-${sheet.title}`}
                    className="border-b border-zinc-900 pb-2 last:border-b-0 last:pb-0"
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedGids.includes(sheet.gid)}
                        onChange={() => onToggleSheet(sheet)}
                        className="h-4 w-4 accent-white"
                      />
                      <span className="min-w-0 flex-1">{sheet.title}</span>
                      {autoLinkedJiraSheet?.gid === sheet.gid && (
                        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2 py-1 text-[11px] font-medium text-emerald-300">
                          Jira로 자동 연결됨
                        </span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-zinc-500">Sheet 목록이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
